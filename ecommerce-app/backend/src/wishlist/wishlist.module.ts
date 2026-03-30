import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerJwtGuard } from '../common/guards/customer-jwt.guard';
import { Product } from '../entities/product.entity';
import { Wishlist } from '../entities/wishlist.entity';
import { WishlistController } from './wishlist.controller';
import { WishlistService } from './wishlist.service';

@Module({
  imports: [TypeOrmModule.forFeature([Wishlist, Product])],
  controllers: [WishlistController],
  providers: [WishlistService, CustomerJwtGuard],
})
export class WishlistModule {}
