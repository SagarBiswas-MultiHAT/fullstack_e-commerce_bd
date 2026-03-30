import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Customer } from '../entities/customer.entity';
import { Order, OrderStatus } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';
import { Product } from '../entities/product.entity';
import { RestockProductDto } from './dto/restock-product.dto';
import { UpdateAdminSettingsDto } from './dto/update-admin-settings.dto';

export interface AdminSettings {
  storeName: string;
  logoUrl: string;
  brandColor: string;
  senderEmail: string;
  contactInfo: string;
  lowStockAlertThreshold: number;
  abandonedCartDelayMinutes: number;
}

@Injectable()
export class AdminService {
  private readonly settings: AdminSettings;

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    private readonly configService: ConfigService,
  ) {
    this.settings = {
      storeName: this.configService.get<string>('APP_NAME') ?? 'BazaarFlow',
      logoUrl: '',
      brandColor: this.configService.get<string>('BRAND_COLOR') ?? '#2563EB',
      senderEmail: this.configService.get<string>('SENDER_EMAIL') ?? 'noreply@example.com',
      contactInfo: 'support@example.com',
      lowStockAlertThreshold: 10,
      abandonedCartDelayMinutes: 60,
    };
  }

  async getDashboardSummary() {
    const now = new Date();
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const weekStart = new Date(todayStart);
    weekStart.setUTCDate(todayStart.getUTCDate() - 7);

    const monthlyPaidOrders = await this.orderRepository.find({
      where: {
        status: OrderStatus.PAID,
        createdAt: Between(monthStart, now),
      },
    });

    const totalRevenueThisMonth = monthlyPaidOrders.reduce(
      (sum, order) => sum + Number(order.total),
      0,
    );

    const [ordersToday, newCustomersThisWeek, lowStockCount, recentOrders] = await Promise.all([
      this.orderRepository.count({
        where: {
          createdAt: Between(todayStart, now),
        },
      }),
      this.customerRepository.count({
        where: {
          createdAt: Between(weekStart, now),
        },
      }),
      this.productRepository.count({
        where: {
          isActive: true,
        },
      }).then(async (totalActive) => {
        const lowStock = await this.productRepository
          .createQueryBuilder('product')
          .where('product.is_active = :isActive', { isActive: true })
          .andWhere('product.stock <= :threshold', {
            threshold: this.settings.lowStockAlertThreshold,
          })
          .getCount();

        return Math.min(lowStock, totalActive);
      }),
      this.orderRepository.find({
        relations: { customer: true },
        order: { createdAt: 'DESC' },
        take: 10,
      }),
    ]);

    return {
      stats: {
        totalRevenueThisMonth: Number(totalRevenueThisMonth.toFixed(2)),
        ordersToday,
        newCustomersThisWeek,
        lowStockCount,
      },
      recentOrders,
    };
  }

  async listCustomers(search = '', page = 1, limit = 20) {
    const qb = this.customerRepository
      .createQueryBuilder('customer')
      .leftJoinAndSelect('customer.orders', 'order')
      .orderBy('customer.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (search.trim()) {
      qb.andWhere('(LOWER(customer.name) LIKE :q OR LOWER(customer.email) LIKE :q)', {
        q: `%${search.trim().toLowerCase()}%`,
      });
    }

    const [items, total] = await qb.getManyAndCount();

    return {
      items: items.map((customer) => ({
        ...customer,
        totalOrders: customer.orders?.length ?? 0,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getCustomerById(customerId: string) {
    const customer = await this.customerRepository.findOne({
      where: { id: customerId },
      relations: {
        orders: {
          items: {
            product: true,
          },
        },
      },
      order: {
        orders: {
          createdAt: 'DESC',
        },
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return customer;
  }

  async getInventory(threshold = 10) {
    return this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .where('product.is_active = :isActive', { isActive: true })
      .andWhere('product.stock <= :threshold', { threshold })
      .orderBy('product.stock', 'ASC')
      .getMany();
  }

  async restockProduct(productId: string, dto: RestockProductDto) {
    const product = await this.productRepository.findOneBy({ id: productId });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    product.stock = dto.quantity;
    return this.productRepository.save(product);
  }

  async getAnalytics(rangeDays = 30) {
    const now = new Date();
    const from = new Date(now);
    from.setUTCDate(from.getUTCDate() - rangeDays);

    const [orders, paidOrders, topProductRows] = await Promise.all([
      this.orderRepository.find({
        where: {
          createdAt: Between(from, now),
        },
      }),
      this.orderRepository.find({
        where: {
          status: OrderStatus.PAID,
          createdAt: Between(from, now),
        },
      }),
      this.orderItemRepository
        .createQueryBuilder('item')
        .leftJoinAndSelect('item.product', 'product')
        .leftJoin('item.order', 'order')
        .where('order.created_at BETWEEN :from AND :now', { from, now })
        .select('item.product_id', 'productId')
        .addSelect('MAX(product.title)', 'title')
        .addSelect('SUM(item.quantity)', 'quantitySold')
        .addSelect('SUM(item.quantity * item.price)', 'revenue')
        .groupBy('item.product_id')
        .orderBy('SUM(item.quantity)', 'DESC')
        .limit(10)
        .getRawMany(),
    ]);

    const revenueByDayMap = new Map<string, number>();

    for (let i = 0; i <= rangeDays; i += 1) {
      const date = new Date(from);
      date.setUTCDate(from.getUTCDate() + i);
      const key = date.toISOString().slice(0, 10);
      revenueByDayMap.set(key, 0);
    }

    for (const order of paidOrders) {
      const key = order.createdAt.toISOString().slice(0, 10);
      revenueByDayMap.set(key, (revenueByDayMap.get(key) ?? 0) + Number(order.total));
    }

    const totalOrders = orders.length;
    const paidCount = paidOrders.length;
    const cancelledCount = orders.filter((order) => order.status === OrderStatus.CANCELLED).length;
    const paidRevenue = paidOrders.reduce((sum, order) => sum + Number(order.total), 0);

    return {
      revenueByDay: Array.from(revenueByDayMap.entries()).map(([date, revenue]) => ({
        date,
        revenue: Number(revenue.toFixed(2)),
      })),
      topProducts: topProductRows.map((row) => ({
        productId: row.productId,
        title: row.title,
        quantitySold: Number(row.quantitySold ?? 0),
        revenue: Number(Number(row.revenue ?? 0).toFixed(2)),
      })),
      orderStatusBreakdown: Object.values(OrderStatus).map((status) => ({
        status,
        count: orders.filter((order) => order.status === status).length,
      })),
      kpis: {
        conversionRate: totalOrders === 0 ? 0 : Number(((paidCount / totalOrders) * 100).toFixed(2)),
        averageOrderValue: paidCount === 0 ? 0 : Number((paidRevenue / paidCount).toFixed(2)),
        returnRate: totalOrders === 0 ? 0 : Number(((cancelledCount / totalOrders) * 100).toFixed(2)),
      },
    };
  }

  getSettings() {
    return this.settings;
  }

  updateSettings(dto: UpdateAdminSettingsDto) {
    this.settings.storeName = dto.storeName ?? this.settings.storeName;
    this.settings.logoUrl = dto.logoUrl ?? this.settings.logoUrl;
    this.settings.brandColor = dto.brandColor ?? this.settings.brandColor;
    this.settings.senderEmail = dto.senderEmail ?? this.settings.senderEmail;
    this.settings.contactInfo = dto.contactInfo ?? this.settings.contactInfo;
    this.settings.lowStockAlertThreshold =
      dto.lowStockAlertThreshold ?? this.settings.lowStockAlertThreshold;
    this.settings.abandonedCartDelayMinutes =
      dto.abandonedCartDelayMinutes ?? this.settings.abandonedCartDelayMinutes;

    return this.settings;
  }
}
