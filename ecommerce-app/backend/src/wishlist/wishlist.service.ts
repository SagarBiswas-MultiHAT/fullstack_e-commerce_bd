import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../entities/product.entity';
import { Wishlist } from '../entities/wishlist.entity';
import { WishlistQueryDto } from './dto/wishlist-query.dto';

@Injectable()
export class WishlistService {
  constructor(
    @InjectRepository(Wishlist)
    private readonly wishlistRepository: Repository<Wishlist>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async addToWishlist(customerId: string, productId: string) {
    const product = await this.productRepository.findOneBy({
      id: productId,
      isActive: true,
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const existing = await this.wishlistRepository.findOne({
      where: {
        customerId,
        productId,
      },
      relations: {
        product: true,
      },
    });

    if (existing) {
      return existing;
    }

    const wishlistItem = this.wishlistRepository.create({
      customerId,
      productId,
    });

    return this.wishlistRepository.save(wishlistItem);
  }

  async removeFromWishlist(customerId: string, productId: string) {
    const existing = await this.wishlistRepository.findOneBy({
      customerId,
      productId,
    });

    if (!existing) {
      return {
        success: true,
        removed: false,
      };
    }

    await this.wishlistRepository.remove(existing);

    return {
      success: true,
      removed: true,
    };
  }

  async getMyWishlist(customerId: string, query: WishlistQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;

    const [items, total] = await this.wishlistRepository.findAndCount({
      where: {
        customerId,
      },
      relations: {
        product: true,
      },
      order: {
        createdAt: 'DESC',
      },
      skip: (page - 1) * limit,
      take: limit,
    });

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
}
