import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';

describe('Security (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        tenant: {
          findUnique: jest.fn().mockResolvedValue(null),
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/api/financeiro/membros (GET) should return 401 Unauthorized without token', () => {
    return request(app.getHttpServer())
      .get('/api/financeiro/membros')
      .expect(401);
  });

  it('/api/auth/login (POST) should not return 401 from guard', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({});
      expect(response.status).toBe(400);
  });

  it('/api/financeiro/tenants/invite/CODE (GET) should be accessible without token (public)', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/financeiro/tenants/invite/NONEXISTENT')
      expect(response.status).toBe(404);
  });
});
