import { Injectable, UnauthorizedException, ConflictException, Inject, forwardRef, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { FinanceiroGateway } from '../financeiro/financeiro.gateway';
import type { JwtPayload } from './auth.types';
import { randomUUID, randomBytes } from 'crypto';
import { MailService } from '../shared/mail/mail.service';
import { Prisma } from '@prisma/client';
import { OAuth2Client } from 'google-auth-library';
import { GoogleAuthDto } from './dto/google-auth.dto';

@Injectable()
export class AuthService {
  private googleClient = new OAuth2Client();

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

    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.usuario.create({
        data: {
          email: cleanedEmail,
          nome: nome,
          passwordHash,
        },
      });

      const { tenantId, membroId: membroIdVinculado } = await this.associarUsuarioAoTenantTx(
        tx,
        user,
        inviteCode,
        membroId
      );

      return { user, tenantId, membroId: membroIdVinculado };
    });

    if (result.tenantId) {
      this.gateway.notificarAlteracao(result.tenantId, 'membros_alterados');
    }

    return {
      userId: result.user.id,
      email: result.user.email,
      nome: result.user.nome,
    };
  }

  private async associarUsuarioAoTenantTx(
    tx: Prisma.TransactionClient,
    user: any,
    inviteCode?: string,
    membroId?: string
  ): Promise<{ tenantId: string | null; membroId: string | null }> {
    if (!inviteCode) {
      return { tenantId: null, membroId: null };
    }

    const tenant = await tx.tenant.findUnique({
      where: { inviteCode: inviteCode.toUpperCase() }
    });

    if (!tenant) {
      return { tenantId: null, membroId: null };
    }

    const membroIdVinculado = await this.vincularMembroExistenteTx(tx, tenant.id, user.id, membroId);
    if (membroIdVinculado) {
      return { tenantId: tenant.id, membroId: membroIdVinculado };
    }

    const novoMembro = await tx.membroCasa.create({
      data: {
        id: `membro-${randomUUID()}`,
        tenantId: tenant.id,
        nome: user.nome,
        avatar: user.nome.substring(0, 2).toUpperCase(),
        userId: user.id,
      }
    });

    return { tenantId: tenant.id, membroId: novoMembro.id };
  }

  private async vincularMembroExistenteTx(
    tx: Prisma.TransactionClient,
    tenantId: string,
    userId: string,
    membroId?: string
  ): Promise<string | null> {
    if (!membroId || membroId === 'novo') {
      return null;
    }

    const membroExistente = await tx.membroCasa.findFirst({
      where: { id: membroId, tenantId }
    });

    if (!membroExistente) {
      return null;
    }

    await tx.membroCasa.update({
      where: {
        id_tenantId: { id: membroId, tenantId }
      },
      data: { userId }
    });

    return membroId;
  }

  async login(email: string, passwordSecret: string) {
    const cleanedEmail = email.trim().toLowerCase();
    
    const user = await this.prisma.usuario.findUnique({
      where: { email: cleanedEmail },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException('Esta conta está vinculada ao login do Google. Por favor, entre usando o Google.');
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
    this.mailService.sendPasswordResetEmail(user.email, token).catch(e => {
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

  async loginComGoogle(googleAuthDto: GoogleAuthDto) {
    const { credential, inviteCode, membroId } = googleAuthDto;

    let payload;
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch (error) {
      throw new UnauthorizedException('Credencial do Google inválida.');
    }

    if (!payload || !payload.email) {
      throw new UnauthorizedException('Não foi possível obter o e-mail do Google.');
    }

    if (!payload.email_verified) {
      throw new UnauthorizedException('O e-mail do Google não está verificado.');
    }

    const email = payload.email.trim().toLowerCase();
    const nome = payload.name || 'Usuário Google';
    const googleId = payload.sub; // Identificador exclusivo do Google

    // Busca usuário pelo googleId ou pelo email
    let user = await this.prisma.usuario.findFirst({
      where: {
        OR: [
          { googleId },
          { email }
        ]
      }
    });

    let tenantId: string | null = null;

    if (!user) {
      // Cria novo usuário
      const result = await this.prisma.$transaction(async (tx) => {
        const novoUser = await tx.usuario.create({
          data: {
            email,
            nome,
            googleId,
            passwordHash: null, // Login social não tem senha inicial
          },
        });

        const { tenantId: tId } = await this.associarUsuarioAoTenantTx(
          tx,
          novoUser,
          inviteCode,
          membroId
        );

        return { user: novoUser, tenantId: tId };
      });

      user = result.user;
      tenantId = result.tenantId;
    } else {
      // Se o usuário existe mas não tem googleId associado, vincula agora
      if (!user.googleId) {
        user = await this.prisma.usuario.update({
          where: { id: user.id },
          data: { googleId }
        });
      }

      // Se houver um convite, associa o usuário existente à casa
      if (inviteCode) {
        const result = await this.prisma.$transaction(async (tx) => {
          return this.associarUsuarioAoTenantTx(tx, user, inviteCode, membroId);
        });
        tenantId = result.tenantId;
      }
    }

    if (tenantId) {
      this.gateway.notificarAlteracao(tenantId, 'membros_alterados');
    }

    const jwtPayload = { sub: user.id, email: user.email };
    return {
      access_token: this.jwtService.sign(jwtPayload),
      userId: user.id,
      email: user.email,
      nome: user.nome,
    };
  }
}
