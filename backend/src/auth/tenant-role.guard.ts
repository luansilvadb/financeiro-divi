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

    // If a tenant ID is provided, we MUST verify membership even if no roles are required.
    // This prevents BOLA (Broken Object Level Authorization) where an authenticated user
    // could access any tenant's data by guessing the tenantId.
    if (tenantId) {
      if (!user) {
        throw new ForbiddenException('Identificação do usuário ausente.');
      }

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

      // If roles ARE required, check them.
      if (requiredRoles && requiredRoles.length > 0) {
        const hasRole = requiredRoles.includes(membro.role);
        if (!hasRole) {
          throw new ForbiddenException('Você não possui permissão para executar esta ação.');
        }
      }

      return true;
    }

    // If no tenantId and no roles required, allow (e.g. creating a new tenant)
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // Roles required but no tenantId provided
    throw new ForbiddenException('Identificação da casa ausente para verificação de permissões.');
  }
}
