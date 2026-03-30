import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AdminJwtGuard } from '../common/guards/admin-jwt.guard';
import { CustomerJwtGuard } from '../common/guards/customer-jwt.guard';
import { IpWhitelistGuard } from '../common/guards/ip-whitelist.guard';
import { OrderStatus } from '../entities/order.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrdersService } from './orders.service';

@Controller()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('store/orders')
  @UseGuards(CustomerJwtGuard)
  createOrder(@CurrentUser() user: Record<string, unknown>, @Body() dto: CreateOrderDto) {
    return this.ordersService.createOrder(this.extractCustomerId(user), dto);
  }

  @Get('store/orders/my')
  @UseGuards(CustomerJwtGuard)
  getMyOrders(
    @CurrentUser() user: Record<string, unknown>,
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 20,
  ) {
    return this.ordersService.getMyOrders(this.extractCustomerId(user), page, limit);
  }

  @Get('store/orders/:id')
  @UseGuards(CustomerJwtGuard)
  getOrderById(
    @CurrentUser() user: Record<string, unknown>,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.ordersService.getOrderByIdForCustomer(id, this.extractCustomerId(user));
  }

  @Get('admin/orders')
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @UseGuards(AdminJwtGuard, IpWhitelistGuard)
  getAllOrders(
    @Query('status') status?: OrderStatus,
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 20,
  ) {
    return this.ordersService.getAllOrders(status, page, limit);
  }

  @Get('admin/orders/:id')
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @UseGuards(AdminJwtGuard, IpWhitelistGuard)
  getOrderByIdForAdmin(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.ordersService.getOrderByIdForAdmin(id);
  }

  @Put('admin/orders/:id/status')
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @UseGuards(AdminJwtGuard, IpWhitelistGuard)
  updateOrderStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateOrderStatus(id, dto);
  }

  private extractCustomerId(user: Record<string, unknown> | undefined): string {
    const customerId = (user?.sub as string | undefined) ?? (user?.id as string | undefined);

    if (!customerId) {
      throw new BadRequestException('Authenticated customer id is missing from token payload');
    }

    return customerId;
  }
}
