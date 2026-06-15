import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FinanceiroGateway } from './financeiro.gateway';
import { serializeBigInt } from '../shared/utils/serialization';
import { CartaoDto } from './dto/cartao.dto';
import { FaturaDto } from './dto/fatura.dto';
import { ProductValidationService } from './product-validation.service';
import { PermissaoService } from './permissao.service';

@Injectable()
export class CartaoService {
  constructor(
    private prisma: PrismaService,
    private gateway: FinanceiroGateway,
    private productValidationService: ProductValidationService,
    private permissaoService: PermissaoService,
  ) {}

  async listarCartoes(tenantId: string) {
    const cartoes = await this.prisma.cartao.findMany({
      where: { tenantId },
    });
    return serializeBigInt(cartoes);
  }

  async salvarCartao(tenantId: string, cartaoData: CartaoDto, userId: string) {
    await this.permissaoService.validarFeatureFlag(tenantId, userId, 'ALLOW_GERENCIAR_CARTOES');
    await this.assegurarMembroDaMoradia(tenantId, userId);

    const upserted = await this.executarUpsertCartao(tenantId, cartaoData);
    
    this.gateway.notificarAlteracao(tenantId, 'cartoes_alterados');
    return serializeBigInt(upserted);
  }

  async excluirCartao(tenantId: string, id: string, userId?: string) {
    await this.permissaoService.validarFeatureFlag(tenantId, userId, 'ALLOW_GERENCIAR_CARTOES');
    await this.executarExclusaoCartao(tenantId, id);
    
    this.gateway.notificarAlteracao(tenantId, 'cartoes_alterados');
    return { success: true };
  }

  private async assegurarMembroDaMoradia(tenantId: string, userId: string) {
    const membro = await this.prisma.membroCasa.findFirst({
      where: { tenantId, userId },
    });

    if (!membro) {
      throw new BadRequestException('Você não é membro desta moradia.');
    }
  }

  private executarUpsertCartao(tenantId: string, cartaoData: CartaoDto) {
    const { id, nome, diaFechamento, responsavelPadraoId } = cartaoData;
    return this.prisma.cartao.upsert({
      where: { id_tenantId: { id, tenantId } },
      create: { id, tenantId, nome, diaFechamento, responsavelPadraoId },
      update: { nome, diaFechamento, responsavelPadraoId },
    });
  }

  private executarExclusaoCartao(tenantId: string, id: string) {
    return this.prisma.cartao.delete({
      where: { id_tenantId: { id, tenantId } },
    });
  }

  async listarFaturas(tenantId: string) {
    const faturas = await this.prisma.fatura.findMany({
      where: { tenantId },
    });
    return serializeBigInt(faturas);
  }

  async salvarFatura(tenantId: string, faturaData: FaturaDto, executorUserId?: string) {
    await this.validarAlteracaoStatusFatura(tenantId, faturaData, executorUserId);
    
    const upserted = await this.executarUpsertFatura(tenantId, faturaData);

    if (faturaData.status === 'FECHADA') {
      await this.productValidationService.registrarPeriodoFechadoSeConsolidado(tenantId, faturaData.mes, faturaData.ano);
    }
    
    this.gateway.notificarAlteracao(tenantId, 'faturas_alteradas');
    return serializeBigInt(upserted);
  }

  async salvarMuitasFaturas(tenantId: string, faturasList: FaturaDto[], executorUserId?: string) {
    await this.validarAlteracaoStatusFaturasEmMassa(tenantId, faturasList, executorUserId);
    
    const result = await this.executarUpsertFaturasEmMassa(tenantId, faturasList);
    
    await this.registrarPeriodosFechadosEmMassa(tenantId, faturasList);
    
    this.gateway.notificarAlteracao(tenantId, 'faturas_alteradas');
    return serializeBigInt(result);
  }

  private async validarAlteracaoStatusFatura(tenantId: string, faturaData: FaturaDto, executorUserId?: string) {
    const faturaExistente = await this.buscarFaturaExistente(tenantId, faturaData.id);

    if (this.avaliaFechamentoOuReabertura(faturaExistente?.status, faturaData.status)) {
      await this.permissaoService.validarFeatureFlag(
        tenantId, 
        executorUserId, 
        'ALLOW_FECHAR_PERIODO',
        'O administrador da moradia desativou a permissão de fechar ou reabrir o período para o seu papel.'
      );
    }
  }

  private async validarAlteracaoStatusFaturasEmMassa(tenantId: string, faturasList: FaturaDto[], executorUserId?: string) {
    const ids = faturasList.map(f => f.id);
    const faturasExistentes = await this.buscarMuitasFaturasExistentes(tenantId, ids);
    
    const statusExistentes = new Map(faturasExistentes.map(f => [f.id, f.status]));
    const precisaValidar = faturasList.some(f => 
      this.avaliaFechamentoOuReabertura(statusExistentes.get(f.id), f.status)
    );

    if (precisaValidar) {
      await this.permissaoService.validarFeatureFlag(
        tenantId, 
        executorUserId, 
        'ALLOW_FECHAR_PERIODO',
        'O administrador da moradia desativou a permissão de fechar ou reabrir o período para o seu papel.'
      );
    }
  }

  private async executarUpsertFatura(tenantId: string, faturaData: FaturaDto) {
    return this.prisma.fatura.upsert(this.mapearFaturaUpsert(tenantId, faturaData));
  }

  private async executarUpsertFaturasEmMassa(tenantId: string, faturasList: FaturaDto[]) {
    const operations = faturasList.map(f => this.prisma.fatura.upsert(this.mapearFaturaUpsert(tenantId, f)));
    return this.prisma.$transaction(operations);
  }

  private buscarFaturaExistente(tenantId: string, id: string) {
    return this.prisma.fatura.findUnique({
      where: { id_tenantId: { id, tenantId } }
    });
  }

  private buscarMuitasFaturasExistentes(tenantId: string, ids: string[]) {
    return this.prisma.fatura.findMany({
      where: { tenantId, id: { in: ids } }
    });
  }

  private async registrarPeriodosFechadosEmMassa(tenantId: string, faturasList: FaturaDto[]) {
    const periodosFechados = new Map<string, { mes: number; ano: number }>();
    for (const fatura of faturasList) {
      if (fatura.status === 'FECHADA') {
        periodosFechados.set(`${fatura.ano}-${fatura.mes}`, { mes: fatura.mes, ano: fatura.ano });
      }
    }

    for (const periodo of periodosFechados.values()) {
      await this.productValidationService.registrarPeriodoFechadoSeConsolidado(
        tenantId,
        periodo.mes,
        periodo.ano,
      );
    }
  }

  private avaliaFechamentoOuReabertura(statusAtual: string | undefined, statusNovo: string): boolean {
    const isFechando = statusNovo === 'FECHADA';
    const isReabrindo = statusAtual === 'FECHADA' && statusNovo !== 'FECHADA';
    return isFechando || isReabrindo;
  }

  private mapearFaturaUpsert(tenantId: string, faturaData: FaturaDto) {
    const dataPagamento = faturaData.dataPagamentoBanco ? new Date(faturaData.dataPagamentoBanco) : null;
    return {
      where: { id_tenantId: { id: faturaData.id, tenantId } },
      create: {
        id: faturaData.id,
        tenantId,
        cartaoId: faturaData.cartaoId,
        mes: faturaData.mes,
        ano: faturaData.ano,
        responsavelId: faturaData.responsavelId,
        status: faturaData.status,
        dataPagamentoBanco: dataPagamento,
      },
      update: {
        status: faturaData.status,
        responsavelId: faturaData.responsavelId,
        dataPagamentoBanco: dataPagamento,
      },
    };
  }
}
