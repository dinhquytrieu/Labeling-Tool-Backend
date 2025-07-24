import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { AnnotateService } from './annotate.service';

@Controller('annotate')
export class AnnotateController {
  constructor(private readonly annotateService: AnnotateService) {}

  @Post('predict')
  async predict(@Body() body: { image: string }) {
    if (!body.image) {
      throw new HttpException('Image is required', HttpStatus.BAD_REQUEST);
    }
    try {
      console.log('Predicting...');
      return await this.annotateService.predict(body.image);
    } catch (e) {
      throw new HttpException('Prediction failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Optional: store ground-truth labels
  @Post('ground-truth')
  async storeGroundTruth(@Body() body: any) {
    // No-op or save to disk/db if desired
    return { status: 'ok' };
  }
} 