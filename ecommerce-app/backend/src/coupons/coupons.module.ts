import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminJwtGuard } from '../common/guards/admin-jwt.guard';
import { IpWhitelistGuard } from '../common/guards/ip-whitelist.guard';
import { Coupon } from '../entities/coupon.entity';
import { CouponsController } from './coupons.controller';
import { CouponsService } from './coupons.service';

@Module({
  imports: [TypeOrmModule.forFeature([Coupon])],
  controllers: [CouponsController],
  providers: [CouponsService, AdminJwtGuard, IpWhitelistGuard],
  exports: [CouponsService],
})
export class CouponsModule {}
