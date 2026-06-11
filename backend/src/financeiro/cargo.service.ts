import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FinanceiroGateway } from './financeiro.gateway';
import { serializeBigInt } from '../shared/utils/serialization';
import { randomUUID } from 'crypto';
import { CargoCasaDto } from './dto/cargo-casa.dto';

@Injectable()
export class CargoService {
  constructor(
    private prisma: PrismaService,
    private gateway: FinanceiroGateway
  ) {}

  async listarCargos(tenantId: string) {
    const cargos = await this.prisma.cargoCasa.findMany({
      where: { tenantId },
      include: {
        _count: {
          select: { membros: true },
        },
      },
    });
    return serializeBigInt(cargos);
  }

  async salvarCargo(tenantId: string, cargoData: CargoCasaDto) {
    const { id, nome, cor, permissoes } = cargoData;
    const cargoId = id || `cargo-${randomUUID()}`;
    const upserted = await this.prisma.cargoCasa.upsert({
      where: {
        id_tenantId: { id: cargoId, tenantId },
      },
      create: {
        id: cargoId,
        tenantId,
        nome,
        cor,
        permissoes,
      },
      update: {
        nome,
        cor,
        permissoes,
      },
    });
    this.gateway.notificarAlteracao(tenantId, 'cargos_alterados');
    return serializeBigInt(upserted);
  }

  async excluirCargo(tenantId: string, id: string) {
    await this.prisma.membroCasa.updateMany({
      where: {
        tenantId,
        cargoId: id,
      },
      data: {
        cargoId: null,
      },
    });

    await this.prisma.cargoCasa.delete({
      where: {
        id_tenantId: { id, tenantId },
      },
    });
    this.gateway.notificarAlteracao(tenantId, 'cargos_alterados');
    return { success: true };
  }
}
