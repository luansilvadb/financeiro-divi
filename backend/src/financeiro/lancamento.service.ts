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
      if (gastoData.isSettlement) {
        return this.registrarAcertoTx(tx, tenantId, gastoData);
      }
      if (gastoData.isLoan) {
        return this.salvarEmprestimoTx(tx, tenantId, gastoData);
      }
      return this.salvarDespesaComumTx(tx, tenantId, gastoData);
    });
    this.gateway.notificarAlteracao(tenantId, 'gastos_alterados');
    return serializeBigInt(result);
  }

  private async salvarDespesaComumTx(tx: Prisma.TransactionClient, tenantId: string, g: GastoDto) {
    return this.upsertGastoCompletoTx(tx, tenantId, { ...g, isLoan: false, isSettlement: false });
  }

  private async salvarEmprestimoTx(tx: Prisma.TransactionClient, tenantId: string, g: GastoDto) {
    return this.upsertGastoCompletoTx(tx, tenantId, { ...g, isLoan: true, isSettlement: false });
  }

  private async registrarAcertoTx(tx: Prisma.TransactionClient, tenantId: string, g: GastoDto) {
    return this.upsertGastoCompletoTx(tx, tenantId, { ...g, isLoan: false, isSettlement: true });
  }

  private async upsertGastoCompletoTx(tx: Prisma.TransactionClient, tenantId: string, g: GastoDto) {
    await tx.divisaoGasto.deleteMany({ where: { gastoId: g.id, tenantId } });

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
      isPrivate: g.isPrivate !== undefined ? g.isPrivate : false,
    };

    await tx.gasto.upsert({
      where: { id_tenantId: { id: g.id, tenantId } },
      create: { id: g.id, tenantId, ...data },
      update: data,
    });

    if (g.divisoes?.length) {
      await tx.divisaoGasto.createMany({
        data: g.divisoes.map(d => ({
          tenantId,
          gastoId: g.id,
          membroId: d.membroId,
          valorCentavos: BigInt(d.valorCentavos || 0),
        })),
      });
    }

    return tx.gasto.findUnique({
      where: { id_tenantId: { id: g.id, tenantId } },
      include: { divisoes: true },
    });
  }

  async salvarMuitosGastos(tenantId: string, gastosList: GastoDto[]) {
    const result = await this.prisma.$transaction(async (tx) => {
      const saved = [];
      for (const g of gastosList) {
        if (g.isSettlement) {
          saved.push(await this.registrarAcertoTx(tx, tenantId, g));
        } else if (g.isLoan) {
          saved.push(await this.salvarEmprestimoTx(tx, tenantId, g));
        } else {
          saved.push(await this.salvarDespesaComumTx(tx, tenantId, g));
        }
      }
      return saved;
    });
    this.gateway.notificarAlteracao(tenantId, 'gastos_alterados');
    return serializeBigInt(result);
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
