import { Controller, Get, Post, Delete, Body, Param, Headers, UseGuards, Request } from '@nestjs/common';
import { FinanceiroService } from './financeiro.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

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
  async salvarMembro(@Headers('X-Tenant-ID') tenantId: string, @Body() body: any) {
    return this.financeiroService.salvarMembro(tenantId, body);
  }

  // --- CARTOES ---
  @Get('cartoes')
  async listarCartoes(@Headers('X-Tenant-ID') tenantId: string) {
    return this.financeiroService.listarCartoes(tenantId);
  }

  @Post('cartoes')
  async salvarCartao(@Headers('X-Tenant-ID') tenantId: string, @Body() body: any) {
    return this.financeiroService.salvarCartao(tenantId, body);
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
  async salvarFatura(@Headers('X-Tenant-ID') tenantId: string, @Body() body: any) {
    return this.financeiroService.salvarFatura(tenantId, body);
  }

  @Post('faturas/batch')
  async salvarMuitasFaturas(@Headers('X-Tenant-ID') tenantId: string, @Body() body: any[]) {
    return this.financeiroService.salvarMuitasFaturas(tenantId, body);
  }

  // --- GASTOS ---
  @Get('gastos')
  async listarGastos(@Headers('X-Tenant-ID') tenantId: string) {
    return this.financeiroService.listarGastos(tenantId);
  }

  @Post('gastos')
  async salvarGasto(@Headers('X-Tenant-ID') tenantId: string, @Body() body: any) {
    return this.financeiroService.salvarGasto(tenantId, body);
  }

  @Post('gastos/batch')
  async salvarMuitosGastos(@Headers('X-Tenant-ID') tenantId: string, @Body() body: any[]) {
    return this.financeiroService.salvarMuitosGastos(tenantId, body);
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
  async salvarContaFixa(@Headers('X-Tenant-ID') tenantId: string, @Body() body: any) {
    return this.financeiroService.salvarContaFixa(tenantId, body);
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
  async salvarAcerto(@Headers('X-Tenant-ID') tenantId: string, @Body() body: any) {
    return this.financeiroService.salvarAcerto(tenantId, body);
  }
}
