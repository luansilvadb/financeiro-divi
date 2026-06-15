import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FinanceiroGateway } from './financeiro.gateway';
import { AuditLogService } from './audit-log.service';
import { serializeBigInt } from '../shared/utils/serialization';
import { formatarCentavosParaBRL } from '../shared/utils/formatarMoeda';
import { Prisma, SplitMode, ValidationEventType } from '@prisma/client';
import { GastoDto } from './dto/gasto.dto';
import { ContaFixaDto } from './dto/conta-fixa.dto';
import { ProductValidationService } from './product-validation.service';
import { GastoMapper } from './gasto.mapper';
import { PermissaoService } from './permissao.service';

@Injectable()
export class LancamentoService {
  constructor(
    private prisma: PrismaService,
    private gateway: FinanceiroGateway,
    private auditLogService: AuditLogService,
    private productValidationService: ProductValidationService,
    private permissaoService: PermissaoService,
  ) {}

  private async obterMembroIdPorUserId(tx: Prisma.TransactionClient, tenantId: string, userId?: string): Promise<string> {
    if (!userId) return 'sistema';
    const membro = await tx.membroCasa.findFirst({
      where: { tenantId, userId },
    });
    return membro ? membro.id : 'sistema';
  }

  async listarGastosVisiveis(tenantId: string, userId: string) {
    const membroId = await this.obterMembroIdPorUserId(this.prisma, tenantId, userId);
    
    const gastos = await this.prisma.gasto.findMany({
      where: { tenantId },
      include: {
        divisoes: true,
      },
    });

    if (membroId === 'sistema') {
      return serializeBigInt(gastos);
    }

    const gastosFiltrados = gastos.filter((g: any) => this.podeVerGasto(g, membroId));

    return serializeBigInt(gastosFiltrados);
  }

  private podeVerGasto(g: any, membroId: string): boolean {
    if (!g.isPrivate) return true;
    
    const envolvidoNaDivisao = Array.isArray(g.divisoes) && g.divisoes.some((d: any) => d.membroId === membroId);
    return (
      g.compradorId === membroId ||
      g.cardOwnerId === membroId ||
      g.borrowerId === membroId ||
      envolvidoNaDivisao
    );
  }

  async salvarGasto(tenantId: string, gastoData: GastoDto, executorUserId?: string) {
    await this.permissaoService.validarFeatureFlag(tenantId, executorUserId, 'ALLOW_LANCAR_GASTO');
    const result = await this.prisma.$transaction(async (tx) => {
      const executorMembroId = await this.obterMembroIdPorUserId(tx, tenantId, executorUserId);
      return this.processarGastoIndividual(tx, tenantId, gastoData, executorMembroId);
    });
    this.gateway.notificarAlteracao(tenantId, 'gastos_alterados');
    return serializeBigInt(result);
  }

  async salvarMuitosGastos(tenantId: string, gastosList: GastoDto[], executorUserId?: string) {
    await this.permissaoService.validarFeatureFlag(tenantId, executorUserId, 'ALLOW_LANCAR_GASTO');
    const result = await this.prisma.$transaction(async (tx) => {
      const saved = [];
      const executorMembroId = await this.obterMembroIdPorUserId(tx, tenantId, executorUserId);
      for (const g of gastosList) {
        const resultGasto = await this.processarGastoIndividual(tx, tenantId, g, executorMembroId);
        saved.push(resultGasto);
      }
      return saved;
    });
    this.gateway.notificarAlteracao(tenantId, 'gastos_alterados');
    return serializeBigInt(result);
  }

  private async processarGastoIndividual(tx: Prisma.TransactionClient, tenantId: string, g: GastoDto, executorMembroId: string) {
    const gastoExistente = await tx.gasto.findUnique({
      where: { id_tenantId: { id: g.id, tenantId } }
    });
    const isNovo = !gastoExistente;

    const resultGasto = await this.rotearSalvamentoGastoTx(tx, tenantId, g);

    if (isNovo) {
      await this.registrarMarcosValidacaoTx(tx, tenantId, g);
    }

    await this.registrarAuditoriaGastoTx(tx, tenantId, g, executorMembroId, isNovo);

    return resultGasto;
  }

  private async rotearSalvamentoGastoTx(tx: Prisma.TransactionClient, tenantId: string, g: GastoDto) {
    if (g.isSettlement) return this.registrarAcertoTx(tx, tenantId, g);
    if (g.isLoan) return this.salvarEmprestimoTx(tx, tenantId, g);
    return this.salvarDespesaComumTx(tx, tenantId, g);
  }

  private async registrarMarcosValidacaoTx(tx: Prisma.TransactionClient, tenantId: string, g: GastoDto) {
    if (g.isSettlement) {
      await this.productValidationService.registrarMarco(
        tenantId,
        ValidationEventType.FIRST_SETTLEMENT_RECORDED,
        'first',
        { metadata: { paymentMethod: g.method } },
        tx,
      );
    } else if (!g.isLoan) {
      await this.registrarPrimeiraDespesaTx(tx, tenantId, g);
    }
  }

  private async registrarAuditoriaGastoTx(tx: Prisma.TransactionClient, tenantId: string, g: GastoDto, executorMembroId: string, isNovo: boolean) {
    const acao = isNovo ? 'CRIAR_GASTO' : 'EDITAR_GASTO';
    const comprador = await tx.membroCasa.findUnique({
      where: { id_tenantId: { id: g.compradorId, tenantId } }
    });
    const compradorNome = comprador ? comprador.nome : 'Membro';
    const valorFormatado = formatarCentavosParaBRL(g.valorTotalCentavos || 0);

    const detalhesLog = g.isPrivate
      ? `Gasto Pessoal de ${valorFormatado} lançado por ${compradorNome}.`
      : `Gasto "${g.descricao}" de ${valorFormatado} lançado por ${compradorNome}.`;

    await this.auditLogService.registrar(tenantId, executorMembroId, acao, detalhesLog, tx);
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
    if (!details) throw new BadRequestException('Dados do acerto são inválidos.');

    this.checarFormatoAcerto(g, details);
    await this.checarPrivacidadeEMembrosAcerto(tx, tenantId, g, details);
  }

  private checarFormatoAcerto(g: GastoDto, details: any) {
    const divisao = g.divisoes?.[0];
    const valorTotal = Number(g.valorTotalCentavos || 0);

    const formatChecks = {
      valorTotal: valorTotal <= 0,
      sameMember: details.fromMemberId === details.toMemberId,
      compradorId: g.compradorId !== details.fromMemberId,
      methodPixCash: !['pix', 'cash'].includes(details.method),
      methodMismatch: g.method !== details.method,
      installments: g.installments !== 1,
      totalInstallments: g.totalInstallments !== 1,
      cardOwnerId: Boolean(g.cardOwnerId),
      faturaId: Boolean(g.faturaId),
      splitMode: g.splitMode !== undefined && g.splitMode !== SplitMode.CUSTOM,
      divisoesLength: g.divisoes?.length !== 1,
      divisaoMembroId: divisao?.membroId !== details.toMemberId,
      divisaoValor: Number(divisao?.valorCentavos) !== valorTotal
    };

    if (Object.values(formatChecks).some(Boolean)) {
      throw new BadRequestException('Dados do acerto são inválidos.');
    }
  }

  private async checarPrivacidadeEMembrosAcerto(tx: Prisma.TransactionClient, tenantId: string, g: GastoDto, details: any) {
    const involvesExternal = details.fromMemberId.startsWith('externo:') || details.toMemberId.startsWith('externo:');
    if (involvesExternal && !g.isPrivate) {
      throw new BadRequestException('Acertos com externos devem ser obrigatoriamente privados.');
    }

    const internalMembers = [details.fromMemberId, details.toMemberId].filter(id => !id.startsWith('externo:'));
    const memberCount = await tx.membroCasa.count({
      where: { tenantId, id: { in: internalMembers } },
    });
    if (memberCount !== internalMembers.length) {
      throw new BadRequestException('Os membros do acerto não pertencem a esta casa.');
    }
  }

  private async upsertGastoCompletoTx(tx: Prisma.TransactionClient, tenantId: string, g: GastoDto) {
    this.validarDivisoesGasto(g);
    await tx.divisaoGasto.deleteMany({ where: { gastoId: g.id, tenantId } });
    await this.persistirGastoTx(tx, tenantId, g);
    await this.persistirDivisoesTx(tx, tenantId, g);

    return tx.gasto.findUnique({
      where: { id_tenantId: { id: g.id, tenantId } },
      include: { divisoes: true },
    });
  }

  private validarDivisoesGasto(g: GastoDto) {
    const totalDivisoes = (g.divisoes || []).reduce((total, d) => total + Number(d.valorCentavos || 0), 0);
    if (!g.divisoes?.length || totalDivisoes !== Number(g.valorTotalCentavos || 0)) {
      throw new BadRequestException('A soma das divisões deve ser igual ao valor total do gasto.');
    }
  }

  private async persistirGastoTx(tx: Prisma.TransactionClient, tenantId: string, g: GastoDto) {
    const data = GastoMapper.paraUpsert(g);
    await tx.gasto.upsert({
      where: { id_tenantId: { id: g.id, tenantId } },
      create: { id: g.id, tenantId, ...data },
      update: data,
    });
  }

  private async persistirDivisoesTx(tx: Prisma.TransactionClient, tenantId: string, g: GastoDto) {
    if (g.divisoes?.length) {
      const data = GastoMapper.mapearDivisoes(tenantId, g.id, g.divisoes);
      await tx.divisaoGasto.createMany({ data });
    }
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

  private montarLogExclusaoGasto(gasto: any, emLote: boolean = false): string {
    const valorFormatado = formatarCentavosParaBRL(gasto.valorTotalCentavos);
    const descricaoStr = gasto.isPrivate ? 'Gasto Pessoal' : `Gasto "${gasto.descricao}"`;
    return `${descricaoStr} de ${valorFormatado} excluído do sistema${emLote ? ' (lote)' : ''}.`;
  }

  async excluirGasto(tenantId: string, id: string, executorUserId?: string) {
    await this.permissaoService.validarFeatureFlag(tenantId, executorUserId, 'ALLOW_LANCAR_GASTO');
    await this.prisma.$transaction(async (tx) => {
      const executorMembroId = await this.obterMembroIdPorUserId(tx, tenantId, executorUserId);
      const gasto = await tx.gasto.findUnique({
        where: { id_tenantId: { id, tenantId } }
      });

      if (gasto) {
        const detalhesLog = this.montarLogExclusaoGasto(gasto, false);
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
    await this.permissaoService.validarFeatureFlag(tenantId, executorUserId, 'ALLOW_LANCAR_GASTO');
    await this.prisma.$transaction(async (tx) => {
      const executorMembroId = await this.obterMembroIdPorUserId(tx, tenantId, executorUserId);

      for (const id of ids) {
        const gasto = await tx.gasto.findUnique({
          where: { id_tenantId: { id, tenantId } }
        });

        if (gasto) {
          const detalhesLog = this.montarLogExclusaoGasto(gasto, true);
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

  async salvarContaFixa(tenantId: string, contaData: ContaFixaDto, executorUserId?: string) {
    await this.permissaoService.validarFeatureFlag(tenantId, executorUserId, 'ALLOW_GERENCIAR_CONTAS_FIXAS');
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

  async excluirContaFixa(tenantId: string, id: string, executorUserId?: string) {
    await this.permissaoService.validarFeatureFlag(tenantId, executorUserId, 'ALLOW_GERENCIAR_CONTAS_FIXAS');
    await this.prisma.contaFixa.delete({
      where: {
        id_tenantId: { id, tenantId },
      },
    });
    this.gateway.notificarAlteracao(tenantId, 'contas_fixas_alteradas');
    return { success: true };
  }
}
