import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CacheTTL } from '@nestjs/cache-manager';
import { Throttle } from '@nestjs/throttler';
import { AdminJwtGuard } from '../common/guards/admin-jwt.guard';
import { IpWhitelistGuard } from '../common/guards/ip-whitelist.guard';
import { CacheKeyInterceptor } from '../common/interceptors/cache-key.interceptor';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Controller()
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get('store/categories')
  @UseInterceptors(CacheKeyInterceptor)
  @CacheTTL(3600)
  getCategoryTree(): Promise<unknown> {
    return this.categoriesService.getCategoryTree();
  }

  @Get('store/categories/:slug/products')
  getCategoryProducts(
    @Param('slug') slug: string,
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 20,
  ) {
    return this.categoriesService.getCategoryProducts(slug, page, limit);
  }

  @Post('admin/categories')
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @UseGuards(AdminJwtGuard, IpWhitelistGuard)
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.createCategory(dto);
  }

  @Put('admin/categories/:id')
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @UseGuards(AdminJwtGuard, IpWhitelistGuard)
  updateCategory(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoriesService.updateCategory(id, dto);
  }
}
