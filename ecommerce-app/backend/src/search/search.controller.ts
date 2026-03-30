import { CacheTTL } from '@nestjs/cache-manager';
import { Controller, Get, Query, UseInterceptors } from '@nestjs/common';
import { CacheKeyInterceptor } from '../common/interceptors/cache-key.interceptor';
import { SearchQueryDto } from './dto/search-query.dto';
import { SearchService } from './search.service';

@Controller()
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('store/search')
  @UseInterceptors(CacheKeyInterceptor)
  @CacheTTL(120)
  searchProducts(@Query() query: SearchQueryDto): Promise<unknown> {
    return this.searchService.searchProducts(query);
  }
}