import { Test, TestingModule } from '@nestjs/testing';
import { ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

describe('BOLA Security (e2e)', () => {
  let jwtService: JwtService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    jwtService = moduleFixture.get<JwtService>(JwtService);
  });

  it('should prevent user from accessing members of a tenant they do not belong to, even if no roles are required', async () => {
    // 1. Create a user token
    const userPayload = { sub: 'user-1', email: 'user1@example.com' };
    const token = jwtService.sign(userPayload);

    // 2. Mock Prisma to say this user is NOT a member of tenant-A
    const mockPrisma = {
      membroCasa: {
        findFirst: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue([]),
      },
    };

    const moduleFixtureMock: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrisma)
      .compile();

    const appMock = moduleFixtureMock.createNestApplication();
    appMock.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await appMock.init();

    // 3. Attempt to access /financeiro/membros with X-Tenant-ID: tenant-A
    // This endpoint has no @Roles decorator
    const response = await request(appMock.getHttpServer())
      .get('/financeiro/membros')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-ID', 'tenant-A');

    // It SHOULD be 403 Forbidden because the user is not a member of tenant-A
    // But currently it will likely be 200 (or whatever the service returns) because the guard skips check
    expect(response.status).toBe(403);

    await appMock.close();
  });
});
