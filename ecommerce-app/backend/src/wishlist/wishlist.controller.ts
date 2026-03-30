import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CustomerJwtGuard } from '../common/guards/customer-jwt.guard';
import { WishlistQueryDto } from './dto/wishlist-query.dto';
import { WishlistService } from './wishlist.service';

@Controller()
@UseGuards(CustomerJwtGuard)
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Post('store/wishlist/:productId')
  addToWishlist(
    @CurrentUser() user: Record<string, unknown>,
    @Param('productId', new ParseUUIDPipe()) productId: string,
  ) {
    return this.wishlistService.addToWishlist(this.extractCustomerId(user), productId);
  }

  @Delete('store/wishlist/:productId')
  removeFromWishlist(
    @CurrentUser() user: Record<string, unknown>,
    @Param('productId', new ParseUUIDPipe()) productId: string,
  ) {
    return this.wishlistService.removeFromWishlist(this.extractCustomerId(user), productId);
  }

  @Get('store/wishlist')
  getMyWishlist(@CurrentUser() user: Record<string, unknown>, @Query() query: WishlistQueryDto) {
    return this.wishlistService.getMyWishlist(this.extractCustomerId(user), query);
  }

  private extractCustomerId(user: Record<string, unknown> | undefined): string {
    const customerId = (user?.sub as string | undefined) ?? (user?.id as string | undefined);

    if (!customerId) {
      throw new BadRequestException('Authenticated customer id is missing from token payload');
    }

    return customerId;
  }
}
