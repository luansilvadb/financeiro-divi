import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(username: string, passwordSecret: string) {
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

    // Ao cadastrar o usuário, vamos criar um perfil de membro inicial padrão para ele
    // e associá-lo a nenhuma casa (o usuário depois cria ou entra em uma casa)
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

  async getMe(userId: string) {
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

    // Retorna os dados do usuário e a lista de Tenants (casas) de que ele participa
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
