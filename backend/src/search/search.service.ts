import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Index, MeiliSearch } from 'meilisearch';
import { Repository } from 'typeorm';
import { Category } from '../entities/category.entity';
import { Product } from '../entities/product.entity';
import { SearchQueryDto, SearchSort } from './dto/search-query.dto';

interface SearchProductDocument {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  discount_price: number | null;
  stock: number;
  images: string[];
  is_active: boolean;
  category_id: string | null;
  category_slug: string | null;
  category: string;
  rating: number;
  in_stock: boolean;
  created_at: string;
  updated_at: string;
}

interface SearchProductItem {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  price: string;
  discountPrice: string | null;
  stock: number;
  images: string[];
  isActive: boolean;
  categoryId: string | null;
  category: {
    id: string;
    name: string;
    slug: string;
  } | null;
  createdAt: string;
  updatedAt: string;
  rating: number;
}

@Injectable()
export class SearchService implements OnModuleInit {
  private readonly logger = new Logger(SearchService.name);
  private readonly indexName = 'products';
  private readonly client: MeiliSearch | null;
  private isReady = false;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {
    const host = this.configService.get<string>('MEILISEARCH_URL');
    const apiKey = this.configService.get<string>('MEILISEARCH_API_KEY');

    this.client = host ? new MeiliSearch({ host, apiKey }) : null;
  }

  async onModuleInit() {
    if (!this.client) {
      this.logger.warn('MEILISEARCH_URL is not set. Falling back to database search.');
      return;
    }

    try {
      await this.ensureIndex();
      await this.syncAllProducts();
      this.isReady = true;
      this.logger.log('Meilisearch index is ready.');
    } catch (error) {
      this.logger.error('Meilisearch initialization failed. Falling back to database search.', error as Error);
      this.isReady = false;
    }
  }

  async indexProduct(productOrId: Product | string) {
    if (!this.client || !this.isReady) {
      return;
    }

    const productId = typeof productOrId === 'string' ? productOrId : productOrId.id;

    try {
      const product = await this.loadProductForIndexing(productId);

      if (!product || !product.isActive) {
        await this.removeProduct(productId);
        return;
      }

      const task = await this.getIndex().addDocuments([this.toDocument(product)]);
      await this.waitForTask(task.taskUid);
    } catch (error) {
      this.logger.warn(`Failed to index product ${productId}.`, error as Error);
    }
  }

  async removeProduct(productId: string) {
    if (!this.client || !this.isReady) {
      return;
    }

    try {
      const task = await this.getIndex().deleteDocument(productId);
      await this.waitForTask(task.taskUid);
    } catch (error) {
      this.logger.warn(`Failed to remove product ${productId} from Meilisearch.`, error as Error);
    }
  }

  async syncAllProducts() {
    if (!this.client) {
      return;
    }

    const products = await this.productRepository.find({
      where: { isActive: true },
      relations: {
        category: true,
        reviews: true,
      },
      order: {
        createdAt: 'DESC',
      },
    });

    const documents = products.map((product) => this.toDocument(product));

    const task = await this.getIndex().addDocuments(documents);
    await this.waitForTask(task.taskUid);
  }

  async searchProducts(query: SearchQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    if (!this.client || !this.isReady) {
      return this.searchWithDatabase(query, page, limit);
    }

    try {
      const filters = await this.buildFilters(query);
      const sort = this.buildSort(query.sort);
      const searchTerm = query.q.trim();

      const result = await this.getIndex().search<SearchProductDocument>(searchTerm, {
        filter: filters.length ? filters : undefined,
        sort: sort.length ? sort : undefined,
        limit,
        offset: (page - 1) * limit,
      });

      const total =
        typeof result.estimatedTotalHits === 'number'
          ? result.estimatedTotalHits
          : result.hits.length;

      return {
        items: result.hits.map((hit) => this.mapHitToItem(hit)),
        pagination: {
          page,
          limit,
          total,
          totalPages: total === 0 ? 0 : Math.ceil(total / limit),
        },
        query: searchTerm,
      };
    } catch (error) {
      this.logger.warn('Meilisearch query failed. Falling back to database search.', error as Error);
      return this.searchWithDatabase(query, page, limit);
    }
  }

  private async ensureIndex() {
    const index = this.getIndex();

    try {
      await index.getRawInfo();
    } catch (error) {
      if (!this.isIndexNotFound(error)) {
        throw error;
      }

      const task = await this.client!.createIndex(this.indexName, {
        primaryKey: 'id',
      });
      await this.waitForTask(task.taskUid);
    }

    await this.configureIndex();
  }

  private async configureIndex() {
    const index = this.getIndex();

    const searchableTask = await index.updateSearchableAttributes([
      'title',
      'description',
      'category',
    ]);
    await this.waitForTask(searchableTask.taskUid);

    const filterableTask = await index.updateFilterableAttributes([
      'price',
      'category_id',
      'rating',
      'in_stock',
      'is_active',
    ]);
    await this.waitForTask(filterableTask.taskUid);

    const sortableTask = await index.updateSortableAttributes(['price', 'created_at']);
    await this.waitForTask(sortableTask.taskUid);
  }

  private async waitForTask(taskUid: number) {
    if (!this.client) {
      return;
    }

    await this.client.tasks.waitForTask(taskUid, {
      interval: 100,
      timeout: 10_000,
    });
  }

  private getIndex(): Index<SearchProductDocument> {
    return this.client!.index(this.indexName);
  }

  private async loadProductForIndexing(productId: string) {
    return this.productRepository.findOne({
      where: { id: productId },
      relations: {
        category: true,
        reviews: true,
      },
    });
  }

  private toDocument(product: Product): SearchProductDocument {
    return {
      id: product.id,
      title: product.title,
      slug: product.slug,
      description: product.description ?? '',
      price: this.toNumber(product.price),
      discount_price: product.discountPrice ? this.toNumber(product.discountPrice) : null,
      stock: product.stock,
      images: product.images,
      is_active: product.isActive,
      category_id: product.categoryId,
      category_slug: product.category?.slug ?? null,
      category: product.category?.name ?? '',
      rating: this.averageRating(product),
      in_stock: product.stock > 0,
      created_at: product.createdAt.toISOString(),
      updated_at: product.updatedAt.toISOString(),
    };
  }

  private mapHitToItem(hit: SearchProductDocument): SearchProductItem {
    return {
      id: hit.id,
      title: hit.title,
      slug: hit.slug,
      description: hit.description || null,
      price: this.toMoneyString(hit.price),
      discountPrice:
        hit.discount_price === null ? null : this.toMoneyString(hit.discount_price),
      stock: hit.stock,
      images: hit.images,
      isActive: hit.is_active,
      categoryId: hit.category_id,
      category: hit.category_id
        ? {
            id: hit.category_id,
            name: hit.category || 'Category',
            slug: hit.category_slug ?? '',
          }
        : null,
      createdAt: hit.created_at,
      updatedAt: hit.updated_at,
      rating: hit.rating,
    };
  }

  private mapEntityToItem(product: Product): SearchProductItem {
    return {
      id: product.id,
      title: product.title,
      slug: product.slug,
      description: product.description,
      price: product.price,
      discountPrice: product.discountPrice,
      stock: product.stock,
      images: product.images,
      isActive: product.isActive,
      categoryId: product.categoryId,
      category: product.category
        ? {
            id: product.category.id,
            name: product.category.name,
            slug: product.category.slug,
          }
        : null,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
      rating: this.averageRating(product),
    };
  }

  private async buildFilters(query: SearchQueryDto) {
    const filters: string[] = ['is_active = true'];

    if (query.inStock) {
      filters.push('in_stock = true');
    }

    if (query.minPrice !== undefined) {
      filters.push(`price >= ${query.minPrice}`);
    }

    if (query.maxPrice !== undefined) {
      filters.push(`price <= ${query.maxPrice}`);
    }

    if (query.rating !== undefined) {
      filters.push(`rating >= ${query.rating}`);
    }

    if (query.category) {
      const categoryId = await this.resolveCategoryId(query.category);
      if (categoryId) {
        filters.push(`category_id = "${categoryId}"`);
      }
    }

    return filters;
  }

  private buildSort(sort: SearchSort) {
    switch (sort) {
      case SearchSort.PRICE_ASC:
        return ['price:asc'];
      case SearchSort.PRICE_DESC:
        return ['price:desc'];
      case SearchSort.NEWEST:
        return ['created_at:desc'];
      case SearchSort.POPULAR:
      default:
        return [];
    }
  }

  private async resolveCategoryId(category: string) {
    const trimmed = category.trim();
    if (!trimmed) {
      return null;
    }

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (uuidRegex.test(trimmed)) {
      return trimmed;
    }

    const found = await this.categoryRepository.findOne({
      where: {
        slug: trimmed,
      },
      select: {
        id: true,
      },
    });

    return found?.id ?? null;
  }

  private async searchWithDatabase(query: SearchQueryDto, page: number, limit: number) {
    const categoryFilter = query.category?.trim().toLowerCase();
    const searchText = query.q.trim().toLowerCase();

    const products = await this.productRepository.find({
      where: {
        isActive: true,
      },
      relations: {
        category: true,
        reviews: true,
      },
      order: {
        createdAt: 'DESC',
      },
      take: 500,
    });

    const filtered = products.filter((product) => {
      if (categoryFilter) {
        const matchCategoryId = product.categoryId?.toLowerCase() === categoryFilter;
        const matchCategorySlug = product.category?.slug.toLowerCase() === categoryFilter;
        if (!matchCategoryId && !matchCategorySlug) {
          return false;
        }
      }

      const price = this.toNumber(product.price);
      if (query.minPrice !== undefined && price < query.minPrice) {
        return false;
      }
      if (query.maxPrice !== undefined && price > query.maxPrice) {
        return false;
      }

      if (query.inStock && product.stock <= 0) {
        return false;
      }

      const rating = this.averageRating(product);
      if (query.rating !== undefined && rating < query.rating) {
        return false;
      }

      if (!searchText) {
        return true;
      }

      return (
        product.title.toLowerCase().includes(searchText) ||
        (product.description ?? '').toLowerCase().includes(searchText) ||
        (product.category?.name ?? '').toLowerCase().includes(searchText)
      );
    });

    const sorted = filtered.sort((left, right) => {
      const leftPrice = this.toNumber(left.price);
      const rightPrice = this.toNumber(right.price);

      switch (query.sort) {
        case SearchSort.PRICE_ASC:
          return leftPrice - rightPrice;
        case SearchSort.PRICE_DESC:
          return rightPrice - leftPrice;
        case SearchSort.POPULAR:
          return this.averageRating(right) - this.averageRating(left);
        case SearchSort.NEWEST:
        default:
          return right.createdAt.getTime() - left.createdAt.getTime();
      }
    });

    const total = sorted.length;
    const offset = (page - 1) * limit;
    const items = sorted.slice(offset, offset + limit).map((product) => this.mapEntityToItem(product));

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit),
      },
      query: query.q.trim(),
    };
  }

  private averageRating(product: Pick<Product, 'reviews'>) {
    const reviews = product.reviews ?? [];
    if (reviews.length === 0) {
      return 0;
    }

    const sum = reviews.reduce((total, review) => total + Number(review.rating), 0);
    return Number((sum / reviews.length).toFixed(2));
  }

  private toNumber(value: string | number) {
    if (typeof value === 'number') {
      return value;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private toMoneyString(value: number) {
    return value.toFixed(2);
  }

  private isIndexNotFound(error: unknown) {
    if (!error || typeof error !== 'object') {
      return false;
    }

    return 'code' in error && (error as { code?: string }).code === 'index_not_found';
  }
}