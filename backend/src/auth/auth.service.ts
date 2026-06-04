import { Injectable, UnauthorizedException, ConflictException, Inject, forwardRef } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { FinanceiroGateway } from '../financeiro/financeiro.gateway';
import { randomUUID } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    @Inject(forwardRef(() => FinanceiroGateway))
    private gateway: FinanceiroGateway,
  ) {}

  async register(username: string, passwordSecret: string, inviteCode?: string, membroId?: string) {
    const cleanedUsername = username.trim().toLowerCase();
    
    const existing = await this.prisma.usuario.findUnique({
      where: { username: cleanedUsername },
    });

    if (existing) {
      throw new ConflictException('Nome de usuário já está em uso.');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(passwordSecret, salt);

    const user = await this.prisma.usuario.create({
      data: {
        username: cleanedUsername,
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
              nome: user.username,
              avatar: user.username.substring(0, 2).toUpperCase(),
              userId: user.id,
            }
          });
        }
        
        // Dispara o evento de Websocket para os usuários da casa que já estão no Dashboard
        this.gateway.notificarAlteracao(tenant.id, 'membros_alterados');
      }
    }

    return {
      userId: user.id,
      username: user.username,
    };
  }

  async login(username: string, passwordSecret: string) {
    const cleanedUsername = username.trim().toLowerCase();
    
    const user = await this.prisma.usuario.findUnique({
      where: { username: cleanedUsername },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    const isMatch = await bcrypt.compare(passwordSecret, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    const payload = { sub: user.id, username: user.username };
    return {
      access_token: this.jwtService.sign(payload),
      userId: user.id,
      username: user.username,
    };
  }

  validarToken(token: string): any {
    try {
      return this.jwtService.verify(token);
    } catch (err) {
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
      username: user.username,
      tenants: tenantsList,
    };
  }
}
