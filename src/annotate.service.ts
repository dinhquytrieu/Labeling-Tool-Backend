import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class AnnotateService {
  private openai: OpenAI | null;
  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    this.openai = apiKey ? new OpenAI({ apiKey }) : null;
  }

  async predict(imageBase64: string) {
    console.log('Predicting...');
    // Validate base64 image format
    if (!imageBase64.startsWith('data:image/')) {
      throw new Error('Invalid image format. Please provide a valid base64 image.');
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
      const prompt = `You are a UI annotation assistant. Given an image of a UI, return a JSON array of bounding boxes and tags for each UI component. Use this schema:\n{\n  "annotations": [\n    { "x": <number>, "y": <number>, "width": <number>, "height": <number>, "tag": "Button|Input|Radio|Dropdown" }\n  ]\n}\nOnly return valid JSON.`;
      
      const response = await this.openai.responses.create({
        model: 'gpt-4.1',
        input: [
          {
            role: 'user',
            content: [
              { type: 'input_text', text: 'You are a UI annotation assistant. Given an image of a UI, return a JSON array of bounding boxes and tags for each UI component. Use this schema:\n{\n  "annotations": [\n    { "x": <number>, "y": <number>, "width": <number>, "height": <number>, "tag": "Button|Input|Radio|Dropdown" }\n  ]\n}\nOnly return valid JSON.' },
              {
                type: 'input_image',
                image_url: formattedImageUrl,
                detail: 'high',
              },
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