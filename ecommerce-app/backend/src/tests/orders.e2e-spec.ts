import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import {
  adminToken,
  createE2EApp,
  describeE2E,
  pickAllowedIp,
  randomEmail,
  readCookies,
} from './e2e-utils';

async function registerAndLogin(app: INestApplication<App>) {
  const email = randomEmail('orders-user');
  const password = 'Password123!';

  await request(app.getHttpServer()).post('/store/auth/register').send({
    email,
    password,
    name: 'Order Customer',
  });

  const loginResponse = await request(app.getHttpServer()).post('/store/auth/login').send({
    email,
    password,
  });

  return readCookies(loginResponse.headers as Record<string, unknown>);
}

async function createAdminProduct(app: INestApplication<App>, stock: number) {
  const response = await request(app.getHttpServer())
    .post('/admin/products')
    .set('Authorization', `Bearer ${adminToken()}`)
    .set('x-forwarded-for', pickAllowedIp())
    .send({
      title: `Order Product ${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      slug: `order-product-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      price: 799,
      stock,
      images: [],
    })
    .expect(201);

  return response.body.id as string;
}

describeE2E('Orders E2E', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await createE2EApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /store/orders without auth -> 401', async () => {
    await request(app.getHttpServer())
      .post('/store/orders')
      .send({
        items: [],
        addressId: 'address-1',
        paymentMethod: 'cod',
      })
      .expect(401);
  });

  it('POST /store/orders with out-of-stock item -> 400', async () => {
    const cookies = await registerAndLogin(app);
    const outOfStockProductId = await createAdminProduct(app, 0);

    await request(app.getHttpServer())
      .post('/store/orders')
      .set('Cookie', cookies)
      .send({
        items: [{ productId: outOfStockProductId, quantity: 1 }],
        addressId: 'address-1',
        paymentMethod: 'cod',
      })
      .expect(400);
  });

  it('POST /store/orders with valid items -> 201 + order created', async () => {
    const cookies = await registerAndLogin(app);
    const productId = await createAdminProduct(app, 10);

    const response = await request(app.getHttpServer())
      .post('/store/orders')
      .set('Cookie', cookies)
      .send({
        items: [{ productId, quantity: 1 }],
        addressId: 'address-1',
        paymentMethod: 'cod',
      })
      .expect(201);

    expect(response.body).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        status: 'pending',
      }),
    );
  });

  it('PUT /admin/orders/:id/status (admin) -> 200 + status updated', async () => {
    const cookies = await registerAndLogin(app);
    const productId = await createAdminProduct(app, 10);

    const orderResponse = await request(app.getHttpServer())
      .post('/store/orders')
      .set('Cookie', cookies)
      .send({
        items: [{ productId, quantity: 1 }],
        addressId: 'address-1',
        paymentMethod: 'cod',
      })
      .expect(201);

    const orderId = orderResponse.body.id as string;

    const response = await request(app.getHttpServer())
      .put(`/admin/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${adminToken()}`)
      .set('x-forwarded-for', pickAllowedIp())
      .send({ status: 'processing' })
      .expect(200);

    expect(response.body.status).toBe('processing');
  });
});
