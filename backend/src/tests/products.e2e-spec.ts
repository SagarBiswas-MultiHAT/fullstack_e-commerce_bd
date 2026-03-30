import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import {
  adminToken,
  createE2EApp,
  describeE2E,
  nonAdminToken,
  pickAllowedIp,
} from './e2e-utils';

describeE2E('Products E2E', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await createE2EApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /store/products -> 200 + paginated list', async () => {
    const response = await request(app.getHttpServer()).get('/store/products').expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        items: expect.any(Array),
        pagination: expect.objectContaining({
          page: expect.any(Number),
          limit: expect.any(Number),
        }),
      }),
    );
  });

  it('GET /store/products/:slug (valid) -> 200 + product', async () => {
    const listResponse = await request(app.getHttpServer()).get('/store/products').expect(200);
    const firstProductSlug = listResponse.body?.items?.[0]?.slug as string | undefined;

    if (!firstProductSlug) {
      return;
    }

    const response = await request(app.getHttpServer())
      .get(`/store/products/${firstProductSlug}`)
      .expect(200);

    expect(response.body.slug).toBe(firstProductSlug);
  });

  it('GET /store/products/:slug (invalid) -> 404', async () => {
    await request(app.getHttpServer())
      .get('/store/products/slug-that-does-not-exist')
      .expect(404);
  });

  it('POST /admin/products without admin JWT -> 403', async () => {
    const response = await request(app.getHttpServer())
      .post('/admin/products')
      .set('Authorization', `Bearer ${nonAdminToken()}`)
      .set('x-forwarded-for', pickAllowedIp())
      .send({
        title: 'Unauthorized Product',
        slug: `unauthorized-product-${Date.now()}`,
        price: 499,
        stock: 3,
      });

    expect(response.status).toBe(403);
  });

  it('POST /admin/products with admin JWT + valid body -> 201', async () => {
    const response = await request(app.getHttpServer())
      .post('/admin/products')
      .set('Authorization', `Bearer ${adminToken()}`)
      .set('x-forwarded-for', pickAllowedIp())
      .send({
        title: 'Admin Product',
        slug: `admin-product-${Date.now()}`,
        description: 'Created by e2e test',
        price: 999,
        stock: 8,
        images: [],
      })
      .expect(201);

    expect(response.body).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        slug: expect.stringContaining('admin-product-'),
      }),
    );
  });
});
