import { Body, Controller, Get, Post, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AdminJwtGuard } from '../common/guards/admin-jwt.guard';
import { IpWhitelistGuard } from '../common/guards/ip-whitelist.guard';
import { AdminAuthService } from './admin-auth.service';
import { AdminLoginDto } from './dto/admin-login.dto';

@Controller('admin/auth')
export class AdminAuthController {
  constructor(
    private readonly adminAuthService: AdminAuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('login')
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @UseGuards(IpWhitelistGuard)
  async login(@Body() dto: AdminLoginDto, @Res({ passthrough: true }) response: Response) {
    const result = await this.adminAuthService.login(dto);

    if (result.requiresTwoFactorSetup) {
      return result;
    }

    response.cookie('admin_access_token', result.accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
      path: '/',
      domain: this.configService.get<string>('COOKIE_DOMAIN') || undefined,
    });

    return {
      requiresTwoFactorSetup: false,
    };
  }

  @Get('me')
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @UseGuards(AdminJwtGuard, IpWhitelistGuard)
  me(@CurrentUser() user: Record<string, unknown>) {
    return this.adminAuthService.me(user);
  }

  @Post('logout')
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @UseGuards(IpWhitelistGuard)
  logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie('admin_access_token', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/',
      domain: this.configService.get<string>('COOKIE_DOMAIN') || undefined,
    });

    return { success: true };
  }
}
