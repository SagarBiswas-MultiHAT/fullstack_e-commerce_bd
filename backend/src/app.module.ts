import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { redisStore } from 'cache-manager-ioredis-yet';
import * as winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { WinstonModule } from 'nest-winston';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { AdminAuthModule } from './admin-auth/admin-auth.module';
import { AdminModule } from './admin/admin.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CategoriesModule } from './categories/categories.module';
import { SanitizeGuard } from './common/guards/sanitize.guard';
import { CouponsModule } from './coupons/coupons.module';
import { TypeOrmPerformanceLogger } from './database/typeorm.logger';
import { EmailModule } from './email/email.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { ProductsModule } from './products/products.module';
import { ReviewsModule } from './reviews/reviews.module';
import { SearchModule } from './search/search.module';
import { UploadModule } from './upload/upload.module';
import { WishlistModule } from './wishlist/wishlist.module';

const isProduction = process.env.NODE_ENV === 'production';

const loggerTransports: winston.transport[] = [
  new winston.transports.Console({
    level: isProduction ? 'info' : 'debug',
  }),
  new DailyRotateFile({
    filename: 'logs/app-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    maxFiles: '14d',
    level: 'info',
  }),
  new DailyRotateFile({
    filename: 'logs/errors-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    maxFiles: '14d',
    level: 'error',
  }),
];

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const redisUrl = configService.get<string>('UPSTASH_REDIS_URL');
        const redisToken = configService.get<string>('UPSTASH_REDIS_TOKEN');

        if (!redisUrl) {
          return {
            ttl: 60,
          };
        }

        const store = await redisStore({
          url: redisUrl,
          username: 'default',
          password: redisToken,
          ttl: 60,
        });

        return {
          store,
          ttl: 60,
        };
      },
    }),
    WinstonModule.forRoot({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
      ),
      transports: loggerTransports,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres' as const,
        url: configService.get<string>('DATABASE_URL'),
        ssl: { rejectUnauthorized: false },
        synchronize: false,
        logging:
          configService.get<string>('NODE_ENV') !== 'production'
            ? ['error', 'warn', 'migration']
            : ['error', 'warn'],
        maxQueryExecutionTime: 500,
        logger: new TypeOrmPerformanceLogger(),
        autoLoadEntities: true,
        migrations: [join(__dirname, 'database', 'migrations', '*{.ts,.js}')],
      }),
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 200,
      },
    ]),
    AuthModule,
    AdminAuthModule,
    AdminModule,
    EmailModule,
    SearchModule,
    PaymentsModule,
    ProductsModule,
    CategoriesModule,
    OrdersModule,
    ReviewsModule,
    UploadModule,
    WishlistModule,
    CouponsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: SanitizeGuard,
    },
  ],
})
export class AppModule {}
