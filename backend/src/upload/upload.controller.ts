import {
  BadRequestException,
  Controller,
  Post,
  Query,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Throttle } from '@nestjs/throttler';
import { AdminJwtGuard } from '../common/guards/admin-jwt.guard';
import { IpWhitelistGuard } from '../common/guards/ip-whitelist.guard';
import { UploadService } from './upload.service';

@Controller('admin/upload')
@UseGuards(AdminJwtGuard, IpWhitelistGuard)
@Throttle({ default: { limit: 60, ttl: 60_000 } })
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async uploadSingle(
    @UploadedFile() file: Express.Multer.File,
    @Query('productId') productId?: string,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const url = await this.uploadService.uploadFile(file, productId ?? 'general');

    return { url };
  }

  @Post('multiple')
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async uploadMultiple(
    @UploadedFiles() files: Express.Multer.File[],
    @Query('productId') productId?: string,
  ) {
    if (!files?.length) {
      throw new BadRequestException('At least one file is required');
    }

    const urls: string[] = [];

    for (const file of files) {
      urls.push(await this.uploadService.uploadFile(file, productId ?? 'general'));
    }

    return { urls };
  }
}
