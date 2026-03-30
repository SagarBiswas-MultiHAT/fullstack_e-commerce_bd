import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { App } from 'supertest/types';
import { AppModule } from '../app.module';

const shouldRunE2E = process.env.RUN_E2E === 'true';

export const describeE2E = shouldRunE2E ? describe : describe.skip;

export async function createE2EApp(): Promise<INestApplication<App>> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication();
  await app.init();
  return app;
}

export function randomEmail(prefix: string) {
  return `${prefix}.${Date.now()}.${Math.floor(Math.random() * 10000)}@example.com`;
}

export function pickAllowedIp() {
  const configured = (process.env.ADMIN_ALLOWED_IPS ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

  return configured[0] ?? '127.0.0.1';
}

export function adminToken() {
  const jwt = new JwtService({
    secret: process.env.JWT_SECRET ?? 'dev-jwt-secret',
  });

  return jwt.sign({
    sub: 'admin-test',
    role: 'admin',
    roles: ['admin'],
  });
}

export function nonAdminToken() {
  const jwt = new JwtService({
    secret: process.env.JWT_SECRET ?? 'dev-jwt-secret',
  });

  return jwt.sign({
    sub: 'customer-test',
    role: 'customer',
    roles: ['customer'],
  });
}

export function readCookies(headers: Record<string, unknown>) {
  const setCookie = headers['set-cookie'];

  if (!Array.isArray(setCookie)) {
    return [] as string[];
  }

  return setCookie.map((entry) => String(entry).split(';')[0]);
}
