import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class IpWhitelistGuard implements CanActivate {
  private readonly logger = new Logger(IpWhitelistGuard.name);

  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const allowedRaw = this.configService.get<string>('ADMIN_ALLOWED_IPS') ?? '';
    const allowedIps = allowedRaw
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean)
      .map((entry) => this.normalizeIp(entry));

    if (!allowedIps.length) {
      return true;
    }

    const clientIp = this.normalizeIp(this.readClientIp(request));

    if (!clientIp || !allowedIps.includes(clientIp)) {
      this.logger.warn(`Blocked admin request from non-whitelisted IP: ${clientIp || 'unknown'}`);
      throw new ForbiddenException('This IP is not allowed for admin access');
    }

    return true;
  }

  private readClientIp(request: Request): string {
    const forwarded = request.headers['x-forwarded-for'];

    if (typeof forwarded === 'string' && forwarded.length > 0) {
      return forwarded.split(',')[0].trim();
    }

    if (Array.isArray(forwarded) && forwarded.length > 0) {
      return forwarded[0].split(',')[0].trim();
    }

    return request.ip || '';
  }

  private normalizeIp(value: string): string {
    if (!value) {
      return value;
    }

    if (value.startsWith('::ffff:')) {
      return value.slice(7);
    }

    return value;
  }
}
