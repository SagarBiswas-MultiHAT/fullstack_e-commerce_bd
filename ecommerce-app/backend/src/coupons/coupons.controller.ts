import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { AdminJwtGuard } from '../common/guards/admin-jwt.guard';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { ValidateCouponDto } from './dto/validate-coupon.dto';
import { CouponsService } from './coupons.service';

@Controller()
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Post('store/coupons/validate')
  validateCoupon(@Body() dto: ValidateCouponDto) {
    return this.couponsService.validateCoupon(dto);
  }

  @Post('admin/coupons')
  @UseGuards(AdminJwtGuard)
  createCoupon(@Body() dto: CreateCouponDto) {
    return this.couponsService.createCoupon(dto);
  }

  @Get('admin/coupons')
  @UseGuards(AdminJwtGuard)
  listCoupons() {
    return this.couponsService.listCoupons();
  }

  @Put('admin/coupons/:id')
  @UseGuards(AdminJwtGuard)
  updateCoupon(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: UpdateCouponDto) {
    return this.couponsService.updateCoupon(id, dto);
  }
}
