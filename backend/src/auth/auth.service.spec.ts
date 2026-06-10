import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../shared/mail/mail.service';
import { JwtService } from '@nestjs/jwt';
import { FinanceiroGateway } from '../financeiro/financeiro.gateway';
import { performance } from 'perf_hooks';

describe('AuthService Performance', () => {
  let service: AuthService;

  const mockPrisma = {
    usuario: {
      findUnique: jest.fn(),
    },
    passwordResetToken: {
      create: jest.fn(),
    },
  };

  const mockMailService = {
    sendPasswordResetEmail: jest.fn(),
  };

  const mockJwtService = {};
  const mockGateway = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: MailService, useValue: mockMailService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: FinanceiroGateway, useValue: mockGateway },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('forgotPassword baseline performance', async () => {
    const email = 'test@example.com';
    const delay = 100;

    mockPrisma.usuario.findUnique.mockResolvedValue({
      id: 'user-1',
      email: email,
      nome: 'Test User',
    });

    mockPrisma.passwordResetToken.create.mockResolvedValue({});

    mockMailService.sendPasswordResetEmail.mockImplementation(async () => {
      return new Promise((resolve) => setTimeout(resolve, delay));
    });

    const start = performance.now();
    await service.forgotPassword(email);
    const end = performance.now();

    const duration = end - start;
    console.log(`forgotPassword duration: ${duration}ms`);

    expect(duration).toBeLessThan(delay);
    expect(mockMailService.sendPasswordResetEmail).toHaveBeenCalled();
  });
});
