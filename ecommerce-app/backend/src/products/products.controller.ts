import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
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
import { CreateProductDto } from './dto/create-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';

@Controller()
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get('store/products')
  @UseInterceptors(CacheKeyInterceptor)
  @CacheTTL(300)
  listProducts(@Query() query: ProductQueryDto) {
    return this.productsService.listProducts(query);
  }

  @Get('admin/products')
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @UseGuards(AdminJwtGuard, IpWhitelistGuard)
  listProductsForAdmin(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('q') q = '',
  ) {
    const parsedPage = Number.parseInt(page, 10) || 1;
    const parsedLimit = Number.parseInt(limit, 10) || 20;

    return this.productsService.listProductsForAdmin(parsedPage, parsedLimit, q);
  }

  @Get('store/products/:slug')
  @UseInterceptors(CacheKeyInterceptor)
  @CacheTTL(300)
  getProductBySlug(@Param('slug') slug: string) {
    return this.productsService.getProductBySlug(slug);
  }

  @Post('admin/products')
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @UseGuards(AdminJwtGuard, IpWhitelistGuard)
  createProduct(@Body() dto: CreateProductDto) {
    return this.productsService.createProduct(dto);
  }

  @Put('admin/products/:id')
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @UseGuards(AdminJwtGuard, IpWhitelistGuard)
  updateProduct(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.updateProduct(id, dto);
  }

  @Delete('admin/products/:id')
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @UseGuards(AdminJwtGuard, IpWhitelistGuard)
  softDeleteProduct(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.productsService.softDeleteProduct(id);
  }
}
