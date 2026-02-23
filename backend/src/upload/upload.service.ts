import { Injectable } from '@nestjs/common';
import { v2 as cloudinary, ConfigOptions } from 'cloudinary';

@Injectable()
export class UploadService {
  private readonly cloudinaryConfig: ConfigOptions = {
    cloud_name: 'daytrfyrg',
    api_key: '784438178628159',
    api_secret: 'DHKWrW5-kS_ItxG1TibCZNEnGgM',
  };

  constructor() {
    // Configure Cloudinary on startup
    cloudinary.config(this.cloudinaryConfig);
    console.log('Cloudinary configured with cloud_name:', this.cloudinaryConfig.cloud_name);
  }

  private ensureConfig() {
    // Re-apply config before each operation to ensure it's set
    cloudinary.config(this.cloudinaryConfig);
  }

  async uploadImage(
    file: Express.Multer.File,
    folder: string = 'petcare',
  ): Promise<any> {
    // Ensure config is applied
    this.ensureConfig();

    console.log('=== CLOUDINARY UPLOAD SERVICE ===');
    console.log('Folder:', folder);
    console.log('File info:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      bufferLength: file.buffer?.length || 'NO BUFFER',
    });
    console.log('Using cloud_name:', this.cloudinaryConfig.cloud_name);
    console.log('Using api_key:', this.cloudinaryConfig.api_key);

    // Validate buffer exists
    if (!file.buffer || file.buffer.length === 0) {
      throw new Error('File buffer is empty. Make sure multer is using memoryStorage.');
    }

    // Use base64 upload method (more reliable than stream)
    const base64String = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;

    console.log('Uploading to Cloudinary using base64 method...');
    console.log('Base64 string length:', base64String.length);

    try {
      const result = await cloudinary.uploader.upload(base64String, {
        folder: folder,
        resource_type: 'image',
        transformation: [
          { quality: 'auto:good' },
          { fetch_format: 'auto' },
        ],
      });

      console.log('=== CLOUDINARY SUCCESS ===');
      console.log('Uploaded to:', result.secure_url);
      return result;
    } catch (error: any) {
      console.error('=== CLOUDINARY ERROR ===');
      console.error('Error message:', error.message);
      console.error('Error:', error);
      throw new Error(error.message || 'Cloudinary upload failed');
    }
  }

  async deleteImage(publicId: string): Promise<any> {
    this.ensureConfig();
    return cloudinary.uploader.destroy(publicId);
  }
}
