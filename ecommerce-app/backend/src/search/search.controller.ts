import { Controller, Get, Query } from '@nestjs/common';
import { SearchQueryDto } from './dto/search-query.dto';
import { SearchService } from './search.service';

@Controller()
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('store/search')
  searchProducts(@Query() query: SearchQueryDto): Promise<unknown> {
    return this.searchService.searchProducts(query);
  }
}