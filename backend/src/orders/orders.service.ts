import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Coupon, CouponType } from '../entities/coupon.entity';
import { Order, OrderStatus } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';
import { Product } from '../entities/product.entity';
import { EmailService } from '../email/email.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Coupon)
    private readonly couponRepository: Repository<Coupon>,
    private readonly emailService: EmailService,
  ) {}

  async createOrder(customerId: string, dto: CreateOrderDto) {
    if (dto.items.length === 0) {
      throw new BadRequestException('Order must include at least one item');
    }

    const uniqueProductIds = [...new Set(dto.items.map((item) => item.productId))];
    const products = await this.productRepository.findBy({
      id: In(uniqueProductIds),
      isActive: true,
    });

    if (products.length !== uniqueProductIds.length) {
      throw new BadRequestException('One or more products are unavailable');
    }

    const productMap = new Map(products.map((product) => [product.id, product]));

    let subtotal = 0;
    const orderItemsPayload: Array<{ productId: string; quantity: number; price: string }> = [];

    for (const item of dto.items) {
      const product = productMap.get(item.productId);

      if (!product) {
        throw new BadRequestException(`Product ${item.productId} was not found`);
      }

      if (product.stock < item.quantity) {
        throw new BadRequestException(`Insufficient stock for product: ${product.title}`);
      }

      const unitPrice = Number(product.discountPrice ?? product.price);
      subtotal += unitPrice * item.quantity;

      orderItemsPayload.push({
        productId: item.productId,
        quantity: item.quantity,
        price: unitPrice.toFixed(2),
      });
    }

    const { coupon, discountAmount } = await this.calculateDiscount(dto.couponCode, subtotal);
    const total = Math.max(subtotal - discountAmount, 0);

    const order = this.orderRepository.create({
      customerId,
      status: OrderStatus.PENDING,
      total: total.toFixed(2),
      paymentMethod: dto.paymentMethod,
      paymentReference: null,
    });

    const savedOrder = await this.orderRepository.save(order);

    const orderItems = orderItemsPayload.map((item) =>
      this.orderItemRepository.create({
        ...item,
        orderId: savedOrder.id,
      }),
    );

    await this.orderItemRepository.save(orderItems);

    if (coupon) {
      coupon.usedCount += 1;
      await this.couponRepository.save(coupon);
    }

    const createdOrder = await this.orderRepository.findOne({
      where: { id: savedOrder.id },
      relations: {
        items: {
          product: true,
        },
      },
    });

    if (!createdOrder) {
      throw new NotFoundException('Created order could not be loaded');
    }

    return {
      ...createdOrder,
      discountAmount: discountAmount.toFixed(2),
      addressId: dto.addressId,
    };
  }

  async getMyOrders(customerId: string, page = 1, limit = 20) {
    const [items, total] = await this.orderRepository.findAndCount({
      where: { customerId },
      relations: {
        items: {
          product: true,
        },
      },
      order: {
        createdAt: 'DESC',
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getOrderByIdForCustomer(orderId: string, customerId: string) {
    const order = await this.orderRepository.findOne({
      where: {
        id: orderId,
        customerId,
      },
      relations: {
        customer: true,
        items: {
          product: true,
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async getOrderForPayment(orderId: string, customerId: string) {
    const order = await this.orderRepository.findOne({
      where: {
        id: orderId,
        customerId,
      },
      relations: {
        customer: true,
        items: {
          product: true,
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async getAllOrders(status?: OrderStatus, page = 1, limit = 20) {
    const qb = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.customer', 'customer')
      .leftJoinAndSelect('order.items', 'item')
      .leftJoinAndSelect('item.product', 'product')
      .orderBy('order.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (status) {
      qb.andWhere('order.status = :status', { status });
    }

    const [items, total] = await qb.getManyAndCount();

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getOrderByIdForAdmin(orderId: string) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: {
        customer: true,
        items: {
          product: true,
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async updateOrderStatus(orderId: string, dto: UpdateOrderStatusDto) {
    const order = await this.orderRepository.findOneBy({ id: orderId });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const previousStatus = order.status;
    order.status = dto.status;
    const saved = await this.orderRepository.save(order);
    this.logger.log(`Order status updated: ${saved.id} ${previousStatus} -> ${saved.status}`);

    if (
      previousStatus !== saved.status &&
      (saved.status === OrderStatus.SHIPPED || saved.status === OrderStatus.DELIVERED)
    ) {
      const fullOrder = await this.orderRepository.findOne({
        where: { id: saved.id },
        relations: { customer: true },
      });

      if (fullOrder?.customer?.email) {
        this.emailService
          .sendShippingUpdate(
            fullOrder,
            fullOrder.customer,
            fullOrder.status,
            'https://track.redx.com.bd',
          )
          .catch((error: unknown) => {
            this.logger.warn(
              `Shipping update email failed for order ${fullOrder.id}`,
              error instanceof Error ? error.stack : undefined,
            );
          });
      }
    }

    return saved;
  }

  async markAsPaid(orderId: string, paymentReference?: string) {
    return this.finalizePaidOrder(orderId, paymentReference ?? null);
  }

  async markAsFailed(orderId: string) {
    const order = await this.orderRepository.findOneBy({ id: orderId });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    order.status = OrderStatus.CANCELLED;
    this.logger.warn(`Order marked as failed/cancelled: ${order.id}`);
    return this.orderRepository.save(order);
  }

  async finalizePaidOrder(orderId: string, paymentReference: string | null) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: {
        customer: true,
        items: {
          product: true,
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status === OrderStatus.PAID) {
      if (paymentReference && !order.paymentReference) {
        order.paymentReference = paymentReference;
        await this.orderRepository.save(order);
      }

      return order;
    }

    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Cancelled orders cannot be marked as paid');
    }

    const updates: Product[] = [];

    for (const item of order.items) {
      const product = item.product;
      if (!product) {
        continue;
      }

      if (product.stock < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock while finalizing payment for ${product.title}`,
        );
      }

      product.stock -= item.quantity;
      updates.push(product);
    }

    if (updates.length) {
      await this.productRepository.save(updates);
    }

    order.status = OrderStatus.PAID;
    order.paymentReference = paymentReference;
    this.logger.log(`Order finalized as paid: ${order.id}`);

    return this.orderRepository.save(order);
  }

  private async calculateDiscount(couponCode: string | undefined, subtotal: number) {
    if (!couponCode) {
      return {
        coupon: null,
        discountAmount: 0,
      };
    }

    const coupon = await this.couponRepository.findOne({
      where: {
        code: couponCode,
        isActive: true,
      },
    });

    if (!coupon) {
      throw new BadRequestException('Invalid coupon code');
    }

    if (coupon.expiresAt && coupon.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Coupon has expired');
    }

    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      throw new BadRequestException('Coupon usage limit reached');
    }

    const rawDiscount =
      coupon.type === CouponType.PERCENTAGE
        ? (subtotal * Number(coupon.value)) / 100
        : Number(coupon.value);

    return {
      coupon,
      discountAmount: Math.min(rawDiscount, subtotal),
    };
  }
}
