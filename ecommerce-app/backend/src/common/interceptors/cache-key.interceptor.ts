import { CacheInterceptor } from '@nestjs/cache-manager';
import { ExecutionContext, Injectable } from '@nestjs/common';
import type { Request } from 'express';

@Injectable()
export class CacheKeyInterceptor extends CacheInterceptor {
  trackBy(context: ExecutionContext): string | undefined {
    const request = context.switchToHttp().getRequest<
      Request & {
        route?: { path?: string };
        query?: Record<string, string | string[]>;
      }
    >();

    if (!request || request.method !== 'GET') {
      return undefined;
    }

    const routePath = request.route?.path ?? request.path ?? request.url;
    const queryEntries = Object.entries(request.query ?? {})
      .flatMap(([key, rawValue]) => {
        if (Array.isArray(rawValue)) {
          return rawValue.map((value) => [key, String(value)] as const);
        }

        return [[key, String(rawValue)] as const];
      })
      .sort(([keyA, valueA], [keyB, valueB]) => {
        if (keyA === keyB) {
          return valueA.localeCompare(valueB);
        }

        return keyA.localeCompare(keyB);
      })
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');

    return queryEntries ? `${routePath}?${queryEntries}` : routePath;
  }
}
