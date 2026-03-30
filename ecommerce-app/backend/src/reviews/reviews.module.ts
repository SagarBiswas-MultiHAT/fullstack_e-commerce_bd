import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminJwtGuard } from '../common/guards/admin-jwt.guard';
import { CustomerJwtGuard } from '../common/guards/customer-jwt.guard';
import { OrderItem } from '../entities/order-item.entity';
import { Product } from '../entities/product.entity';
import { Review } from '../entities/review.entity';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';

@Module({
  imports: [TypeOrmModule.forFeature([Review, OrderItem, Product])],
  controllers: [ReviewsController],
  providers: [ReviewsService, AdminJwtGuard, CustomerJwtGuard],
})
export class ReviewsModule {}
