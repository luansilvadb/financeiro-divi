import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service';
import { ROLES_KEY } from './roles.decorator';
import { Role } from '@prisma/client';

@Injectable()
export class TenantRoleGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const tenantId = request.headers['x-tenant-id'];

    // Se nenhuma role for especificada E não houver tenantId, permite o acesso padrão
    // (ex: rotas de criação de moradia onde ainda não há tenantId)
    if ((!requiredRoles || requiredRoles.length === 0) && !tenantId) {
      return true;
    }

    if (!user || !tenantId) {
      throw new ForbiddenException('Identificação do usuário ou casa ausente.');
    }

    // Busca o membro associado àquele usuário e moradia
    const membro = await this.prisma.membroCasa.findFirst({
      where: {
        tenantId,
        userId: user.userId,
        ativo: true,
      },
    });

    if (!membro) {
      throw new ForbiddenException('Você não é um membro ativo desta moradia.');
    }

    // Se houver roles exigidas, verifica se a role do membro está na lista
    if (requiredRoles && requiredRoles.length > 0) {
      const hasRole = requiredRoles.includes(membro.role);
      if (!hasRole) {
        throw new ForbiddenException('Você não possui permissão para executar esta ação.');
      }
    }

    return true;
  }
}
