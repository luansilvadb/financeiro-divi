import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FinanceiroGateway } from './financeiro.gateway';
import { serializeBigInt } from '../shared/utils/serialization';
import { Role } from '@prisma/client';
import { MembroService } from './membro.service';
import { CargoService } from './cargo.service';
import { CartaoService } from './cartao.service';
import { LancamentoService } from './lancamento.service';
import { MembroDto } from './dto/membro.dto';
import { CargoCasaDto } from './dto/cargo-casa.dto';
import { CartaoDto } from './dto/cartao.dto';
import { FaturaDto } from './dto/fatura.dto';
import { GastoDto } from './dto/gasto.dto';
import { ContaFixaDto } from './dto/conta-fixa.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class FinanceiroService {
  constructor(
    private prisma: PrismaService,
    private gateway: FinanceiroGateway,
    private membroService: MembroService,
    private cargoService: CargoService,
    private cartaoService: CartaoService,
    private lancamentoService: LancamentoService,
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

    await this.membroService.vincularOuCriarMembroAoSistema(tenant.id, userId);

    this.gateway.notificarAlteracao(tenant.id, 'membros_alterados');
    return serializeBigInt(tenant);
  }

  // Delegação para MembroService
  async listarMembros(tenantId: string) {
    return this.membroService.listarMembros(tenantId);
  }

  async salvarMembro(tenantId: string, membroData: MembroDto) {
    return this.membroService.salvarMembro(tenantId, membroData);
  }

  // Delegação para CargoService
  async listarCargos(tenantId: string) {
    return this.cargoService.listarCargos(tenantId);
  }

  async salvarCargo(tenantId: string, cargoData: CargoCasaDto) {
    return this.cargoService.salvarCargo(tenantId, cargoData);
  }

  async excluirCargo(tenantId: string, id: string) {
    return this.cargoService.excluirCargo(tenantId, id);
  }

  // Delegação para CartaoService
  async listarCartoes(tenantId: string) {
    return this.cartaoService.listarCartoes(tenantId);
  }

  async salvarCartao(tenantId: string, cartaoData: CartaoDto, userId: string) {
    return this.cartaoService.salvarCartao(tenantId, cartaoData, userId);
  }

  async excluirCartao(tenantId: string, id: string) {
    return this.cartaoService.excluirCartao(tenantId, id);
  }

  async listarFaturas(tenantId: string) {
    return this.cartaoService.listarFaturas(tenantId);
  }

  async salvarFatura(tenantId: string, faturaData: FaturaDto) {
    return this.cartaoService.salvarFatura(tenantId, faturaData);
  }

  async salvarMuitasFaturas(tenantId: string, faturasList: FaturaDto[]) {
    return this.cartaoService.salvarMuitasFaturas(tenantId, faturasList);
  }

  // Delegação para LancamentoService
  async listarGastos(tenantId: string) {
    return this.lancamentoService.listarGastos(tenantId);
  }

  async salvarGasto(tenantId: string, gastoData: GastoDto) {
    return this.lancamentoService.salvarGasto(tenantId, gastoData);
  }

  async salvarMuitosGastos(tenantId: string, gastosList: GastoDto[]) {
    return this.lancamentoService.salvarMuitosGastos(tenantId, gastosList);
  }

  async excluirGasto(tenantId: string, id: string) {
    return this.lancamentoService.excluirGasto(tenantId, id);
  }

  async excluirMuitosGastos(tenantId: string, ids: string[]) {
    return this.lancamentoService.excluirMuitosGastos(tenantId, ids);
  }

  async listarContasFixas(tenantId: string) {
    return this.lancamentoService.listarContasFixas(tenantId);
  }

  async salvarContaFixa(tenantId: string, contaData: ContaFixaDto) {
    return this.lancamentoService.salvarContaFixa(tenantId, contaData);
  }

  async excluirContaFixa(tenantId: string, id: string) {
    return this.lancamentoService.excluirContaFixa(tenantId, id);
  }
}

