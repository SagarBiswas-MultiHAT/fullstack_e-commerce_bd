import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import xss from 'xss';
import { Request } from 'express';

@Injectable()
export class SanitizeInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request & { body?: unknown }>();

    if (request.body && typeof request.body === 'object' && !Buffer.isBuffer(request.body)) {
      request.body = this.sanitizeValue(request.body);
    }

    return next.handle();
  }

  private sanitizeValue(value: unknown): unknown {
    if (typeof value === 'string') {
      return xss(value);
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
