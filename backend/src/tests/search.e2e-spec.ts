import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { adminToken, createE2EApp, describeE2E, pickAllowedIp } from './e2e-utils';

async function seedSearchProduct(app: INestApplication<App>) {
  const slug = `search-product-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  await request(app.getHttpServer())
    .post('/admin/products')
    .set('Authorization', `Bearer ${adminToken()}`)
    .set('x-forwarded-for', pickAllowedIp())
    .send({
      title: `Search Test ${slug}`,
      slug,
      description: 'Search fixture product',
      price: 1199,
      stock: 4,
      images: [],
    })
    .expect(201);
}

describeE2E('Search E2E', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await createE2EApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /store/search?q=test -> 200 + results array', async () => {
    await seedSearchProduct(app);

    const response = await request(app.getHttpServer())
      .get('/store/search')
      .query({ q: 'search test', page: 1, limit: 10 })
      .expect(200);

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

  it('GET /store/search with filters -> filtered results', async () => {
    const response = await request(app.getHttpServer())
      .get('/store/search')
      .query({
        q: 'search',
        minPrice: 100,
        maxPrice: 5000,
        inStock: true,
        page: 1,
        limit: 10,
      })
      .expect(200);

    expect(Array.isArray(response.body.items)).toBe(true);
  });

  it('GET /store/search?q= (empty) -> 200 + empty or default results', async () => {
    const response = await request(app.getHttpServer())
      .get('/store/search')
      .query({ q: '', page: 1, limit: 10 })
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        items: expect.any(Array),
      }),
    );
  });
});
