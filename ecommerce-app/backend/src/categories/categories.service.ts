import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../entities/category.entity';
import { Product } from '../entities/product.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

interface CategoryTreeNode {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  createdAt: Date;
  children: CategoryTreeNode[];
}

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async getCategoryTree(): Promise<CategoryTreeNode[]> {
    const categories = await this.categoryRepository.find({
      order: {
        name: 'ASC',
      },
    });

    const categoryMap = new Map<string, CategoryTreeNode>();
    const roots: CategoryTreeNode[] = [];

    for (const category of categories) {
      categoryMap.set(category.id, {
        id: category.id,
        name: category.name,
        slug: category.slug,
        parentId: category.parentId,
        createdAt: category.createdAt,
        children: [],
      });
    }

    for (const node of categoryMap.values()) {
      if (!node.parentId) {
        roots.push(node);
        continue;
      }

      const parent = categoryMap.get(node.parentId);
      if (parent) {
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    }

    return roots;
  }

  async getCategoryProducts(slug: string, page = 1, limit = 20) {
    const category = await this.categoryRepository.findOne({
      where: { slug },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const [items, total] = await this.productRepository.findAndCount({
      where: {
        categoryId: category.id,
        isActive: true,
      },
      order: {
        createdAt: 'DESC',
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      category,
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async createCategory(dto: CreateCategoryDto) {
    const category = this.categoryRepository.create({
      name: dto.name,
      slug: dto.slug,
      parentId: dto.parentId ?? null,
    });

    return this.categoryRepository.save(category);
  }

  async updateCategory(id: string, dto: UpdateCategoryDto) {
    const category = await this.categoryRepository.findOneBy({ id });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (dto.name !== undefined) category.name = dto.name;
    if (dto.slug !== undefined) category.slug = dto.slug;
    if (dto.parentId !== undefined) category.parentId = dto.parentId;

    return this.categoryRepository.save(category);
  }
}
