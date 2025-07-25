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

    // console.log('OpenAI API key:', this.openai);

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
    // Call OpenAI Vision API (GPT-4o or GPT-4V)
    try {
      const prompt = `You are a UI annotation assistant. Given an image of a user interface (UI), analyze the image and identify up to 10 distinct UI components. For each component, return a bounding box and a tag describing its type. Use only these tags: Button, Input, Radio, Dropdown. For each annotation, provide the top-left x and y coordinates, width, height, and the tag. Return the result as a JSON object with this schema:

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
        model: 'gpt-4.1-mini',
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
        // model: 'gpt-4o',
        // input: [
        //   { role: 'system', content: prompt },
        //   {
        //     role: 'user',
        //     content: [
        //       { type: 'text', text: 'Analyze this UI image and return bounding boxes for UI components.' },
        //       { type: 'image_url', image_url: { url: imageBase64 } },
        //     ],
        //   },
        // ],
        // max_tokens: 1024,
        // temperature: 0.2,
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