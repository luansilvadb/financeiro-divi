import { Injectable } from '@nestjs/common';
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

  async listar(tenantId: string) {
    const logs = await this.prisma.auditLog.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
    return serializeBigInt(logs);
  }
}
