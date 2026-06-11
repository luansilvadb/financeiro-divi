import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FinanceiroGateway } from './financeiro.gateway';
import { serializeBigInt } from '../shared/utils/serialization';
import { CartaoDto } from './dto/cartao.dto';
import { FaturaDto } from './dto/fatura.dto';

@Injectable()
export class CartaoService {
  constructor(
    private prisma: PrismaService,
    private gateway: FinanceiroGateway
  ) {}

  async listarCartoes(tenantId: string) {
    const cartoes = await this.prisma.cartao.findMany({
      where: { tenantId },
    });
    return serializeBigInt(cartoes);
  }

  async salvarCartao(tenantId: string, cartaoData: CartaoDto, userId: string) {
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
    this.gateway.notificarAlteracao(tenantId, 'faturas_alteradas');
    return serializeBigInt(upserted);
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
    this.gateway.notificarAlteracao(tenantId, 'faturas_alteradas');
    return serializeBigInt(result);
  }
}
