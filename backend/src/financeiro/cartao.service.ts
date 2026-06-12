import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FinanceiroGateway } from './financeiro.gateway';
import { serializeBigInt } from '../shared/utils/serialization';
import { CartaoDto } from './dto/cartao.dto';
import { FaturaDto } from './dto/fatura.dto';
import { ProductValidationService } from './product-validation.service';

@Injectable()
export class CartaoService {
  constructor(
    private prisma: PrismaService,
    private gateway: FinanceiroGateway,
    private productValidationService: ProductValidationService,
  ) {}

  async listarCartoes(tenantId: string) {
    const cartoes = await this.prisma.cartao.findMany({
      where: { tenantId },
    });
    return serializeBigInt(cartoes);
  }

  async salvarCartao(tenantId: string, cartaoData: CartaoDto, userId: string) {
    await this.validarFeatureFlag(tenantId, userId, 'ALLOW_GERENCIAR_CARTOES');
    const { id, nome, diaFechamento, responsavelPadraoId } = cartaoData;

    const membro = await this.prisma.membroCasa.findFirst({
      where: {
        tenantId,
        userId,
      },
    });

    if (!membro) {
      throw new BadRequestException('Você não é membro desta moradia.');
    }

    const upserted = await this.prisma.cartao.upsert({
      where: {
        id_tenantId: { id, tenantId },
      },
      create: {
        id,
        tenantId,
        nome,
        diaFechamento,
        responsavelPadraoId,
      },
      update: {
        nome,
        diaFechamento,
        responsavelPadraoId,
      },
    });
    this.gateway.notificarAlteracao(tenantId, 'cartoes_alterados');
    return serializeBigInt(upserted);
  }

  async excluirCartao(tenantId: string, id: string, userId?: string) {
    await this.validarFeatureFlag(tenantId, userId, 'ALLOW_GERENCIAR_CARTOES');
    await this.prisma.cartao.delete({
      where: {
        id_tenantId: { id, tenantId },
      },
    });
    this.gateway.notificarAlteracao(tenantId, 'cartoes_alterados');
    return { success: true };
  }

  async listarFaturas(tenantId: string) {
    const faturas = await this.prisma.fatura.findMany({
      where: { tenantId },
    });
    return serializeBigInt(faturas);
  }

  async salvarFatura(tenantId: string, faturaData: FaturaDto, executorUserId?: string) {
    const { id, cartaoId, mes, ano, responsavelId, status, dataPagamentoBanco } = faturaData;

    // Detectar se está fechando ou reabrindo faturas existentes
    const faturaExistente = await this.prisma.fatura.findUnique({
      where: { id_tenantId: { id, tenantId } }
    });
    const isFechando = status === 'FECHADA';
    const isReabrindo = faturaExistente?.status === 'FECHADA' && status !== 'FECHADA';

    if (isFechando || isReabrindo) {
      await this.validarFeatureFlag(tenantId, executorUserId, 'ALLOW_FECHAR_PERIODO');
    }

    const upserted = await this.prisma.fatura.upsert({
      where: {
        id_tenantId: { id, tenantId },
      },
      create: {
        id,
        tenantId,
        cartaoId,
        mes,
        ano,
        responsavelId,
        status,
        dataPagamentoBanco: dataPagamentoBanco ? new Date(dataPagamentoBanco) : null,
      },
      update: {
        status,
        responsavelId,
        dataPagamentoBanco: dataPagamentoBanco ? new Date(dataPagamentoBanco) : null,
      },
    });
    if (status === 'FECHADA') {
      await this.productValidationService.registrarPeriodoFechadoSeConsolidado(tenantId, mes, ano);
    }
    this.gateway.notificarAlteracao(tenantId, 'faturas_alteradas');
    return serializeBigInt(upserted);
  }

  async salvarMuitasFaturas(tenantId: string, faturasList: FaturaDto[], executorUserId?: string) {
    // Validar flag se houver qualquer fechamento ou reabertura na lista
    const ids = faturasList.map(f => f.id);
    const faturasExistentes = await this.prisma.fatura.findMany({
      where: {
        tenantId,
        id: { in: ids }
      }
    });

    const statusExistentes = new Map(faturasExistentes.map(f => [f.id, f.status]));

    let precisaValidar = false;
    for (const f of faturasList) {
      const isFechando = f.status === 'FECHADA';
      const statusAnterior = statusExistentes.get(f.id);
      const isReabrindo = statusAnterior === 'FECHADA' && f.status !== 'FECHADA';

      if (isFechando || isReabrindo) {
        precisaValidar = true;
        break;
      }
    }

    if (precisaValidar) {
      await this.validarFeatureFlag(tenantId, executorUserId, 'ALLOW_FECHAR_PERIODO');
    }

    const operations = faturasList.map(f => {
      const { id, cartaoId, mes, ano, responsavelId, status, dataPagamentoBanco } = f;
      return this.prisma.fatura.upsert({
        where: { id_tenantId: { id, tenantId } },
        create: {
          id,
          tenantId,
          cartaoId,
          mes,
          ano,
          responsavelId,
          status,
          dataPagamentoBanco: dataPagamentoBanco ? new Date(dataPagamentoBanco) : null,
        },
        update: {
          status,
          responsavelId,
          dataPagamentoBanco: dataPagamentoBanco ? new Date(dataPagamentoBanco) : null,
        },
      });
    });
    const result = await this.prisma.$transaction(operations);
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
    this.gateway.notificarAlteracao(tenantId, 'faturas_alteradas');
    return serializeBigInt(result);
  }

  private async validarFeatureFlag(tenantId: string, userId: string | undefined, flagName: string) {
    if (!userId) return;
    
    const executor = await this.prisma.membroCasa.findFirst({
      where: { tenantId, userId }
    });

    if (executor && executor.role !== 'ADMIN') {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { permissions: true }
      });
      const permissions = (tenant?.permissions as Record<string, any>) || {};
      const rolePermissions = permissions[executor.role] || {};

      const moradorLegacyFlagMap: Record<string, string> = {
        'ALLOW_LANCAR_GASTO': 'ALLOW_MORADOR_LANCAR_GASTO',
        'ALLOW_GERENCIAR_CARTOES': 'ALLOW_MORADOR_GERENCIAR_CARTOES',
        'ALLOW_GERENCIAR_CONTAS_FIXAS': 'ALLOW_MORADOR_GERENCIAR_CONTAS_FIXAS',
        'ALLOW_REGISTRAR_NETTING': 'ALLOW_MORADOR_REGISTRAR_NETTING',
        'ALLOW_VER_AUDIT_LOGS': 'ALLOW_MORADOR_VER_AUDIT_LOGS'
      };
      const legacyFlagName = moradorLegacyFlagMap[flagName] || flagName;

      const isBlocked = rolePermissions[flagName] === false ||
                        (executor.role === 'MORADOR' && permissions[legacyFlagName] === false);

      if (isBlocked) {
        if (flagName === 'ALLOW_FECHAR_PERIODO') {
          throw new ForbiddenException('O administrador da moradia desativou a permissão de fechar ou reabrir o período para o seu papel.');
        }
        throw new ForbiddenException('O administrador da moradia desativou esta permissão para o seu papel.');
      }
    }
  }
}
