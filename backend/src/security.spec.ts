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
});
