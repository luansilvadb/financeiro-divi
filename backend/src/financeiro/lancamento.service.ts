import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FinanceiroGateway } from './financeiro.gateway';
import { serializeBigInt } from '../shared/utils/serialization';
import { Prisma } from '@prisma/client';
import { GastoDto } from './dto/gasto.dto';
import { ContaFixaDto } from './dto/conta-fixa.dto';

@Injectable()
export class LancamentoService {
  constructor(
    private prisma: PrismaService,
    private gateway: FinanceiroGateway
  ) {}

  async listarGastos(tenantId: string) {
    const gastos = await this.prisma.gasto.findMany({
      where: { tenantId },
      include: {
        divisoes: true,
      },
    });
    return serializeBigInt(gastos);
  }

  async salvarGasto(tenantId: string, gastoData: GastoDto) {
    const result = await this.prisma.$transaction(async (tx) => {
      return this.upsertGastoTx(tx, tenantId, gastoData);
    });
    this.gateway.notificarAlteracao(tenantId, 'gastos_alterados');
    return serializeBigInt(result);
  }

  async salvarMuitosGastos(tenantId: string, gastosList: GastoDto[]) {
    const result = await this.prisma.$transaction(async (tx) => {
      const saved = [];
      for (const g of gastosList) {
        saved.push(await this.upsertGastoTx(tx, tenantId, g));
      }
      return saved;
    });
    this.gateway.notificarAlteracao(tenantId, 'gastos_alterados');
    return serializeBigInt(result);
  }

  private async upsertGastoTx(tx: Prisma.TransactionClient, tenantId: string, g: GastoDto) {
    await tx.divisaoGasto.deleteMany({ where: { gastoId: g.id, tenantId } });

    await this.persistirGastoBase(tx, tenantId, g);

    if (g.divisoes?.length) {
      await this.persistirDivisoesGasto(tx, tenantId, g.id, g.divisoes);
    }

    return tx.gasto.findUnique({
      where: { id_tenantId: { id: g.id, tenantId } },
      include: { divisoes: true },
    });
  }

  private async persistirGastoBase(tx: Prisma.TransactionClient, tenantId: string, g: GastoDto) {
    const data = {
      faturaId: g.faturaId,
      descricao: g.descricao,
      valorTotalCentavos: BigInt(g.valorTotalCentavos || 0),
      compradorId: g.compradorId,
      installments: g.installments,
      totalInstallments: g.totalInstallments,
      isLoan: g.isLoan,
      borrowerId: g.borrowerId,
      recurringBillId: g.recurringBillId,
      isSettlement: g.isSettlement,
      settlementDetails: g.settlementDetails as Prisma.InputJsonValue,
      method: g.method,
      cardOwnerId: g.cardOwnerId,
      grupoParcelasId: g.grupoParcelasId,
    };

    return tx.gasto.upsert({
      where: { id_tenantId: { id: g.id, tenantId } },
      create: { id: g.id, tenantId, ...data },
      update: data,
    });
  }

  private async persistirDivisoesGasto(
    tx: Prisma.TransactionClient,
    tenantId: string,
    gastoId: string,
    divisoes: { membroId: string; valorCentavos: number }[]
  ) {
    return tx.divisaoGasto.createMany({
      data: divisoes.map(d => ({
        tenantId,
        gastoId,
        membroId: d.membroId,
        valorCentavos: BigInt(d.valorCentavos || 0),
      })),
    });
  }

  async excluirGasto(tenantId: string, id: string) {
    await this.prisma.gasto.delete({
      where: {
        id_tenantId: { id, tenantId },
      },
    });
    this.gateway.notificarAlteracao(tenantId, 'gastos_alterados');
    return { success: true };
  }

  async excluirMuitosGastos(tenantId: string, ids: string[]) {
    await this.prisma.gasto.deleteMany({
      where: {
        tenantId,
        id: { in: ids },
      },
    });
    this.gateway.notificarAlteracao(tenantId, 'gastos_alterados');
    return { success: true };
  }

  async listarContasFixas(tenantId: string) {
    const contas = await this.prisma.contaFixa.findMany({
      where: { tenantId },
    });
    return serializeBigInt(contas);
  }

  async salvarContaFixa(tenantId: string, contaData: ContaFixaDto) {
    const { id, name, icon, fixedValueCentavos, defaultSplit } = contaData;
    const upserted = await this.prisma.contaFixa.upsert({
      where: {
        id_tenantId: { id, tenantId },
      },
      create: {
        id,
        tenantId,
        name,
        icon,
        fixedValueCentavos: fixedValueCentavos ? BigInt(fixedValueCentavos) : null,
        defaultSplit,
      },
      update: {
        name,
        icon,
        fixedValueCentavos: fixedValueCentavos ? BigInt(fixedValueCentavos) : null,
        defaultSplit,
      },
    });
    this.gateway.notificarAlteracao(tenantId, 'contas_fixas_alteradas');
    return serializeBigInt(upserted);
  }

  async excluirContaFixa(tenantId: string, id: string) {
    await this.prisma.contaFixa.delete({
      where: {
        id_tenantId: { id, tenantId },
      },
    });
    this.gateway.notificarAlteracao(tenantId, 'contas_fixas_alteradas');
    return { success: true };
  }
}
