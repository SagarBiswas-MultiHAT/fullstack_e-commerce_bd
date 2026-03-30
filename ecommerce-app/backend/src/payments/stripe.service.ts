import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { EmailService } from '../email/email.service';
import { OrdersService } from '../orders/orders.service';

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private readonly stripe: Stripe;

  constructor(
    private readonly configService: ConfigService,
    private readonly ordersService: OrdersService,
    private readonly emailService: EmailService,
  ) {
    const secretKey =
      this.configService.get<string>('STRIPE_SECRET_KEY') ?? 'sk_test_placeholder';

    this.stripe = new Stripe(secretKey);
  }

  async createPaymentIntent(
    amountInCents: number,
    currency: string,
    orderId: string,
    customerEmail: string,
  ) {
    return this.stripe.paymentIntents.create({
      amount: amountInCents,
      currency,
      receipt_email: customerEmail,
      metadata: {
        orderId,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });
  }

  async handleWebhook(rawBody: Buffer | string, signature: string) {
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      this.logger.warn('STRIPE_WEBHOOK_SECRET is not configured. Webhook ignored.');
      return { received: false };
    }

    const bodyBuffer =
      typeof rawBody === 'string' ? Buffer.from(rawBody, 'utf-8') : rawBody;

    const event = this.stripe.webhooks.constructEvent(
      bodyBuffer,
      signature,
      webhookSecret,
    );

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const orderId = paymentIntent.metadata?.orderId;

      if (orderId) {
        const paidOrder = await this.ordersService.finalizePaidOrder(orderId, paymentIntent.id);

        if (paidOrder.customer?.email) {
          this.emailService
            .sendOrderConfirmation(paidOrder, paidOrder.customer)
            .catch((error: unknown) => {
              this.logger.warn(
                `Order confirmation email failed for order ${paidOrder.id}`,
                error instanceof Error ? error.stack : undefined,
              );
            });
        }
      }
    }

    if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const orderId = paymentIntent.metadata?.orderId;

      if (orderId) {
        await this.ordersService.markAsFailed(orderId);
      }
    }

    return { received: true };
  }
}