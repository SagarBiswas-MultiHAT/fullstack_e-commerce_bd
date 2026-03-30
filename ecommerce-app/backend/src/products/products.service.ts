import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Cache } from 'cache-manager';
import { Repository } from 'typeorm';
import { Product } from '../entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductQueryDto, ProductSort } from './dto/product-query.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { SearchService } from '../search/search.service';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    private readonly searchService: SearchService,
  ) {}

  async listProducts(query: ProductQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;

    const qb = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .where('product.is_active = :isActive', { isActive: true });

    if (query.category) {
      qb.andWhere('category.slug = :category', { category: query.category });
    }

    if (query.minPrice !== undefined) {
      qb.andWhere('product.price >= :minPrice', { minPrice: query.minPrice });
    }

    if (query.maxPrice !== undefined) {
      qb.andWhere('product.price <= :maxPrice', { maxPrice: query.maxPrice });
    }

    if (query.inStock) {
      qb.andWhere('product.stock > 0');
    }

    switch (query.sort) {
      case ProductSort.PRICE_ASC:
        qb.orderBy('product.price', 'ASC');
        break;
      case ProductSort.PRICE_DESC:
        qb.orderBy('product.price', 'DESC');
        break;
      case ProductSort.POPULAR:
        qb.orderBy(
          '(SELECT COALESCE(SUM(oi.quantity), 0) FROM order_items oi WHERE oi.product_id = product.id)',
          'DESC',
        );
        break;
      case ProductSort.NEWEST:
      default:
        qb.orderBy('product.created_at', 'DESC');
        break;
    }

    const [items, total] = await qb.skip(offset).take(limit).getManyAndCount();

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async listProductsForAdmin(page = 1, limit = 20, search = '') {
    const qb = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .orderBy('product.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (search.trim()) {
      qb.andWhere('LOWER(product.title) LIKE :query', {
        query: `%${search.trim().toLowerCase()}%`,
      });
    }

    const [items, total] = await qb.getManyAndCount();

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getProductBySlug(slug: string) {
    const product = await this.productRepository.findOne({
      where: { slug, isActive: true },
      relations: {
        category: true,
        reviews: true,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async createProduct(dto: CreateProductDto) {
    const product = this.productRepository.create({
      title: dto.title,
      slug: dto.slug,
      description: dto.description ?? null,
      price: this.toMoneyString(dto.price),
      discountPrice:
        dto.discountPrice !== undefined ? this.toMoneyString(dto.discountPrice) : null,
      stock: dto.stock,
      images: dto.images ?? [],
      isActive: dto.isActive ?? true,
      categoryId: dto.categoryId ?? null,
    });

    const savedProduct = await this.productRepository.save(product);
    await this.invalidatePublicCache();
    this.logger.log(`Product created: ${savedProduct.id}`);

    this.searchService.indexProduct(savedProduct.id).catch((error: unknown) => {
      this.logger.warn(
        `Product ${savedProduct.id} was created but search index update failed.`,
        error instanceof Error ? error.stack : undefined,
      );
    });

    return savedProduct;
  }

  async updateProduct(id: string, dto: UpdateProductDto) {
    const product = await this.productRepository.findOneBy({ id });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (dto.title !== undefined) product.title = dto.title;
    if (dto.slug !== undefined) product.slug = dto.slug;
    if (dto.description !== undefined) product.description = dto.description;
    if (dto.price !== undefined) product.price = this.toMoneyString(dto.price);
    if (dto.discountPrice !== undefined) {
      product.discountPrice = this.toMoneyString(dto.discountPrice);
    }
    if (dto.stock !== undefined) product.stock = dto.stock;
    if (dto.images !== undefined) product.images = dto.images;
    if (dto.isActive !== undefined) product.isActive = dto.isActive;
    if (dto.categoryId !== undefined) product.categoryId = dto.categoryId;

    const savedProduct = await this.productRepository.save(product);
    await this.invalidatePublicCache();
    this.logger.log(`Product updated: ${savedProduct.id}`);

    this.searchService.indexProduct(savedProduct.id).catch((error: unknown) => {
      this.logger.warn(
        `Product ${savedProduct.id} was updated but search index update failed.`,
        error instanceof Error ? error.stack : undefined,
      );
    });

    return savedProduct;
  }

  async softDeleteProduct(id: string) {
    const product = await this.productRepository.findOneBy({ id });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    product.isActive = false;
    const savedProduct = await this.productRepository.save(product);
    await this.invalidatePublicCache();
    this.logger.log(`Product soft-deleted: ${savedProduct.id}`);

    this.searchService.removeProduct(savedProduct.id).catch((error: unknown) => {
      this.logger.warn(
        `Product ${savedProduct.id} was soft-deleted but search index removal failed.`,
        error instanceof Error ? error.stack : undefined,
      );
    });

    return savedProduct;
  }

  private toMoneyString(value: number): string {
    return Number(value).toFixed(2);
  }

  private async invalidatePublicCache() {
    try {
      await this.cacheManager.clear();
    } catch (error) {
      this.logger.warn(
        'Failed to reset cache after product mutation.',
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
