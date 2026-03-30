import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AdminJwtGuard } from '../common/guards/admin-jwt.guard';
import { IpWhitelistGuard } from '../common/guards/ip-whitelist.guard';
import { AdminService } from './admin.service';
import { RestockProductDto } from './dto/restock-product.dto';
import { UpdateAdminSettingsDto } from './dto/update-admin-settings.dto';

@Controller('admin')
@UseGuards(AdminJwtGuard, IpWhitelistGuard)
@Throttle({ default: { limit: 60, ttl: 60_000 } })
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  getDashboardSummary() {
    return this.adminService.getDashboardSummary();
  }

  @Get('customers')
  listCustomers(
    @Query('q') q = '',
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 20,
  ) {
    return this.adminService.listCustomers(q, page, limit);
  }

  @Get('customers/:id')
  getCustomerById(@Param('id', new ParseUUIDPipe()) customerId: string) {
    return this.adminService.getCustomerById(customerId);
  }

  @Get('inventory')
  getInventory(@Query('threshold', new ParseIntPipe({ optional: true })) threshold = 10) {
    return this.adminService.getInventory(threshold);
  }

  @Put('inventory/:id/restock')
  restockProduct(
    @Param('id', new ParseUUIDPipe()) productId: string,
    @Body() dto: RestockProductDto,
  ) {
    return this.adminService.restockProduct(productId, dto);
  }

  @Get('analytics')
  getAnalytics(@Query('range', new ParseIntPipe({ optional: true })) range = 30) {
    return this.adminService.getAnalytics(range);
  }

  @Get('settings')
  getSettings() {
    return this.adminService.getSettings();
  }

  @Put('settings')
  updateSettings(@Body() dto: UpdateAdminSettingsDto) {
    return this.adminService.updateSettings(dto);
  }
}
