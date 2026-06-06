import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './app.module';

describe('Security (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/financeiro/membros (GET) should return 401 Unauthorized without token', () => {
    return request(app.getHttpServer())
      .get('/financeiro/membros')
      .expect(401);
  });

  it('/auth/login (POST) should not return 401 from guard', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({});
      // If it reaches controller, ValidationPipe will return 400 because of missing fields
      expect(response.status).toBe(400);
  });

  it('/financeiro/tenants/invite/CODE (GET) should be accessible without token (public)', async () => {
      const response = await request(app.getHttpServer())
        .get('/financeiro/tenants/invite/NONEXISTENT')
      // Should reach controller and return 404 since it's non-existent, but NOT 401 from guard
      expect(response.status).toBe(404);
  });

  it('BOLA/IDOR: should NOT allow user to access members of a tenant they do not belong to', async () => {
    // 1. Register and login User A
    const userA = { username: 'usera', password: 'password123' };
    await request(app.getHttpServer()).post('/auth/register').send(userA);
    const loginA = await request(app.getHttpServer()).post('/auth/login').send(userA);
    const tokenA = loginA.body.access_token;

    // 2. User A creates a Tenant
    const tenantRes = await request(app.getHttpServer())
      .post('/financeiro/tenants')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: 'Tenant A' });
    const tenantId = tenantRes.body.id;

    // 3. Register and login User B
    const userB = { username: 'userb', password: 'password123' };
    await request(app.getHttpServer()).post('/auth/register').send(userB);
    const loginB = await request(app.getHttpServer()).post('/auth/login').send(userB);
    const tokenB = loginB.body.access_token;

    // 4. User B tries to access User A's tenant members
    // Currently this endpoint /financeiro/membros DOES NOT have @Roles() and thus
    // TenantRoleGuard currently returns true because requiredRoles is empty.
    const response = await request(app.getHttpServer())
      .get('/financeiro/membros')
      .set('Authorization', `Bearer ${tokenB}`)
      .set('x-tenant-id', tenantId);

    // This is the expected behavior after fix. Currently it probably returns 200.
    // We want it to be 403.
    expect(response.status).toBe(403);
  });
});
