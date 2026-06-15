import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

import { JwtService } from '@nestjs/jwt';
import { FinanceiroGateway } from '../financeiro/financeiro.gateway';
import { ConflictException } from '@nestjs/common';
import { EmailService } from '../shared/email.service';

describe('AuthFlow Integration', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let emailService: EmailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { 
          provide: PrismaService, 
          useValue: {
            usuario: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
            tenant: { findUnique: jest.fn() },
            membroCasa: { findFirst: jest.fn(), update: jest.fn(), create: jest.fn() },
            passwordResetToken: { create: jest.fn(), findUnique: jest.fn(), delete: jest.fn(), deleteMany: jest.fn() },
            $transaction: jest.fn(async (callback) => {
              if (Array.isArray(callback)) {
                return callback;
              }
              return callback({
                usuario: prisma.usuario,
                tenant: prisma.tenant,
                membroCasa: prisma.membroCasa
              });
            }),
          }
        },

        { provide: JwtService, useValue: { sign: jest.fn() } },
        { provide: FinanceiroGateway, useValue: { notificarAlteracao: jest.fn() } },
        { provide: EmailService, useValue: { enviarEmailRecuperacao: jest.fn() } },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    emailService = module.get<EmailService>(EmailService);
    jest.clearAllMocks();
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

  describe('Password Reset Flow', () => {
    it('should generate token, save it and send email on forgotPassword', async () => {
      (prisma.usuario.findUnique as jest.Mock).mockResolvedValue({ id: 'user-1', nome: 'Test User', email: 'test@example.com', passwordHash: 'hash' });
      
      await service.forgotPassword('test@example.com');
      
      expect(prisma.passwordResetToken.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-1',
          token: expect.any(String),
        })
      }));
      expect(emailService.enviarEmailRecuperacao).toHaveBeenCalledWith('test@example.com', 'Test User', expect.any(String));
    });

    it('should quietly return on forgotPassword if user does not exist', async () => {
      (prisma.usuario.findUnique as jest.Mock).mockResolvedValue(null);
      await service.forgotPassword('unknown@example.com');
      expect(prisma.passwordResetToken.create).not.toHaveBeenCalled();
      expect(emailService.enviarEmailRecuperacao).not.toHaveBeenCalled();
    });

    it('should generate token and send email on forgotPassword even if user does not have a password hash (Google user)', async () => {
      (prisma.usuario.findUnique as jest.Mock).mockResolvedValue({ id: 'user-1', nome: 'Google User', email: 'google@example.com', passwordHash: null });
      
      await service.forgotPassword('google@example.com');
      
      expect(prisma.passwordResetToken.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-1',
          token: expect.any(String),
        })
      }));
      expect(emailService.enviarEmailRecuperacao).toHaveBeenCalledWith('google@example.com', 'Google User', expect.any(String));
    });

    it('should reset password successfully', async () => {
      const mockToken = {
        id: 'token-1',
        userId: 'user-1',
        token: 'valid-token',
        expiresAt: new Date(Date.now() + 10000), // future
      };
      (prisma.passwordResetToken.findUnique as jest.Mock).mockResolvedValue(mockToken);
      
      await service.resetPassword('valid-token', 'new-pass');
      
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should throw error if token is expired', async () => {
      const mockToken = {
        id: 'token-1',
        userId: 'user-1',
        token: 'expired-token',
        expiresAt: new Date(Date.now() - 10000), // past
      };
      (prisma.passwordResetToken.findUnique as jest.Mock).mockResolvedValue(mockToken);
      
      await expect(service.resetPassword('expired-token', 'new-pass')).rejects.toThrow('Token inválido ou expirado');
      expect(prisma.passwordResetToken.delete).toHaveBeenCalledWith({ where: { id: mockToken.id } });
    });
  });
});
