import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FinanceiroGateway } from './financeiro.gateway';
import { AuditLogService } from './audit-log.service';
import { serializeBigInt } from '../shared/utils/serialization';
import { Prisma, SplitMode, ValidationEventType } from '@prisma/client';
import { GastoDto } from './dto/gasto.dto';
import { ContaFixaDto } from './dto/conta-fixa.dto';
import { ProductValidationService } from './product-validation.service';

@Injectable()
export class LancamentoService {
  constructor(
    private prisma: PrismaService,
    private gateway: FinanceiroGateway,
    private auditLogService: AuditLogService,
    private productValidationService: ProductValidationService,
  ) {}

  private async obterMembroIdPorUserId(tx: Prisma.TransactionClient, tenantId: string, userId?: string): Promise<string> {
    if (!userId) return 'sistema';
    const membro = await tx.membroCasa.findFirst({
      where: { tenantId, userId },
    });
    return membro ? membro.id : 'sistema';
  }

  async listarGastos(tenantId: string) {
    const gastos = await this.prisma.gasto.findMany({
      where: { tenantId },
      include: {
        divisoes: true,
      },
    });
    return serializeBigInt(gastos);
  }

  async salvarGasto(tenantId: string, gastoData: GastoDto, executorUserId?: string) {
    const result = await this.prisma.$transaction(async (tx) => {
      const executorMembroId = await this.obterMembroIdPorUserId(tx, tenantId, executorUserId);

      // Verificar se é criação ou edição
      const gastoExistente = await tx.gasto.findUnique({
        where: { id_tenantId: { id: gastoData.id, tenantId } }
      });
      const isNovo = !gastoExistente;

      let resultGasto;
      if (gastoData.isSettlement) {
        resultGasto = await this.registrarAcertoTx(tx, tenantId, gastoData);
      } else if (gastoData.isLoan) {
        resultGasto = await this.salvarEmprestimoTx(tx, tenantId, gastoData);
      } else {
        resultGasto = await this.salvarDespesaComumTx(tx, tenantId, gastoData);
      }

      if (isNovo && gastoData.isSettlement) {
        await this.productValidationService.registrarMarco(
          tenantId,
          ValidationEventType.FIRST_SETTLEMENT_RECORDED,
          'first',
          { metadata: { paymentMethod: gastoData.method } },
          tx,
        );
      }

      if (isNovo && !gastoData.isSettlement && !gastoData.isLoan) {
        await this.registrarPrimeiraDespesaTx(tx, tenantId, gastoData);
      }

      // Registrar no Log de Auditoria
      const acao = isNovo ? 'CRIAR_GASTO' : 'EDITAR_GASTO';

      const comprador = await tx.membroCasa.findUnique({
        where: { id_tenantId: { id: gastoData.compradorId, tenantId } }
      });
      const compradorNome = comprador ? comprador.nome : 'Membro';
      const valorReais = (Number(gastoData.valorTotalCentavos || 0) / 100).toFixed(2).replace('.', ',');

      let detalhesLog = '';
      if (gastoData.isPrivate) {
        detalhesLog = `Gasto Pessoal de R$ ${valorReais} lançado por ${compradorNome}.`;
      } else {
        detalhesLog = `Gasto "${gastoData.descricao}" de R$ ${valorReais} lançado por ${compradorNome}.`;
      }

      await this.auditLogService.registrar(tenantId, executorMembroId, acao, detalhesLog, tx);

      return resultGasto;
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
    await this.validarAcertoTx(tx, tenantId, g);
    return this.upsertGastoCompletoTx(tx, tenantId, { ...g, isLoan: false, isSettlement: true });
  }

  private async validarAcertoTx(tx: Prisma.TransactionClient, tenantId: string, g: GastoDto) {
    const details = g.settlementDetails;
    const divisao = g.divisoes?.[0];
    const valorTotal = Number(g.valorTotalCentavos || 0);

    if (
      valorTotal <= 0 ||
      !details ||
      details.fromMemberId === details.toMemberId ||
      g.compradorId !== details.fromMemberId ||
      !['pix', 'cash'].includes(details.method) ||
      g.method !== details.method ||
      g.isPrivate === true ||
      g.installments !== 1 ||
      g.totalInstallments !== 1 ||
      Boolean(g.cardOwnerId) ||
      Boolean(g.faturaId) ||
      (g.splitMode !== undefined && g.splitMode !== SplitMode.CUSTOM) ||
      g.divisoes?.length !== 1 ||
      divisao?.membroId !== details.toMemberId ||
      Number(divisao?.valorCentavos) !== valorTotal
    ) {
      throw new BadRequestException('Dados do acerto são inválidos.');
    }

    const memberCount = await tx.membroCasa.count({
      where: {
        tenantId,
        id: { in: [details.fromMemberId, details.toMemberId] },
      },
    });
    if (memberCount !== 2) {
      throw new BadRequestException('Os membros do acerto não pertencem a esta casa.');
    }
  }

  private async upsertGastoCompletoTx(tx: Prisma.TransactionClient, tenantId: string, g: GastoDto) {
    const totalDivisoes = (g.divisoes || []).reduce(
      (total, divisao) => total + Number(divisao.valorCentavos || 0),
      0,
    );
    if (!g.divisoes?.length || totalDivisoes !== Number(g.valorTotalCentavos || 0)) {
      throw new BadRequestException('A soma das divisões deve ser igual ao valor total do gasto.');
    }

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
      splitMode: g.splitMode || SplitMode.CUSTOM,
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

  async salvarMuitosGastos(tenantId: string, gastosList: GastoDto[], executorUserId?: string) {
    const result = await this.prisma.$transaction(async (tx) => {
      const saved = [];
      const executorMembroId = await this.obterMembroIdPorUserId(tx, tenantId, executorUserId);

      for (const g of gastosList) {
        // Verificar se é criação ou edição
        const gastoExistente = await tx.gasto.findUnique({
          where: { id_tenantId: { id: g.id, tenantId } }
        });
        const isNovo = !gastoExistente;

        let resultGasto;
        if (g.isSettlement) {
          resultGasto = await this.registrarAcertoTx(tx, tenantId, g);
        } else if (g.isLoan) {
          resultGasto = await this.salvarEmprestimoTx(tx, tenantId, g);
        } else {
          resultGasto = await this.salvarDespesaComumTx(tx, tenantId, g);
        }

        if (isNovo && g.isSettlement) {
          await this.productValidationService.registrarMarco(
            tenantId,
            ValidationEventType.FIRST_SETTLEMENT_RECORDED,
            'first',
            { metadata: { paymentMethod: g.method } },
            tx,
          );
        }

        if (isNovo && !g.isSettlement && !g.isLoan) {
          await this.registrarPrimeiraDespesaTx(tx, tenantId, g);
        }

        const acao = isNovo ? 'CRIAR_GASTO' : 'EDITAR_GASTO';
        const comprador = await tx.membroCasa.findUnique({
          where: { id_tenantId: { id: g.compradorId, tenantId } }
        });
        const compradorNome = comprador ? comprador.nome : 'Membro';
        const valorReais = (Number(g.valorTotalCentavos || 0) / 100).toFixed(2).replace('.', ',');

        let detalhesLog = '';
        if (g.isPrivate) {
          detalhesLog = `Gasto Pessoal de R$ ${valorReais} lançado por ${compradorNome}.`;
        } else {
          detalhesLog = `Gasto "${g.descricao}" de R$ ${valorReais} lançado por ${compradorNome}.`;
        }

        await this.auditLogService.registrar(tenantId, executorMembroId, acao, detalhesLog, tx);
        saved.push(resultGasto);
      }
      return saved;
    });
    this.gateway.notificarAlteracao(tenantId, 'gastos_alterados');
    return serializeBigInt(result);
  }

  private async registrarPrimeiraDespesaTx(
    tx: Prisma.TransactionClient,
    tenantId: string,
    gasto: GastoDto,
  ) {
    await this.productValidationService.registrarMarco(
      tenantId,
      ValidationEventType.FIRST_EXPENSE_CREATED,
      'first',
      {
        metadata: {
          splitMode: gasto.splitMode || SplitMode.CUSTOM,
          paymentMethod: gasto.method,
          participantCount: gasto.divisoes?.length || 0,
          installmentCount: gasto.totalInstallments || 1,
          isRecurringBill: Boolean(gasto.recurringBillId),
        },
      },
      tx,
    );
  }

  async excluirGasto(tenantId: string, id: string, executorUserId?: string) {
    await this.prisma.$transaction(async (tx) => {
      const executorMembroId = await this.obterMembroIdPorUserId(tx, tenantId, executorUserId);
      const gasto = await tx.gasto.findUnique({
        where: { id_tenantId: { id, tenantId } }
      });

      if (gasto) {
        const valorReais = (Number(gasto.valorTotalCentavos || 0) / 100).toFixed(2).replace('.', ',');
        const descricaoStr = gasto.isPrivate ? 'Gasto Pessoal' : `Gasto "${gasto.descricao}"`;
        const detalhesLog = `${descricaoStr} de R$ ${valorReais} excluído do sistema.`;

        await this.auditLogService.registrar(tenantId, executorMembroId, 'EXCLUIR_GASTO', detalhesLog, tx);

        await tx.gasto.delete({
          where: { id_tenantId: { id, tenantId } }
        });
      }
    });
    this.gateway.notificarAlteracao(tenantId, 'gastos_alterados');
    return { success: true };
  }

  async excluirMuitosGastos(tenantId: string, ids: string[], executorUserId?: string) {
    await this.prisma.$transaction(async (tx) => {
      const executorMembroId = await this.obterMembroIdPorUserId(tx, tenantId, executorUserId);

      for (const id of ids) {
        const gasto = await tx.gasto.findUnique({
          where: { id_tenantId: { id, tenantId } }
        });

        if (gasto) {
          const valorReais = (Number(gasto.valorTotalCentavos || 0) / 100).toFixed(2).replace('.', ',');
          const descricaoStr = gasto.isPrivate ? 'Gasto Pessoal' : `Gasto "${gasto.descricao}"`;
          const detalhesLog = `${descricaoStr} de R$ ${valorReais} excluído do sistema (lote).`;

          await this.auditLogService.registrar(tenantId, executorMembroId, 'EXCLUIR_GASTO', detalhesLog, tx);

          await tx.gasto.delete({
            where: { id_tenantId: { id, tenantId } }
          });
        }
      }
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
