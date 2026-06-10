import { Injectable, UnauthorizedException, ConflictException, Inject, forwardRef, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { FinanceiroGateway } from '../financeiro/financeiro.gateway';
import type { JwtPayload } from './auth.types';
import { randomUUID, randomBytes } from 'crypto';
import { MailService } from '../shared/mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailService: MailService,
    @Inject(forwardRef(() => FinanceiroGateway))
    private gateway: FinanceiroGateway,
  ) {}

  async register(email: string, nome: string, passwordSecret: string, inviteCode?: string, membroId?: string) {
    const cleanedEmail = email.trim().toLowerCase();
    
    const existing = await this.prisma.usuario.findUnique({
      where: { email: cleanedEmail },
    });

    if (existing) {
      throw new ConflictException('E-mail já está em uso.');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(passwordSecret, salt);

    const user = await this.prisma.usuario.create({
      data: {
        email: cleanedEmail,
        nome: nome,
        passwordHash,
      },
    });

    if (inviteCode) {
      const tenant = await this.prisma.tenant.findUnique({
        where: { inviteCode: inviteCode.toUpperCase() }
      });

      if (tenant) {
        let vinculado = false;

        if (membroId && membroId !== 'novo') {
          const membroExistente = await this.prisma.membroCasa.findFirst({
            where: { id: membroId, tenantId: tenant.id }
          });

          if (membroExistente) {
            await this.prisma.membroCasa.update({
              where: {
                id_tenantId: { id: membroId, tenantId: tenant.id }
              },
              data: { userId: user.id }
            });
            vinculado = true;
          }
        }

        if (!vinculado) {
          await this.prisma.membroCasa.create({
            data: {
              id: `membro-${randomUUID()}`,
              tenantId: tenant.id,
              nome: user.nome,
              avatar: user.nome.substring(0, 2).toUpperCase(),
              userId: user.id,
            }
          });
        }
        
        this.gateway.notificarAlteracao(tenant.id, 'membros_alterados');
      }
    }

    return {
      userId: user.id,
      email: user.email,
      nome: user.nome,
    };
  }

  async login(email: string, passwordSecret: string) {
    const cleanedEmail = email.trim().toLowerCase();
    
    const user = await this.prisma.usuario.findUnique({
      where: { email: cleanedEmail },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    const isMatch = await bcrypt.compare(passwordSecret, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    const payload = { sub: user.id, email: user.email };
    return {
      access_token: this.jwtService.sign(payload),
      userId: user.id,
      email: user.email,
      nome: user.nome,
    };
  }

  validarToken(token: string): JwtPayload | null {
    try {
      return this.jwtService.verify<JwtPayload>(token);
    } catch {
      return null;
    }
  }

  async getMe(userId: string) {
    if (!userId) {
      throw new UnauthorizedException('Token inválido ou sem ID de usuário.');
    }

    const user = await this.prisma.usuario.findUnique({
      where: { id: userId },
      include: {
        perfisMembro: {
          include: {
            tenant: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado.');
    }

    const tenantsList = user.perfisMembro.map(p => ({
      id: p.tenant.id,
      name: p.tenant.name,
      inviteCode: p.tenant.inviteCode,
    }));

    return {
      id: user.id,
      email: user.email,
      nome: user.nome,
      tenants: tenantsList,
    };
  }

  async forgotPassword(email: string) {
    const cleanedEmail = email.trim().toLowerCase();
    
    const user = await this.prisma.usuario.findUnique({
      where: { email: cleanedEmail },
    });

    if (!user) {
      // Simular sucesso para não expor se o e-mail existe
      return { message: 'Se o e-mail existir, um link de recuperação foi enviado.' };
    }

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // Expira em 1 hora

    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    // Enviar e-mail sem travar a thread principal (ou aguardar)
    await this.mailService.sendPasswordResetEmail(user.email, token).catch(e => {
      console.error('Falha ao enviar email:', e);
    });

    return { message: 'Se o e-mail existir, um link de recuperação foi enviado.' };
  }

  async resetPassword(token: string, newPasswordSecret: string) {
    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { token },
      include: { usuario: true },
    });

    if (!resetToken) {
      throw new BadRequestException('Token inválido ou expirado.');
    }

    if (resetToken.expiresAt < new Date()) {
      throw new BadRequestException('Token expirado.');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPasswordSecret, salt);

    await this.prisma.$transaction([
      this.prisma.usuario.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      }),
      this.prisma.passwordResetToken.deleteMany({
        where: { userId: resetToken.userId }, // Deleta todos os tokens do usuário por segurança
      }),
    ]);

    return { message: 'Senha redefinida com sucesso.' };
  }
}
