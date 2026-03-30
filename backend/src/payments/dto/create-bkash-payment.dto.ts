import { IsOptional, IsString, IsUrl, IsUUID } from 'class-validator';

export class CreateBkashPaymentDto {
  @IsUUID()
  orderId!: string;

  @IsOptional()
  @IsString()
  @IsUrl({ require_tld: false }, { message: 'callbackUrl must be a valid URL' })
  callbackUrl?: string;
}