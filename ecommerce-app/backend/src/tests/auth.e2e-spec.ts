import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { createE2EApp, describeE2E, randomEmail, readCookies } from './e2e-utils';

describeE2E('Auth E2E', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await createE2EApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('Register with valid data -> 201 + cookie set', async () => {
    const email = randomEmail('auth-register');

    const response = await request(app.getHttpServer())
      .post('/store/auth/register')
      .send({
        email,
        password: 'Password123!',
        name: 'Test User',
      })
      .expect(201);

    const cookies = readCookies(response.headers as Record<string, unknown>);
    expect(cookies.some((entry) => entry.startsWith('access_token='))).toBe(true);
    expect(cookies.some((entry) => entry.startsWith('refresh_token='))).toBe(true);
  });

  it('Register with duplicate email -> 409', async () => {
    const email = randomEmail('auth-duplicate');

    await request(app.getHttpServer()).post('/store/auth/register').send({
      email,
      password: 'Password123!',
      name: 'Duplicate User',
    });

    await request(app.getHttpServer())
      .post('/store/auth/register')
      .send({
        email,
        password: 'Password123!',
        name: 'Duplicate User Again',
      })
      .expect(409);
  });

  it('Login with correct credentials -> 200 + access token cookie', async () => {
    const email = randomEmail('auth-login-ok');
    const password = 'Password123!';

    await request(app.getHttpServer()).post('/store/auth/register').send({
      email,
      password,
      name: 'Login User',
    });

    const response = await request(app.getHttpServer())
      .post('/store/auth/login')
      .send({
        email,
        password,
      })
      .expect(200);

    const cookies = readCookies(response.headers as Record<string, unknown>);
    expect(cookies.some((entry) => entry.startsWith('access_token='))).toBe(true);
  });

  it('Login with wrong password -> 401', async () => {
    const email = randomEmail('auth-login-fail');

    await request(app.getHttpServer()).post('/store/auth/register').send({
      email,
      password: 'Password123!',
      name: 'Wrong Password User',
    });

    await request(app.getHttpServer())
      .post('/store/auth/login')
      .send({
        email,
        password: 'WrongPassword999!',
      })
      .expect(401);
  });

  it('After 5 failed logins -> account locked -> 429', async () => {
    const email = randomEmail('auth-lock');

    await request(app.getHttpServer()).post('/store/auth/register').send({
      email,
      password: 'Password123!',
      name: 'Lock User',
    });

    for (let attempt = 0; attempt < 5; attempt += 1) {
      await request(app.getHttpServer()).post('/store/auth/login').send({
        email,
        password: `WrongPassword-${attempt}`,
      });
    }

    await request(app.getHttpServer())
      .post('/store/auth/login')
      .send({
        email,
        password: 'WrongPassword-final',
      })
      .expect(429);
  });

  it('GET /store/auth/me without cookie -> 401', async () => {
    await request(app.getHttpServer()).get('/store/auth/me').expect(401);
  });

  it('GET /store/auth/me with valid cookie -> 200 + user data', async () => {
    const email = randomEmail('auth-me');
    const password = 'Password123!';

    await request(app.getHttpServer()).post('/store/auth/register').send({
      email,
      password,
      name: 'Me User',
    });

    const loginResponse = await request(app.getHttpServer()).post('/store/auth/login').send({
      email,
      password,
    });

    const cookies = readCookies(loginResponse.headers as Record<string, unknown>);

    const meResponse = await request(app.getHttpServer())
      .get('/store/auth/me')
      .set('Cookie', cookies)
      .expect(200);

    expect(meResponse.body).toMatchObject({
      email,
    });
  });
});
