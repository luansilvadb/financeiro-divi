import { Injectable, NotFoundException, forwardRef, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { FinanceiroGateway } from './financeiro.gateway';
import { serializeBigInt } from '../shared/utils/serialization';
import { randomUUID } from 'crypto';

@Injectable()
export class FinanceiroService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => AuthService))
    private authService: AuthService,
    private gateway: FinanceiroGateway
  ) {}

  async obterPreviewConvite(inviteCode: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { inviteCode: inviteCode.toUpperCase() },
      include: {
        membros: {
          where: { userId: null },
          select: { id: true, nome: true, avatar: true }
        }
      }
    });

    if (!tenant) {
      throw new NotFoundException('Casa não encontrada.');
    }

    return serializeBigInt({
      id: tenant.id,
      name: tenant.name,
      membrosDisponiveis: tenant.membros
    });
  }

  async criarTenant(name: string, userId: string) {
    const inviteCode = `CASA-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const tenant = await this.prisma.tenant.create({
      data: {
        name,
        inviteCode,
      },
    });

    const user = await this.prisma.usuario.findUnique({ where: { id: userId } });
    await this.prisma.membroCasa.create({
      data: {
        id: `membro-${randomUUID()}`,
        tenantId: tenant.id,
        nome: user ? user.username : 'Membro Fundador',
        avatar: (user ? user.username : 'MF').substring(0, 2).toUpperCase(),
        userId,
      },
    });

    return serializeBigInt(tenant);
  }

  async entrarTenantPorCodigo(inviteCode: string, userId: string) {
    const cleanedCode = inviteCode.trim().toUpperCase();
    const tenant = await this.prisma.tenant.findUnique({
      where: { inviteCode: cleanedCode },
    });

    if (!tenant) {
      throw new NotFoundException('Código de convite inválido ou casa não encontrada.');
    }

    const existing = await this.prisma.membroCasa.findFirst({
      where: {
        tenantId: tenant.id,
        userId,
      },
    });

    if (existing) {
      return serializeBigInt(tenant);
    }

    const user = await this.prisma.usuario.findUnique({ where: { id: userId } });
    const username = user ? user.username : 'Convidado';

    const perfilExistente = await this.prisma.membroCasa.findFirst({
      where: {
        tenantId: tenant.id,
        nome: { equals: username, mode: 'insensitive' },
        userId: null,
      },
    });

    if (perfilExistente) {
      await this.prisma.membroCasa.update({
        where: {
          id_tenantId: { id: perfilExistente.id, tenantId: tenant.id },
        },
        data: { userId },
      });
    } else {
      await this.prisma.membroCasa.create({
        data: {
          id: `membro-${randomUUID()}`,
          tenantId: tenant.id,
          nome: username,
          avatar: username.substring(0, 2).toUpperCase(),
          userId,
        },
      });
    }

    this.gateway.notificarAlteracao(tenant.id, 'membros_alterados');

    return serializeBigInt(tenant);
  }

  async listarMembros(tenantId: string) {
    const membros = await this.prisma.membroCasa.findMany({
      where: { tenantId },
    });
    return serializeBigInt(membros);
  }

  async salvarMembro(tenantId: string, membroData: any) {
    let { id, nome, avatar, userId, username, password, ativo } = membroData;
    const defaultAvatar = avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(nome)}`;
    const isActive = ativo !== undefined ? ativo : true;

    if (!userId && username && password) {
      try {
        const newUser = await this.authService.register(username, password);
        userId = newUser.userId;
      } catch (err) {
        throw err;
      }
    }

    const upserted = await this.prisma.membroCasa.upsert({
      where: {
        id_tenantId: { id, tenantId },
      },
      create: {
        id,
        tenantId,
        nome,
        avatar: defaultAvatar,
        ativo: isActive,
        userId,
      },
      update: {
        nome,
        avatar: defaultAvatar,
        ativo: isActive,
        userId,
      },
    });
    const result = serializeBigInt(upserted);
    this.gateway.notificarAlteracao(tenantId, 'membros_alterados');
    return result;
  }

  async listarCartoes(tenantId: string) {
    const cartoes = await this.prisma.cartao.findMany({
      where: { tenantId },
    });
    return serializeBigInt(cartoes);
  }

  async salvarCartao(tenantId: string, cartaoData: any) {
    const { id, nome, diaFechamento, responsavelPadraoId } = cartaoData;
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
    const result = serializeBigInt(upserted);
    this.gateway.notificarAlteracao(tenantId, 'cartoes_alterados');
    return result;
  }

  async excluirCartao(tenantId: string, id: string) {
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

  async salvarFatura(tenantId: string, faturaData: any) {
    const { id, cartaoId, mes, ano, responsavelId, status, dataPagamentoBanco } = faturaData;
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
    const result = serializeBigInt(upserted);
    this.gateway.notificarAlteracao(tenantId, 'faturas_alteradas');
    return result;
  }

  async salvarMuitasFaturas(tenantId: string, faturasList: any[]) {
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
    const serialized = serializeBigInt(result);
    this.gateway.notificarAlteracao(tenantId, 'faturas_alteradas');
    return serialized;
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

  private async upsertGastoTx(tx: any, tenantId: string, g: any) {
    const {
      id,
      faturaId,
      descricao,
      valorTotalCentavos,
      compradorId,
      installments,
      totalInstallments,
      isLoan,
      borrowerId,
      recurringBillId,
      isSettlement,
      settlementDetails,
      method,
      cardOwnerId,
      grupoParcelasId,
      divisoes,
    } = g;

    await tx.divisaoGasto.deleteMany({ where: { gastoId: id, tenantId } });

    await tx.gasto.upsert({
      where: { id_tenantId: { id, tenantId } },
      create: {
        id, tenantId, faturaId, descricao,
        valorTotalCentavos: BigInt(valorTotalCentavos || 0),
        compradorId, installments, totalInstallments,
        isLoan, borrowerId, recurringBillId,
        isSettlement, settlementDetails, method, cardOwnerId, grupoParcelasId,
      },
      update: {
        faturaId, descricao,
        valorTotalCentavos: BigInt(valorTotalCentavos || 0),
        compradorId, installments, totalInstallments,
        isLoan, borrowerId, recurringBillId,
        isSettlement, settlementDetails, method, cardOwnerId, grupoParcelasId,
      },
    });

    if (divisoes && divisoes.length > 0) {
      await tx.divisaoGasto.createMany({
        data: divisoes.map((d: any) => ({
          tenantId,
          gastoId: id,
          membroId: d.membroId,
          valorCentavos: BigInt(d.valorCentavos || 0),
        })),
      });
    }

    return tx.gasto.findUnique({
      where: { id_tenantId: { id, tenantId } },
      include: { divisoes: true },
    });
  }

  async salvarGasto(tenantId: string, gastoData: any) {
    const result = await this.prisma.$transaction(async (tx) => {
      return this.upsertGastoTx(tx, tenantId, gastoData);
    });
    const serialized = serializeBigInt(result);
    this.gateway.notificarAlteracao(tenantId, 'gastos_alterados');
    return serialized;
  }

  async salvarMuitosGastos(tenantId: string, gastosList: any[]) {
    const result = await this.prisma.$transaction(async (tx) => {
      return Promise.all(gastosList.map(g => this.upsertGastoTx(tx, tenantId, g)));
    });
    const serialized = serializeBigInt(result);
    this.gateway.notificarAlteracao(tenantId, 'gastos_alterados');
    return serialized;
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

  async salvarContaFixa(tenantId: string, contaData: any) {
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
    const result = serializeBigInt(upserted);
    this.gateway.notificarAlteracao(tenantId, 'contas_fixas_alteradas');
    return result;
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
