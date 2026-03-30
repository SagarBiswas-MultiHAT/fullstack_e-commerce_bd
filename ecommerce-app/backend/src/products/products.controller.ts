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
} from '@nestjs/common';
import { AdminJwtGuard } from '../common/guards/admin-jwt.guard';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';

@Controller()
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get('store/products')
  listProducts(@Query() query: ProductQueryDto) {
    return this.productsService.listProducts(query);
  }

  @Get('store/products/:slug')
  getProductBySlug(@Param('slug') slug: string) {
    return this.productsService.getProductBySlug(slug);
  }

  @Post('admin/products')
  @UseGuards(AdminJwtGuard)
  createProduct(@Body() dto: CreateProductDto) {
    return this.productsService.createProduct(dto);
  }

  @Put('admin/products/:id')
  @UseGuards(AdminJwtGuard)
  updateProduct(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.updateProduct(id, dto);
  }

  @Delete('admin/products/:id')
  @UseGuards(AdminJwtGuard)
  softDeleteProduct(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.productsService.softDeleteProduct(id);
  }
}
