import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { moradorLegacyFlagMap } from '../shared/constants/permissions.constants';

@Injectable()
export class PermissaoService {
  constructor(private prisma: PrismaService) {}

  async validarFeatureFlag(
    tenantId: string, 
    executorUserId: string | undefined, 
    flagName: string,
    customErrorMessage?: string
  ) {
    if (!executorUserId) return;
    
    const executor = await this.prisma.membroCasa.findFirst({
      where: { tenantId, userId: executorUserId }
    });

    if (executor && executor.role !== 'ADMIN') {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { permissions: true }
      });
      const permissions = (tenant?.permissions as Record<string, any>) || {};
      const rolePermissions = permissions[executor.role] || {};

      const legacyFlagName = moradorLegacyFlagMap[flagName] || flagName;

      const isBlocked = rolePermissions[flagName] === false ||
                        (executor.role === 'MORADOR' && permissions[legacyFlagName] === false);

      if (isBlocked) {
        if (customErrorMessage) {
          throw new ForbiddenException(customErrorMessage);
        }
        throw new ForbiddenException('O administrador da moradia desativou esta permissão para o seu papel.');
      }
    }
  }
}
