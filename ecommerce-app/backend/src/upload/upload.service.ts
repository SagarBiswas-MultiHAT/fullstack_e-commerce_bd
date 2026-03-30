import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import { sanitizeFilename } from '../common/utils/sanitize';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly bucketName = 'product-images';
  private readonly maxFileSize = 5 * 1024 * 1024;
  private readonly allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
  private readonly supabase: SupabaseClient;

  constructor(private readonly configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL') ?? '';
    const serviceKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    if (!supabaseUrl || !serviceKey) {
      this.logger.warn('Supabase storage env vars are missing. Uploads will fail until configured.');
    }

    this.supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });
  }

  async uploadFile(file: Express.Multer.File, folder: string): Promise<string> {
    this.validateFile(file);

    const fileName = this.buildFileName(file.originalname, file.mimetype);
    const safeFolder = sanitizeFilename(folder) || 'general';
    const path = `products/${safeFolder}/${fileName}`;

    const { error } = await this.supabase.storage
      .from(this.bucketName)
      .upload(path, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      throw new BadRequestException(`File upload failed: ${error.message}`);
    }

    const { data } = this.supabase.storage.from(this.bucketName).getPublicUrl(path);

    return data.publicUrl;
  }

  async deleteFile(filePath: string) {
    const cleanedPath = filePath.replace(/^https?:\/\/[^/]+\/storage\/v1\/object\/public\/product-images\//, '');

    const { error } = await this.supabase.storage.from(this.bucketName).remove([cleanedPath]);

    if (error) {
      throw new BadRequestException(`File delete failed: ${error.message}`);
    }

    return { success: true };
  }

  private validateFile(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (!this.allowedMimeTypes.has(file.mimetype)) {
      throw new BadRequestException('Only JPG, PNG, and WEBP files are allowed');
    }

    if (file.size > this.maxFileSize) {
      throw new BadRequestException('File size exceeds 5MB limit');
    }
  }

  private buildFileName(originalName: string, mimeType: string) {
    const fallbackExt = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg';
    const originalExt = originalName.includes('.')
      ? originalName.slice(originalName.lastIndexOf('.') + 1).toLowerCase()
      : fallbackExt;

    const baseName = sanitizeFilename(originalName.replace(/\.[^.]+$/, '')) || 'image';

    return `${randomUUID()}-${baseName}.${sanitizeFilename(originalExt) || fallbackExt}`;
  }
}
