import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

function serializeBigInt(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'bigint') return Number(obj);
  if (Array.isArray(obj)) return obj.map(serializeBigInt);
  if (typeof obj === 'object') {
    const newObj: any = {};
    for (const key of Object.keys(obj)) {
      newObj[key] = serializeBigInt(obj[key]);
    }
    return newObj;
  }
  return obj;
}

@Injectable()
export class FinanceiroService {
  constructor(private prisma: PrismaService) {}

  // --- TENANTS ---
  async criarTenant(name: string, userId: string) {
    const inviteCode = `CASA-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const tenant = await this.prisma.tenant.create({
      data: {
        name,
        inviteCode,
      },
    });

    // Cria o membro fundador na casa
    const user = await this.prisma.usuario.findUnique({ where: { id: userId } });
    await this.prisma.membroCasa.create({
      data: {
        id: `membro-${crypto.randomUUID()}`,
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

    // Verifica se o usuário já participa dessa casa
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

    // Tenta encontrar um perfil de membro existente com o mesmo nome na casa sem userId vinculado
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
          id: `membro-${crypto.randomUUID()}`,
          tenantId: tenant.id,
          nome: username,
          avatar: username.substring(0, 2).toUpperCase(),
          userId,
        },
      });
    }

    return serializeBigInt(tenant);
  }

  // --- MEMBROS ---
  async listarMembros(tenantId: string) {
    const membros = await this.prisma.membroCasa.findMany({
      where: { tenantId },
    });
    return serializeBigInt(membros);
  }

  async salvarMembro(tenantId: string, membroData: any) {
    const { id, nome, avatar, userId } = membroData;
    const defaultAvatar = avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(nome)}`;
    const upserted = await this.prisma.membroCasa.upsert({
      where: {
        id_tenantId: { id, tenantId },
      },
      create: {
        id,
        tenantId,
        nome,
        avatar: defaultAvatar,
        userId,
      },
      update: {
        nome,
        avatar: defaultAvatar,
        userId,
      },
    });
    return serializeBigInt(upserted);
  }

  // --- CARTOES ---
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
    return serializeBigInt(upserted);
  }

  async excluirCartao(tenantId: string, id: string) {
    // Bloquear exclusão se o cartão possuir faturas vinculadas
    const faturasCount = await this.prisma.fatura.count({
      where: { tenantId, cartaoId: id },
    });
    if (faturasCount > 0) {
      throw new BadRequestException('Não é possível excluir um cartão que possui faturas ou gastos registrados.');
    }

    await this.prisma.cartao.delete({
      where: {
        id_tenantId: { id, tenantId },
      },
    });
    return { success: true };
  }

  // --- FATURAS ---
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
    return serializeBigInt(upserted);
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
    return serializeBigInt(result);
  }

  // --- GASTOS ---
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
    return serializeBigInt(result);
  }

  async salvarMuitosGastos(tenantId: string, gastosList: any[]) {
    const result = await this.prisma.$transaction(async (tx) => {
      const savedGastos = [];
      for (const g of gastosList) {
        savedGastos.push(await this.upsertGastoTx(tx, tenantId, g));
      }
      return savedGastos;
    });
    return serializeBigInt(result);
  }

  async excluirGasto(tenantId: string, id: string) {
    await this.prisma.gasto.delete({
      where: {
        id_tenantId: { id, tenantId },
      },
    });
    return { success: true };
  }

  async excluirMuitosGastos(tenantId: string, ids: string[]) {
    await this.prisma.gasto.deleteMany({
      where: {
        tenantId,
        id: { in: ids },
      },
    });
    return { success: true };
  }

  // --- CONTAS FIXAS ---
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
    return serializeBigInt(upserted);
  }

  async excluirContaFixa(tenantId: string, id: string) {
    await this.prisma.contaFixa.delete({
      where: {
        id_tenantId: { id, tenantId },
      },
    });
    return { success: true };
  }

  // --- ACERTOS ---
  async listarAcertos(tenantId: string) {
    const acertos = await this.prisma.acertoMembro.findMany({
      where: { tenantId },
    });
    return serializeBigInt(acertos);
  }

  async listarAntecipacoesFatura(tenantId: string) {
    const antecipacoes = await this.prisma.antecipacaoFatura.findMany({ where: { tenantId } });
    return serializeBigInt(antecipacoes);
  }

  async salvarAntecipacaoFatura(tenantId: string, data: any) {
    const { id, faturaId, membroId, responsavelId, valorCentavos, observacao } = data;
    const saved = await this.prisma.antecipacaoFatura.upsert({
      where: { id },
      create: {
        id,
        tenantId,
        faturaId,
        membroId,
        responsavelId,
        valorCentavos: BigInt(valorCentavos || 0),
        data: new Date(data.data),
        observacao: observacao || null,
      },
      update: {
        faturaId,
        membroId,
        responsavelId,
        valorCentavos: BigInt(valorCentavos || 0),
        data: new Date(data.data),
        observacao: observacao || null,
      },
    });
    return serializeBigInt(saved);
  }

  async excluirAntecipacaoFatura(tenantId: string, id: string) {
    await this.prisma.antecipacaoFatura.deleteMany({ where: { tenantId, id } });
    return { success: true };
  }

  async salvarAcerto(tenantId: string, acertoData: any) {
    const {
      id,
      faturaId,
      membroId,
      totalConsumidoCentavos,
      totalAntecipadoCentavos,
      tipo,
      valorPagoCentavos,
      pago,
      dataPagamento,
    } = acertoData;

    const upserted = await this.prisma.acertoMembro.upsert({
      where: {
        id_tenantId: { id, tenantId },
      },
      create: {
        id,
        tenantId,
        faturaId,
        membroId,
        totalConsumidoCentavos: BigInt(totalConsumidoCentavos || 0),
        totalAntecipadoCentavos: BigInt(totalAntecipadoCentavos || 0),
        tipo: tipo || 'MEMBRO_PAGA',
        valorPagoCentavos: BigInt(valorPagoCentavos || 0),
        pago: pago || false,
        dataPagamento: dataPagamento ? new Date(dataPagamento) : null,
      },
      update: {
        faturaId,
        membroId,
        totalConsumidoCentavos: BigInt(totalConsumidoCentavos || 0),
        totalAntecipadoCentavos: BigInt(totalAntecipadoCentavos || 0),
        tipo: tipo || 'MEMBRO_PAGA',
        valorPagoCentavos: BigInt(valorPagoCentavos || 0),
        pago: pago || false,
        dataPagamento: dataPagamento ? new Date(dataPagamento) : null,
      },
    });
    return serializeBigInt(upserted);
  }
}
