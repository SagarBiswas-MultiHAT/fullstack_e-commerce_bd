import {
  BadRequestException,
  Body,
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
import { AdminJwtGuard } from '../common/guards/admin-jwt.guard';
import { CustomerJwtGuard } from '../common/guards/customer-jwt.guard';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewQueryDto } from './dto/review-query.dto';
import { ReviewsService } from './reviews.service';

@Controller()
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post('store/products/:id/reviews')
  @UseGuards(CustomerJwtGuard)
  createReview(
    @Param('id', new ParseUUIDPipe()) productId: string,
    @CurrentUser() user: Record<string, unknown>,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewsService.createReview(productId, this.extractCustomerId(user), dto);
  }

  @Get('store/products/:id/reviews')
  listReviews(
    @Param('id', new ParseUUIDPipe()) productId: string,
    @Query() query: ReviewQueryDto,
  ) {
    return this.reviewsService.listProductReviews(productId, query);
  }

  @Delete('admin/reviews/:id')
  @UseGuards(AdminJwtGuard)
  deleteReview(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.reviewsService.deleteReview(id);
  }

  private extractCustomerId(user: Record<string, unknown> | undefined): string {
    const customerId = (user?.sub as string | undefined) ?? (user?.id as string | undefined);

    if (!customerId) {
      throw new BadRequestException('Authenticated customer id is missing from token payload');
    }

    return customerId;
  }
}
