import { Injectable, NotFoundException, BadRequestException, forwardRef, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { FinanceiroGateway } from './financeiro.gateway';

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
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => AuthService))
    private authService: AuthService,
    private gateway: FinanceiroGateway
  ) {}

  // --- TENANTS ---
  async obterPreviewConvite(inviteCode: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { inviteCode: inviteCode.toUpperCase() },
      include: {
        membros: {
          where: { userId: null }, // Apenas membros sem usuário vinculado (slots livres)
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

    this.gateway.notificarAlteracao(tenant.id, 'membros_alterados');

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
    let { id, nome, avatar, userId, username, password } = membroData;
    const defaultAvatar = avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(nome)}`;

    // Se o admin forneceu username e password, criamos o usuário automaticamente
    if (!userId && username && password) {
      try {
        const newUser = await this.authService.register(username, password);
        userId = newUser.userId;
      } catch (err) {
        // Se já existe, tentamos vincular o usuário existente (se o admin souber o login correto)
        // Ou retornamos o erro se for conflito real.
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
        userId,
      },
      update: {
        nome,
        avatar: defaultAvatar,
        userId,
      },
    });
    const result = serializeBigInt(upserted);
    this.gateway.notificarAlteracao(tenantId, 'membros_alterados');
    return result;
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
    const result = serializeBigInt(upserted);
    this.gateway.notificarAlteracao(tenantId, 'cartoes_alterados');
    return result;
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
    this.gateway.notificarAlteracao(tenantId, 'cartoes_alterados');
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

    // GAP 5: bloquear edição de gasto em fatura fechada ou acertada
    // Acertos de netting (isSettlement) são permitidos mesmo em fatura fechada
    if (faturaId && !isSettlement) {
      const fatura = await tx.fatura.findUnique({ where: { id_tenantId: { id: faturaId, tenantId } } });
      if (fatura && (fatura.status === 'FECHADA' || fatura.status === 'ACERTADA')) {
        throw new BadRequestException(
          `Não é possível editar um gasto em uma fatura com status "${fatura.status}". Reabra a fatura primeiro.`
        );
      }
    }

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
      const savedGastos = [];
      for (const g of gastosList) {
        savedGastos.push(await this.upsertGastoTx(tx, tenantId, g));
      }
      return savedGastos;
    });
    const serialized = serializeBigInt(result);
    this.gateway.notificarAlteracao(tenantId, 'gastos_alterados');
    return serialized;
  }

  async excluirGasto(tenantId: string, id: string) {
    const gasto = await this.prisma.gasto.findUnique({ where: { id_tenantId: { id, tenantId } } });
    if (gasto && gasto.faturaId && !gasto.isSettlement) {
      const fatura = await this.prisma.fatura.findUnique({ where: { id_tenantId: { id: gasto.faturaId, tenantId } } });
      if (fatura && (fatura.status === 'FECHADA' || fatura.status === 'ACERTADA')) {
        throw new BadRequestException(
          `Não é possível excluir um gasto em uma fatura com status "${fatura.status}". Reabra a fatura primeiro.`
        );
      }
    }

    // Reverter saldos em AcertoMembro se for um gasto de liquidação
    if (gasto && gasto.isSettlement) {
      const fatura = await this.prisma.fatura.findUnique({ where: { id_tenantId: { id: gasto.faturaId, tenantId } } });
      if (fatura) {
        let anteriorMes = fatura.mes - 1;
        let anteriorAno = fatura.ano;
        if (anteriorMes < 1) {
          anteriorMes = 12;
          anteriorAno -= 1;
        }

        // Busca faturas fechadas/acertadas no mês anterior ou atual para reverter o valor pago
        const faturasParaReverter = await this.prisma.fatura.findMany({
          where: {
            tenantId,
            OR: [
              { mes: anteriorMes, ano: anteriorAno },
              { mes: fatura.mes, ano: fatura.ano }
            ],
            status: { in: ['FECHADA', 'ACERTADA'] }
          }
        });

        let estornoRestante = Number(gasto.valorTotalCentavos);

        for (const fatTarget of faturasParaReverter) {
          if (estornoRestante <= 0) break;

          const acertosMembro = await this.prisma.acertoMembro.findMany({
            where: { tenantId, faturaId: fatTarget.id, membroId: gasto.compradorId }
          });

          for (const acerto of acertosMembro) {
            const vPago = Number(acerto.valorPagoCentavos);
            if (vPago > 0) {
              const valorEstorno = Math.min(estornoRestante, vPago);
              const novoVPago = vPago - valorEstorno;
              const vAcerto = Number(acerto.totalConsumidoCentavos) - Number(acerto.totalAntecipadoCentavos);

              await this.prisma.acertoMembro.update({
                where: { id_tenantId: { id: acerto.id, tenantId } },
                data: {
                  valorPagoCentavos: BigInt(novoVPago),
                  pago: novoVPago >= vAcerto && vAcerto > 0,
                  dataPagamento: novoVPago >= vAcerto ? acerto.dataPagamento : null
                }
              });

              estornoRestante -= valorEstorno;

              if (fatTarget.status === 'ACERTADA' && novoVPago < vAcerto) {
                await this.prisma.fatura.update({
                  where: { id_tenantId: { id: fatTarget.id, tenantId } },
                  data: { status: 'FECHADA' }
                });
              }
            }
          }
        }
      }
    }

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
    if (typeof valorCentavos !== 'number' || valorCentavos <= 0) {
      throw new BadRequestException('Valor da antecipacao deve ser maior que zero');
    }

    const dataAntecipacao = new Date(data.data);
    if (Number.isNaN(dataAntecipacao.getTime())) {
      throw new BadRequestException('Data da antecipacao invalida');
    }

    const saved = await this.prisma.antecipacaoFatura.upsert({
      where: { id_tenantId: { id, tenantId } },
      create: {
        id,
        tenantId,
        faturaId,
        membroId,
        responsavelId,
        valorCentavos: BigInt(valorCentavos),
        data: dataAntecipacao,
        observacao: observacao || null,
      },
      update: {
        faturaId,
        membroId,
        responsavelId,
        valorCentavos: BigInt(valorCentavos),
        data: dataAntecipacao,
        observacao: observacao || null,
      },
    });
    const result = serializeBigInt(saved);
    this.gateway.notificarAlteracao(tenantId, 'faturas_alteradas');
    return result;
  }

  async excluirAntecipacaoFatura(tenantId: string, id: string) {
    await this.prisma.antecipacaoFatura.delete({
      where: {
        id_tenantId: { id, tenantId },
      },
    });
    this.gateway.notificarAlteracao(tenantId, 'faturas_alteradas');
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
    const result = serializeBigInt(upserted);
    this.gateway.notificarAlteracao(tenantId, 'acertos_alterados');
    return result;
  }
}
