import { Prisma, SplitMode } from '@prisma/client';
import { GastoDto } from './dto/gasto.dto';
import { DivisaoGastoDto } from './dto/divisao-gasto.dto';

export class GastoMapper {
  static paraUpsert(g: GastoDto) {
    return {
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
      splitMode: g.splitMode || SplitMode.CUSTOM,
    };
  }

  static mapearDivisoes(tenantId: string, gastoId: string, divisoes: DivisaoGastoDto[]) {
    if (!divisoes || !divisoes.length) return [];
    
    return divisoes.map(d => ({
      tenantId,
      gastoId,
      membroId: d.membroId,
      valorCentavos: BigInt(d.valorCentavos || 0),
    }));
  }
}
