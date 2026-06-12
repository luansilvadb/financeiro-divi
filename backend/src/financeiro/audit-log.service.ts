import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { serializeBigInt } from '../shared/utils/serialization';

@Injectable()
export class AuditLogService {
  constructor(private prisma: PrismaService) {}

  async registrar(
    tenantId: string,
    membroId: string,
    acao: string,
    detalhes: string,
    tx?: Prisma.TransactionClient,
  ) {
    const db = tx || this.prisma;
    const log = await db.auditLog.create({
      data: {
        tenantId,
        membroId,
        acao,
        detalhes,
      },
    });
    return serializeBigInt(log);
  }

  async listar(tenantId: string, executorUserId?: string) {
    if (executorUserId) {
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
        const isBlocked = rolePermissions.ALLOW_VER_AUDIT_LOGS === false || 
                          (executor.role === 'MORADOR' && permissions.ALLOW_MORADOR_VER_AUDIT_LOGS === false);
        if (isBlocked) {
          throw new ForbiddenException('O administrador da moradia desativou esta permissão para o seu papel.');
        }
      }
    }

    const logs = await this.prisma.auditLog.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
    return serializeBigInt(logs);
  }
}
