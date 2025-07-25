import { Controller, Post, Body, HttpException, HttpStatus, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AnnotateService } from './annotate.service';
import { CloudinaryService } from './cloudinary.service';

@Controller('annotate')
export class AnnotateController {
  constructor(
    private readonly annotateService: AnnotateService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('image'))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No image file provided');
    }

    // Validate file type
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type. Only JPEG, PNG, and WebP are allowed.');
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      throw new BadRequestException('File too large. Maximum size is 10MB.');
    }

    try {
      const result = await this.cloudinaryService.uploadImage(file);
      return {
        url: result.url,
        public_id: result.public_id,
        filename: file.originalname,
      };
    } catch (error) {
      console.error('Image upload failed:', error);
      throw new HttpException('Image upload failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('upload-base64')
  async uploadBase64(@Body() body: { image: string; filename?: string }) {
    if (!body.image) {
      throw new BadRequestException('Base64 image is required');
    }

    if (!body.image.startsWith('data:image/')) {
      throw new BadRequestException('Invalid base64 image format');
    }

    try {
      const result = await this.cloudinaryService.uploadBase64Image(body.image);
      return {
        url: result.url,
        public_id: result.public_id,
        filename: body.filename || 'uploaded.png',
      };
    } catch (error) {
      console.error('Base64 image upload failed:', error);
      throw new HttpException('Image upload failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('predict')
  async predict(@Body() body: { image?: string; imageUrl?: string }) {
    if (!body.image && !body.imageUrl) {
      throw new HttpException('Either image (base64) or imageUrl is required', HttpStatus.BAD_REQUEST);
    }
    try {
      console.log('Predicting...');
      const imageInput = body.image || body.imageUrl!;
      return await this.annotateService.predict(imageInput);
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