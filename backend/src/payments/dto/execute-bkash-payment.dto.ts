import { IsString, IsUUID } from 'class-validator';

export class ExecuteBkashPaymentDto {
  @IsUUID()
  orderId!: string;

  @IsString()
  paymentId!: string;
}