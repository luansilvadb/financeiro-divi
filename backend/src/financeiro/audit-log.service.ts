import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { serializeBigInt } from '../shared/utils/serialization';
import { PermissaoService } from './permissao.service';

@Injectable()
export class AuditLogService {
  constructor(
    private prisma: PrismaService,
    private permissaoService: PermissaoService
  ) {}

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
      await this.permissaoService.validarFeatureFlag(tenantId, executorUserId, 'ALLOW_VER_AUDIT_LOGS');
    }

    const logs = await this.prisma.auditLog.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
    return serializeBigInt(logs);
  }
}
