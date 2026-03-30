import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as cron from 'node-cron';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from '../entities/order.entity';
import { EmailService } from './email.service';

@Injectable()
export class EmailSchedulerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EmailSchedulerService.name);
  private task: cron.ScheduledTask | null = null;

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly emailService: EmailService,
  ) {}

  onModuleInit() {
    this.task = cron.schedule('0 * * * *', () => {
      void this.sendAbandonedCartNudges();
    });

    this.logger.log('Abandoned cart email scheduler started.');
  }

  onModuleDestroy() {
    if (!this.task) {
      return;
    }

    this.task.stop();
    this.task.destroy();
    this.task = null;
  }

  private async sendAbandonedCartNudges() {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const pendingOrders = await this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.customer', 'customer')
      .leftJoinAndSelect('order.items', 'item')
      .leftJoinAndSelect('item.product', 'product')
      .where('order.status = :status', { status: OrderStatus.PENDING })
      .andWhere('order.payment_reference IS NULL')
      .andWhere('order.created_at <= :threshold', { threshold: oneHourAgo.toISOString() })
      .orderBy('order.created_at', 'ASC')
      .getMany();

    let sent = 0;

    for (const order of pendingOrders) {
      if (!order.customer?.email) {
        continue;
      }

      await this.emailService.sendAbandonedCartEmail(
        {
          email: order.customer.email,
          name: order.customer.name,
        },
        order.items.map((item) => ({
          title: item.product?.title ?? 'Product',
          quantity: item.quantity,
          price: item.price,
          imageUrl: item.product?.images?.[0],
        })),
      );

      sent += 1;
    }

    this.logger.log(`Abandoned cart scheduler completed. Emails sent: ${sent}`);
  }
}