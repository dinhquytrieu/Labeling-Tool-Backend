import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async uploadImage(file: Express.Multer.File): Promise<{ url: string; public_id: string }> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'image',
          folder: 'labeling-tool',
          format: 'jpg', // Convert to jpg for consistency
          quality: 'auto',
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve({
              url: result!.secure_url,
              public_id: result!.public_id,
            });
          }
        }
      ).end(file.buffer);
    });
  }

  async uploadBase64Image(base64String: string): Promise<{ url: string; public_id: string }> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload(
        base64String,
        {
          resource_type: 'image',
          folder: 'labeling-tool',
          format: 'jpg',
          quality: 'auto',
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve({
              url: result!.secure_url,
              public_id: result!.public_id,
            });
          }
        }
      );
    });
  }

  async deleteImage(publicId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.destroy(publicId, (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }
} 