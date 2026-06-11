import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../shared/mail/mail.service';
import { JwtService } from '@nestjs/jwt';
import { FinanceiroGateway } from '../financeiro/financeiro.gateway';
import { ConflictException } from '@nestjs/common';

describe('AuthFlow Integration', () => {
  let service: AuthService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { 
          provide: PrismaService, 
          useValue: {
            usuario: { findUnique: jest.fn(), create: jest.fn() },
            tenant: { findUnique: jest.fn() },
            membroCasa: { findFirst: jest.fn(), update: jest.fn(), create: jest.fn() },
            $transaction: jest.fn(async (callback) => callback({
                usuario: prisma.usuario,
                tenant: prisma.tenant,
                membroCasa: prisma.membroCasa
            })),
          }
        },
        { provide: MailService, useValue: { sendPasswordResetEmail: jest.fn() } },
        { provide: JwtService, useValue: { sign: jest.fn() } },
        { provide: FinanceiroGateway, useValue: { notificarAlteracao: jest.fn() } },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should register a new user and create a member in tenant if invite code is valid', async () => {
    const userData = { email: 'test@example.com', nome: 'Test User', passwordSecret: 'password123' };
    const inviteCode = 'INVITE123';
    
    (prisma.usuario.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.usuario.create as jest.Mock).mockResolvedValue({ id: 'user-1', ...userData });
    (prisma.tenant.findUnique as jest.Mock).mockResolvedValue({ id: 'tenant-1' });
    (prisma.membroCasa.create as jest.Mock).mockResolvedValue({ id: 'membro-1' });

    const result = await service.register(userData.email, userData.nome, userData.passwordSecret, inviteCode);
    
    expect(result.userId).toBe('user-1');
    expect(prisma.membroCasa.create).toHaveBeenCalled();
  });

  it('should throw ConflictException if email is already in use', async () => {
    (prisma.usuario.findUnique as jest.Mock).mockResolvedValue({ id: 'user-1' });

    await expect(service.register('existing@test.com', 'User', 'pass')).rejects.toThrow(ConflictException);
  });
});
