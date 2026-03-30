import { Body, Controller, Get, Post, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AdminJwtGuard } from '../common/guards/admin-jwt.guard';
import { AdminAuthService } from './admin-auth.service';
import { AdminLoginDto } from './dto/admin-login.dto';

@Controller('admin/auth')
export class AdminAuthController {
  constructor(
    private readonly adminAuthService: AdminAuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('login')
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
  @UseGuards(AdminJwtGuard)
  me(@CurrentUser() user: Record<string, unknown>) {
    return this.adminAuthService.me(user);
  }
}
