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
} from '@nestjs/common';
import { AdminJwtGuard } from '../common/guards/admin-jwt.guard';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Controller()
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get('store/categories')
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
  @UseGuards(AdminJwtGuard)
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.createCategory(dto);
  }

  @Put('admin/categories/:id')
  @UseGuards(AdminJwtGuard)
  updateCategory(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoriesService.updateCategory(id, dto);
  }
}
