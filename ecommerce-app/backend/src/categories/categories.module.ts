import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminJwtGuard } from '../common/guards/admin-jwt.guard';
import { IpWhitelistGuard } from '../common/guards/ip-whitelist.guard';
import { CacheKeyInterceptor } from '../common/interceptors/cache-key.interceptor';
import { Category } from '../entities/category.entity';
import { Product } from '../entities/product.entity';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';

@Module({
  imports: [TypeOrmModule.forFeature([Category, Product])],
  controllers: [CategoriesController],
  providers: [CategoriesService, AdminJwtGuard, IpWhitelistGuard, CacheKeyInterceptor],
})
export class CategoriesModule {}
