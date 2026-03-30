import { IsUUID } from 'class-validator';

export class CreateStripeIntentDto {
  @IsUUID()
  orderId!: string;
}