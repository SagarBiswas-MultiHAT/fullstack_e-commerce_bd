import { Injectable } from '@nestjs/common';
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
export class CustomerJwtStrategy extends PassportStrategy(Strategy, 'customer-jwt') {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        cookieExtractor('access_token'),
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') ?? 'dev-jwt-secret',
    });
  }

  validate(payload: Record<string, unknown>) {
    return payload;
  }
}
