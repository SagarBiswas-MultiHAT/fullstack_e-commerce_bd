import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';

function cookieExtractor(cookieName: string) {
  return (request: Request): string | null => {
    const cookieHeader = request?.headers?.cookie;
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
  };
}

@Injectable()
export class AdminJwtStrategy extends PassportStrategy(Strategy, 'admin-jwt') {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        cookieExtractor('admin_access_token'),
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') ?? 'dev-jwt-secret',
    });
  }

  validate(payload: Record<string, unknown>) {
    const roles = payload.roles;
    const isAdmin =
      payload.role === 'admin' ||
      payload.isAdmin === true ||
      (typeof roles === 'string' && roles === 'admin') ||
      (Array.isArray(roles) && roles.includes('admin'));

    if (!isAdmin) {
      throw new UnauthorizedException('Admin token is invalid for this route');
    }

    return payload;
  }
}
