import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderItem } from '../entities/order-item.entity';
import { OrderStatus } from '../entities/order.entity';
import { Product } from '../entities/product.entity';
import { Review } from '../entities/review.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewQueryDto } from './dto/review-query.dto';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async createReview(productId: string, customerId: string, dto: CreateReviewDto) {
    const product = await this.productRepository.findOneBy({
      id: productId,
      isActive: true,
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const purchaseCount = await this.orderItemRepository
      .createQueryBuilder('orderItem')
      .innerJoin('orderItem.order', 'order')
      .where('order.customer_id = :customerId', { customerId })
      .andWhere('orderItem.product_id = :productId', { productId })
      .andWhere('order.status IN (:...statuses)', {
        statuses: [
          OrderStatus.PAID,
          OrderStatus.PROCESSING,
          OrderStatus.SHIPPED,
          OrderStatus.DELIVERED,
        ],
      })
      .getCount();

    if (purchaseCount === 0) {
      throw new ForbiddenException('You can only review products you have purchased');
    }

    const review = this.reviewRepository.create({
      productId,
      customerId,
      rating: dto.rating,
      body: dto.body ?? null,
      isVerified: true,
    });

    return this.reviewRepository.save(review);
  }

  async listProductReviews(productId: string, query: ReviewQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const [items, total] = await this.reviewRepository.findAndCount({
      where: { productId },
      relations: {
        customer: true,
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

  async deleteReview(id: string) {
    const review = await this.reviewRepository.findOneBy({ id });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    await this.reviewRepository.remove(review);

    return {
      success: true,
      id,
    };
  }
}
