import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CustomerJwtGuard } from '../common/guards/customer-jwt.guard';
import { AuthService } from './auth.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

function readCookie(request: Request, cookieName: string): string | null {
  const cookieHeader = request.headers.cookie;
  if (!cookieHeader) {
    return null;
  }

  const target = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((cookie) => cookie.startsWith(`${cookieName}=`));

  if (!target) {
    return null;
  }

  return target.slice(cookieName.length + 1);
}

@Controller('store/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.register(dto);
    this.setAuthCookies(response, result.tokens.accessToken, result.tokens.refreshToken);

    return {
      customer: result.customer,
    };
  }

  @Post('login')
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) response: Response) {
    const result = await this.authService.login(dto);
    this.setAuthCookies(response, result.tokens.accessToken, result.tokens.refreshToken);

    return {
      customer: result.customer,
    };
  }

  @Post('logout')
  async logout(
    @Body() body: { refreshToken?: string },
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = body.refreshToken ?? readCookie(request, 'refresh_token') ?? '';

    await this.authService.logout(refreshToken);

    response.clearCookie('access_token', this.cookieOptions(0));
    response.clearCookie('refresh_token', this.cookieOptions(0));

    return {
      success: true,
    };
  }

  @Post('refresh')
  async refreshSession(
    @Body() body: { refreshToken?: string },
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = body.refreshToken ?? readCookie(request, 'refresh_token');

    if (!refreshToken) {
      throw new BadRequestException('Refresh token is required');
    }

    const result = await this.authService.refreshTokens(refreshToken);
    this.setAuthCookies(response, result.tokens.accessToken, result.tokens.refreshToken);

    return {
      customer: result.customer,
    };
  }

  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Get('me')
  @UseGuards(CustomerJwtGuard)
  me(@CurrentUser() user: Record<string, unknown>) {
    const customerId = (user?.sub as string | undefined) ?? (user?.id as string | undefined);

    if (!customerId) {
      throw new BadRequestException('Authenticated customer id is missing from token payload');
    }

    return this.authService.getProfile(customerId);
  }

  private setAuthCookies(response: Response, accessToken: string, refreshToken: string) {
    const accessMaxAge = 15 * 60 * 1000;
    const refreshMaxAge = 30 * 24 * 60 * 60 * 1000;

    response.cookie('access_token', accessToken, this.cookieOptions(accessMaxAge));
    response.cookie('refresh_token', refreshToken, this.cookieOptions(refreshMaxAge));
  }

  private cookieOptions(maxAge: number) {
    return {
      httpOnly: true,
      secure: true,
      sameSite: 'strict' as const,
      maxAge,
      path: '/',
      domain: this.configService.get<string>('COOKIE_DOMAIN') || undefined,
    };
  }
}
