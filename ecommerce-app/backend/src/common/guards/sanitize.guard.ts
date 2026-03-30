import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class SanitizeGuard implements CanActivate {
  private readonly sqlPattern = /\b(select|insert|drop|delete|update|union)\b|--/gi;

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    if (request.query) {
      const sanitizedQuery = this.sanitizeValue(request.query);
      (request as Request & { query: Request['query'] }).query = sanitizedQuery as Request['query'];
    }

    return true;
  }

  private sanitizeValue(value: unknown): unknown {
    if (typeof value === 'string') {
      return value.replace(this.sqlPattern, '').replace(/\s{2,}/g, ' ').trim();
    }

    if (Array.isArray(value)) {
      return value.map((entry) => this.sanitizeValue(entry));
    }

    if (!value || typeof value !== 'object') {
      return value;
    }

    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, this.sanitizeValue(entry)]),
    );
  }
}
