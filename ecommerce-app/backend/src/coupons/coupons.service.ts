import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Coupon, CouponType } from '../entities/coupon.entity';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { ValidateCouponDto } from './dto/validate-coupon.dto';

@Injectable()
export class CouponsService {
  constructor(
    @InjectRepository(Coupon)
    private readonly couponRepository: Repository<Coupon>,
  ) {}

  async validateCoupon(dto: ValidateCouponDto) {
    const coupon = await this.couponRepository.findOne({
      where: {
        code: dto.code,
        isActive: true,
      },
    });

    if (!coupon) {
      throw new BadRequestException('Coupon is invalid');
    }

    if (coupon.expiresAt && coupon.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Coupon has expired');
    }

    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      throw new BadRequestException('Coupon usage limit reached');
    }

    const orderAmount = dto.orderAmount ?? 0;
    const discountAmount =
      coupon.type === CouponType.PERCENTAGE
        ? (orderAmount * Number(coupon.value)) / 100
        : Number(coupon.value);

    return {
      valid: true,
      code: coupon.code,
      type: coupon.type,
      value: Number(coupon.value),
      discountAmount: Number(Math.min(discountAmount, orderAmount).toFixed(2)),
      expiresAt: coupon.expiresAt,
      usage: {
        usedCount: coupon.usedCount,
        usageLimit: coupon.usageLimit,
      },
    };
  }

  async createCoupon(dto: CreateCouponDto) {
    const coupon = this.couponRepository.create({
      code: dto.code,
      type: dto.type,
      value: dto.value.toFixed(2),
      usageLimit: dto.usageLimit ?? null,
      usedCount: 0,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      isActive: dto.isActive ?? true,
    });

    return this.couponRepository.save(coupon);
  }

  async listCoupons() {
    return this.couponRepository.find({
      order: {
        code: 'ASC',
      },
    });
  }

  async updateCoupon(id: string, dto: UpdateCouponDto) {
    const coupon = await this.couponRepository.findOneBy({ id });

    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    if (dto.code !== undefined) coupon.code = dto.code;
    if (dto.type !== undefined) coupon.type = dto.type;
    if (dto.value !== undefined) coupon.value = dto.value.toFixed(2);
    if (dto.usageLimit !== undefined) coupon.usageLimit = dto.usageLimit;
    if (dto.expiresAt !== undefined) {
      coupon.expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : null;
    }
    if (dto.isActive !== undefined) coupon.isActive = dto.isActive;

    return this.couponRepository.save(coupon);
  }
}
