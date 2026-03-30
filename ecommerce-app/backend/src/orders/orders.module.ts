import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminJwtGuard } from '../common/guards/admin-jwt.guard';
import { CustomerJwtGuard } from '../common/guards/customer-jwt.guard';
import { Coupon } from '../entities/coupon.entity';
import { Order } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';
import { Product } from '../entities/product.entity';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderItem, Product, Coupon])],
  controllers: [OrdersController],
  providers: [OrdersService, AdminJwtGuard, CustomerJwtGuard],
  exports: [OrdersService],
})
export class OrdersModule {}
