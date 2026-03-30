import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../entities/order.entity';
import { EmailSchedulerService } from './email-scheduler.service';
import { EmailService } from './email.service';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Order])],
  providers: [EmailService, EmailSchedulerService],
  exports: [EmailService],
})
export class EmailModule {}