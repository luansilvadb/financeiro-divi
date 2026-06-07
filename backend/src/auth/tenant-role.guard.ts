import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service';
import { ROLES_KEY } from './roles.decorator';
import { Role } from '@prisma/client';
import { IS_PUBLIC_KEY } from './public.decorator';

@Injectable()
export class TenantRoleGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
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
    const tenantId = request.headers['x-tenant-id'] as string;

    // Se não houver tenantId e não houver roles requeridas, permite passar
    // (Ex: rotas globais que não dependem de contexto de moradia)
    if (!tenantId && (!requiredRoles || requiredRoles.length === 0)) {
      return true;
    }

    // Se houver tenantId ou roles requeridas, precisamos do usuário autenticado
    if (!user) {
      throw new ForbiddenException('Usuário não autenticado.');
    }

    // Se a rota exige uma moradia específica (header presente)
    if (tenantId) {
      // Busca o membro associado àquele usuário e moradia para garantir isolamento (BOLA protection)
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
    } else if (requiredRoles && requiredRoles.length > 0) {
      // Se exige roles mas não passou tenantId no header (erro de integração ou rota mal configurada)
      throw new ForbiddenException('Identificação da casa (Tenant ID) é obrigatória para esta ação.');
    }

    return true;
  }
}
