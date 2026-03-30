import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheKeyInterceptor } from '../common/interceptors/cache-key.interceptor';
import { Category } from '../entities/category.entity';
import { Product } from '../entities/product.entity';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Product, Category])],
  controllers: [SearchController],
  providers: [SearchService, CacheKeyInterceptor],
  exports: [SearchService],
})
export class SearchModule {}