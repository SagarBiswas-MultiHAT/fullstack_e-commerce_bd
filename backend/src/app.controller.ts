import { Controller, Get } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly dataSource: DataSource,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  async getHealth(): Promise<{ status: 'ok'; db: 'connected' | 'error'; timestamp: Date }> {
    try {
      await this.dataSource.query('SELECT 1');

      return {
        status: 'ok',
        db: 'connected',
        timestamp: new Date(),
      };
    } catch {
      return {
        status: 'ok',
        db: 'error',
        timestamp: new Date(),
      };
    }
  }
}
