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

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const tenantId = request.headers['x-tenant-id'];

    if (!user || !tenantId) {
      throw new ForbiddenException('Identificação do usuário ou casa ausente.');
    }

    const membro = await this.prisma.membroCasa.findFirst({
      where: { tenantId, userId: user.userId, ativo: true },
    });

    if (!membro) {
      throw new ForbiddenException('Você não é um membro ativo desta moradia.');
    }

    // ADMIN é super-papel — sempre passa
    if (membro.role === Role.ADMIN) return true;

    // Verifica @Roles (lógica existente preservada)
    if (requiredRoles?.length && requiredRoles.includes(membro.role)) return true;

    throw new ForbiddenException('Você não possui permissão para executar esta ação.');
  }
}
