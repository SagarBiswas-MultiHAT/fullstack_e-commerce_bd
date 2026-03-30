import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AdminJwtGuard } from '../common/guards/admin-jwt.guard';
import { IpWhitelistGuard } from '../common/guards/ip-whitelist.guard';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';

@Module({
  imports: [ConfigModule],
  controllers: [UploadController],
  providers: [UploadService, AdminJwtGuard, IpWhitelistGuard],
  exports: [UploadService],
})
export class UploadModule {}
