import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerJwtGuard } from '../common/guards/customer-jwt.guard';
import { Customer } from '../entities/customer.entity';
import { RefreshToken } from '../entities/refresh-token.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AdminJwtStrategy } from './strategies/admin-jwt.strategy';
import { CustomerJwtStrategy } from './strategies/customer-jwt.strategy';

@Module({
  imports: [
    ConfigModule,
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') ?? 'dev-jwt-secret',
      }),
    }),
    TypeOrmModule.forFeature([Customer, RefreshToken]),
  ],
  controllers: [AuthController],
  providers: [AuthService, CustomerJwtStrategy, AdminJwtStrategy, CustomerJwtGuard],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
