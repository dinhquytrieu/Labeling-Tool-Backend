import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class AnnotateService {
  private openai: OpenAI | null;
  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    this.openai = apiKey ? new OpenAI({ apiKey }) : null;
  }

  async predict(imageInput: string) {
    console.log('Predicting...', imageInput);
    // Determine if input is base64 or URL
    const isBase64 = imageInput.startsWith('data:image/');
    const isUrl = imageInput.startsWith('http://') || imageInput.startsWith('https://');
    
    if (!isBase64 && !isUrl) {
      throw new Error('Invalid image format. Please provide a valid base64 image or URL.');
    }

    if (!this.openai) {
      // Return mock data if no API key
      return {
        image_filename: 'uploaded.png',
        annotations: [
          { x: 100, y: 100, width: 120, height: 40, tag: 'Button' },
          { x: 250, y: 200, width: 180, height: 50, tag: 'Input' },
        ],
      };
    }

    console.log('ready for openai');
    
    // Extract just the base64 part from the data URL
    // imageBase64 format: "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
    // We need just the base64 part after the comma
    const base64Match = imageBase64.match(/^data:image\/[a-zA-Z]+;base64,(.+)$/);
    if (!base64Match) {
      throw new Error('Invalid base64 image format');
    }
    const pureBase64 = base64Match[1];
    
    // Determine image type from the data URL
    const imageTypeMatch = imageBase64.match(/^data:image\/([a-zA-Z]+);base64,/);
    const imageType = imageTypeMatch ? imageTypeMatch[1] : 'jpeg';
    
    // Format the image URL as shown in the reference code
    const formattedImageUrl = `data:image/${imageType};base64,${pureBase64}`;

    // Call OpenAI API using the correct structure from the reference code
    try {
      const prompt = 
        `You are a UI annotation assistant. Given an image of a user interface (UI), analyze the image and identify up to 10 distinct UI components. For each component, return a bounding box and a tag describing its type. Use only these tags: Button, Input, Radio, Dropdown. For each annotation, provide the top-left x and y coordinates, width, height, and the tag. Return the result as a JSON object with this schema:

        {
          "annotations": [
            { "x": <number>, "y": <number>, "width": <number>, "height": <number>, "tag": "Button|Input|Radio|Dropdown" }
          ]
        }

        Only return valid JSON. Do not include any explanations or extra text. Focus on accuracy and completeness. If you are unsure about a component, only include it if it clearly matches one of the allowed tags.`;
      
      // const response = await this.openai.chat.completions.create({
      //   model: 'gpt-4o',
      //   messages: [
      //     { role: 'system', content: prompt },
      //     {
      //       role: 'user',
      //       content: [
      //         { type: 'text', text: 'Analyze this UI image and return bounding boxes for UI components.' },
      //         { 
      //           type: 'image_url', 
      //           image_url: { 
      //             url: imageInput,
      //             detail: 'high'
      //           } 
      //         },
      //       ],
      //     },
      //   ],
      //   max_tokens: 1024,
      //   temperature: 0.2,
      // });

      const response = await this.openai.responses.create({
        model: 'gpt-4.1',
        input: [
          // { role: 'user', content: prompt },
          {
            role: 'user',
            content: [
              { type: 'input_text', text: prompt },
              { type: 'input_image', image_url: imageInput, detail: 'high' },
            ],
          },
        ],
      });

      console.log('Response:', response);
      // Parse the JSON from the LLM's response
      const text = response.output_text;
      try {
        const parsed = JSON.parse(text || '{}');
        // Validate the response format
        if (!parsed.annotations || !Array.isArray(parsed.annotations)) {
          return { image_filename: 'uploaded.png', annotations: [] };
        }
        // Validate each annotation has required fields
        const validAnnotations = parsed.annotations.filter((ann: any) => 
          typeof ann.x === 'number' && 
          typeof ann.y === 'number' && 
          typeof ann.width === 'number' && 
          typeof ann.height === 'number' && 
          typeof ann.tag === 'string' &&
          ['Button', 'Input', 'Radio', 'Dropdown'].includes(ann.tag)
        );
        return { 
          image_filename: 'uploaded.png', 
          annotations: validAnnotations 
        };
      } catch (error) {
        console.error('Failed to parse LLM response:', error);
        return { image_filename: 'uploaded.png', annotations: [] };
      }
    } catch (error) {
      console.error('OpenAI API call failed:', error);
      return { image_filename: 'uploaded.png', annotations: [] };
    }
  }
} 