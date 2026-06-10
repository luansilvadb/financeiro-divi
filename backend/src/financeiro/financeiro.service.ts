import { Injectable, NotFoundException, BadRequestException, forwardRef, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { FinanceiroGateway } from './financeiro.gateway';
import { serializeBigInt } from '../shared/utils/serialization';
import { randomUUID } from 'crypto';
import { Prisma, Role } from '@prisma/client';
import { MembroDto } from './dto/membro.dto';
import { CargoCasaDto } from './dto/cargo-casa.dto';
import { CartaoDto } from './dto/cartao.dto';
import { FaturaDto } from './dto/fatura.dto';
import { GastoDto } from './dto/gasto.dto';
import { ContaFixaDto } from './dto/conta-fixa.dto';

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
    const nome = user?.nome || 'Membro Fundador';
    const avatar = (nome || 'MF').substring(0, 2).toUpperCase();

    await this.prisma.membroCasa.create({
      data: {
        id: `membro-${randomUUID()}`,
        tenantId: tenant.id,
        nome,
        avatar,
        userId,
        role: Role.ADMIN,
      },
    });

    return serializeBigInt(tenant);
  }

  async entrarTenantPorCodigo(inviteCode: string, userId: string) {
    const cleanedCode = inviteCode.trim().toUpperCase();
    const tenant = await this.prisma.tenant.findUnique({
      where: { inviteCode: cleanedCode },
    });

    if (!tenant) throw new NotFoundException('Código de convite inválido ou casa não encontrada.');

    const isMemberAlready = await this.prisma.membroCasa.findFirst({
      where: { tenantId: tenant.id, userId },
    });

    if (isMemberAlready) return serializeBigInt(tenant);

    await this.vincularOuCriarMembroAoSistema(tenant.id, userId);

    this.gateway.notificarAlteracao(tenant.id, 'membros_alterados');
    return serializeBigInt(tenant);
  }

  private async vincularOuCriarMembroAoSistema(tenantId: string, userId: string) {
    const user = await this.prisma.usuario.findUnique({ where: { id: userId } });
    const nome = user ? user.nome : 'Convidado';

    const perfilExistente = await this.prisma.membroCasa.findFirst({
      where: {
        tenantId,
        nome: { equals: nome, mode: 'insensitive' },
        userId: null,
      },
    });

    if (perfilExistente) {
      await this.prisma.membroCasa.update({
        where: { id_tenantId: { id: perfilExistente.id, tenantId } },
        data: { userId },
      });
      return;
    }

    await this.prisma.membroCasa.create({
      data: {
        id: `membro-${randomUUID()}`,
        tenantId,
        nome: nome,
        avatar: nome.substring(0, 2).toUpperCase(),
        userId,
      },
    });
  }

  async listarMembros(tenantId: string) {
    const membros = await this.prisma.membroCasa.findMany({
      where: { tenantId },
      include: {
        cargo: true,
      },
    });
    return serializeBigInt(membros);
  }

  async salvarMembro(tenantId: string, membroData: MembroDto) {
    const { id, nome, email, password, ativo, role } = membroData;
    let { userId } = membroData;

    const finalEmail = email || (membroData as any).username;

    const isActive = ativo !== undefined ? ativo : true;
    const memberRole = role || Role.MORADOR;

    await this.validarRegrasSalvarMembro(tenantId, id, finalEmail, password, memberRole, isActive);

    if (!userId && finalEmail && password) {
      const newUser = await this.authService.register(finalEmail, nome, password);
      userId = newUser.userId;
    }

    const upserted = await this.persistirMembro(tenantId, {
      ...membroData,
      ativo: isActive,
      role: memberRole,
      userId,
    });

    this.gateway.notificarAlteracao(tenantId, 'membros_alterados');
    return serializeBigInt(upserted);
  }

  private async persistirMembro(tenantId: string, data: MembroDto) {
    const { id, nome, avatar, ativo, role, cargoId, userId } = data;
    const defaultAvatar = avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(nome)}`;
    const finalCargoId = role === Role.ADMIN ? null : (cargoId || null);

    return this.prisma.membroCasa.upsert({
      where: { id_tenantId: { id, tenantId } },
      create: {
        id, tenantId, nome, avatar: defaultAvatar,
        ativo: ativo!, role: role!, cargoId: finalCargoId, userId,
      },
      update: {
        nome, avatar: defaultAvatar,
        ativo: ativo!, role: role!, cargoId: finalCargoId, userId,
      },
      include: { cargo: true },
    });
  }

  private async validarRegrasSalvarMembro(
    tenantId: string, id: string, emailOrUsername?: string, password?: string,
    newRole?: Role, isActive?: boolean
  ) {
    const membroAtual = await this.prisma.membroCasa.findUnique({
      where: { id_tenantId: { id, tenantId } },
    });

    if (!membroAtual) {
      if (!emailOrUsername?.trim() || !password?.trim()) {
        throw new BadRequestException('Usuário e senha são obrigatórios para a criação de um novo morador.');
      }
      return;
    }

    const isAdminAtivo = membroAtual.role === Role.ADMIN && membroAtual.ativo;
    const isLosingAdmin = !isActive || newRole !== Role.ADMIN;

    if (isAdminAtivo && isLosingAdmin) {
      const adminsAtivos = await this.prisma.membroCasa.count({
        where: { tenantId, role: Role.ADMIN, ativo: true },
      });
      if (adminsAtivos <= 1) {
        throw new BadRequestException('A moradia precisa ter pelo menos um administrador ativo.');
      }
    }
  }

  async listarCargos(tenantId: string) {
    const cargos = await this.prisma.cargoCasa.findMany({
      where: { tenantId },
      include: {
        _count: {
          select: { membros: true },
        },
      },
    });
    return serializeBigInt(cargos);
  }

  async salvarCargo(tenantId: string, cargoData: CargoCasaDto) {
    const { id, nome, cor, permissoes } = cargoData;
    const cargoId = id || `cargo-${randomUUID()}`;
    const upserted = await this.prisma.cargoCasa.upsert({
      where: {
        id_tenantId: { id: cargoId, tenantId },
      },
      create: {
        id: cargoId,
        tenantId,
        nome,
        cor,
        permissoes,
      },
      update: {
        nome,
        cor,
        permissoes,
      },
    });
    this.gateway.notificarAlteracao(tenantId, 'cargos_alterados');
    return serializeBigInt(upserted);
  }

  async excluirCargo(tenantId: string, id: string) {
    await this.prisma.membroCasa.updateMany({
      where: {
        tenantId,
        cargoId: id,
      },
      data: {
        cargoId: null,
      },
    });

    await this.prisma.cargoCasa.delete({
      where: {
        id_tenantId: { id, tenantId },
      },
    });
    this.gateway.notificarAlteracao(tenantId, 'cargos_alterados');
    return { success: true };
  }

  async listarCartoes(tenantId: string) {
    const cartoes = await this.prisma.cartao.findMany({
      where: { tenantId },
    });
    return serializeBigInt(cartoes);
  }

  async salvarCartao(tenantId: string, cartaoData: CartaoDto) {
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

  async salvarFatura(tenantId: string, faturaData: FaturaDto) {
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

  async salvarMuitasFaturas(tenantId: string, faturasList: FaturaDto[]) {
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

  async salvarGasto(tenantId: string, gastoData: GastoDto) {
    const result = await this.prisma.$transaction(async (tx) => {
      return this.upsertGastoTx(tx, tenantId, gastoData);
    });
    const serialized = serializeBigInt(result);
    this.gateway.notificarAlteracao(tenantId, 'gastos_alterados');
    return serialized;
  }

  async salvarMuitosGastos(tenantId: string, gastosList: GastoDto[]) {
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
