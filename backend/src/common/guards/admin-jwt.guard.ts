import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

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

@Injectable()
export class AdminJwtGuard implements CanActivate {
  private readonly jwtService = new JwtService();

  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request & { user?: Record<string, unknown> }>();
    const authorization = request.headers.authorization;

    const bearerToken = authorization?.startsWith('Bearer ')
      ? authorization.slice(7)
      : null;
    const cookieToken = readCookie(request, 'admin_access_token');
    const token = bearerToken ?? cookieToken;

    if (!token) {
      throw new UnauthorizedException('Admin authentication token is required');
    }

    try {
      const payload = this.jwtService.verify<Record<string, unknown>>(token, {
        secret: this.configService.get<string>('JWT_SECRET') ?? 'dev-jwt-secret',
      });

      const roles = payload.roles;
      const hasAdminRole =
        payload.role === 'admin' ||
        payload.isAdmin === true ||
        (typeof roles === 'string' && roles === 'admin') ||
        (Array.isArray(roles) && roles.includes('admin'));

      if (!hasAdminRole) {
        throw new ForbiddenException('Admin privileges are required');
      }

      request.user = payload;
      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }

      throw new UnauthorizedException('Invalid or expired admin token');
    }
  }
}
