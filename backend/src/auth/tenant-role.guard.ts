import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service';
import { ROLES_KEY } from './roles.decorator';
import { IS_PUBLIC_KEY } from './public.decorator';
import { Role } from '@prisma/client';

@Injectable()
export class TenantRoleGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Respeita o decorator @Public()
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const tenantId = request.headers['x-tenant-id'];

    // Se não há tenantId no header, mas a rota exige roles, bloqueia
    if (requiredRoles && requiredRoles.length > 0 && !tenantId) {
      throw new ForbiddenException('Identificação da casa ausente.');
    }

    // Se há tenantId no header, SEMPRE valida se o usuário pertence a ele (isolamento de tenant)
    if (tenantId) {
      if (!user) {
        throw new ForbiddenException('Usuário não autenticado.');
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

      // Se houver roles exigidas, verifica se o membro as possui
      if (requiredRoles && requiredRoles.length > 0) {
        const hasRole = requiredRoles.includes(membro.role);
        if (!hasRole) {
          throw new ForbiddenException('Você não possui permissão para executar esta ação.');
        }
      }
    }

    return true;
  }
}
