import { Controller, Get, Post, Delete, Body, Param, Headers, UseGuards, Request } from '@nestjs/common';
import { FinanceiroService } from './financeiro.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

import { MembroDto } from './dto/membro.dto';
import { CartaoDto } from './dto/cartao.dto';
import { FaturaDto } from './dto/fatura.dto';
import { GastoDto } from './dto/gasto.dto';
import { ContaFixaDto } from './dto/conta-fixa.dto';
import { AcertoDto } from './dto/acerto.dto';

@ApiTags('Financeiro')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('financeiro')
export class FinanceiroController {
  constructor(private financeiroService: FinanceiroService) {}

  // --- TENANTS ---
  @Post('tenants')
  async criarTenant(@Body('name') name: string, @Request() req: any) {
    return this.financeiroService.criarTenant(name, req.user.userId);
  }

  @Post('tenants/entrar')
  async entrarTenantPorCodigo(@Body('inviteCode') inviteCode: string, @Request() req: any) {
    return this.financeiroService.entrarTenantPorCodigo(inviteCode, req.user.userId);
  }

  // --- MEMBROS ---
  @Get('membros')
  async listarMembros(@Headers('X-Tenant-ID') tenantId: string) {
    return this.financeiroService.listarMembros(tenantId);
  }

  @Post('membros')
  async salvarMembro(@Headers('X-Tenant-ID') tenantId: string, @Body() membroDto: MembroDto) {
    return this.financeiroService.salvarMembro(tenantId, membroDto);
  }

  // --- CARTOES ---
  @Get('cartoes')
  async listarCartoes(@Headers('X-Tenant-ID') tenantId: string) {
    return this.financeiroService.listarCartoes(tenantId);
  }

  @Post('cartoes')
  async salvarCartao(@Headers('X-Tenant-ID') tenantId: string, @Body() cartaoDto: CartaoDto) {
    return this.financeiroService.salvarCartao(tenantId, cartaoDto);
  }

  @Delete('cartoes/:id')
  async excluirCartao(@Headers('X-Tenant-ID') tenantId: string, @Param('id') id: string) {
    return this.financeiroService.excluirCartao(tenantId, id);
  }

  // --- FATURAS ---
  @Get('faturas')
  async listarFaturas(@Headers('X-Tenant-ID') tenantId: string) {
    return this.financeiroService.listarFaturas(tenantId);
  }

  @Post('faturas')
  async salvarFatura(@Headers('X-Tenant-ID') tenantId: string, @Body() faturaDto: FaturaDto) {
    return this.financeiroService.salvarFatura(tenantId, faturaDto);
  }

  @Post('faturas/batch')
  async salvarMuitasFaturas(@Headers('X-Tenant-ID') tenantId: string, @Body() faturasDto: FaturaDto[]) {
    return this.financeiroService.salvarMuitasFaturas(tenantId, faturasDto);
  }

  // --- GASTOS ---
  @Get('gastos')
  async listarGastos(@Headers('X-Tenant-ID') tenantId: string) {
    return this.financeiroService.listarGastos(tenantId);
  }

  @Post('gastos')
  async salvarGasto(@Headers('X-Tenant-ID') tenantId: string, @Body() gastoDto: GastoDto) {
    return this.financeiroService.salvarGasto(tenantId, gastoDto);
  }

  @Post('gastos/batch')
  async salvarMuitosGastos(@Headers('X-Tenant-ID') tenantId: string, @Body() gastosDto: GastoDto[]) {
    return this.financeiroService.salvarMuitosGastos(tenantId, gastosDto);
  }

  @Delete('gastos/:id')
  async excluirGasto(@Headers('X-Tenant-ID') tenantId: string, @Param('id') id: string) {
    return this.financeiroService.excluirGasto(tenantId, id);
  }

  @Post('gastos/delete-batch')
  async excluirMuitosGastos(@Headers('X-Tenant-ID') tenantId: string, @Body() body: { ids: string[] }) {
    return this.financeiroService.excluirMuitosGastos(tenantId, body.ids);
  }

  // --- CONTAS FIXAS ---
  @Get('contas-fixas')
  async listarContasFixas(@Headers('X-Tenant-ID') tenantId: string) {
    return this.financeiroService.listarContasFixas(tenantId);
  }

  @Post('contas-fixas')
  async salvarContaFixa(@Headers('X-Tenant-ID') tenantId: string, @Body() contaFixaDto: ContaFixaDto) {
    return this.financeiroService.salvarContaFixa(tenantId, contaFixaDto);
  }

  @Delete('contas-fixas/:id')
  async excluirContaFixa(@Headers('X-Tenant-ID') tenantId: string, @Param('id') id: string) {
    return this.financeiroService.excluirContaFixa(tenantId, id);
  }

  // --- ACERTOS ---
  @Get('acertos')
  async listarAcertos(@Headers('X-Tenant-ID') tenantId: string) {
    return this.financeiroService.listarAcertos(tenantId);
  }

  @Post('acertos')
  async salvarAcerto(@Headers('X-Tenant-ID') tenantId: string, @Body() acertoDto: AcertoDto) {
    return this.financeiroService.salvarAcerto(tenantId, acertoDto);
  }
}
