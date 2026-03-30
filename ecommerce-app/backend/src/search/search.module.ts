import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from '../entities/category.entity';
import { Product } from '../entities/product.entity';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Product, Category])],
  controllers: [SearchController],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}