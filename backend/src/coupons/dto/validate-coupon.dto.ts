import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class ValidateCouponDto {
  @IsString()
  code!: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  orderAmount?: number;
}
