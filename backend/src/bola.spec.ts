import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

describe('BOLA Vulnerability (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;

  const mockPrisma = {
    membroCasa: {
      findFirst: jest.fn(),
    },
    usuario: {
      findUnique: jest.fn(),
    },
    tenant: {
        findUnique: jest.fn(),
    }
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrisma)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    jwtService = moduleFixture.get<JwtService>(JwtService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should allow access to tenant data if no role is required (VULNERABILITY)', async () => {
    const userId = 'user-1';
    const otherTenantId = 'tenant-2';

    // Create a valid token for user-1
    const token = jwtService.sign({ sub: userId, username: 'testuser' });

    // Mock that the user is NOT a member of tenant-2
    mockPrisma.membroCasa.findFirst.mockResolvedValue(null);

    // Endpoint /financeiro/membros does not have @Roles decorator
    // It should ideally block access if the user is not in the tenant
    const response = await request(app.getHttpServer())
      .get('/financeiro/membros')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-ID', otherTenantId);

    // NEW BEHAVIOR: It should return 403 Forbidden because the user is not a member of the tenant.
    expect(response.status).toBe(403);
    expect(response.body.message).toBe('Você não é um membro ativo desta moradia.');
  });
});
