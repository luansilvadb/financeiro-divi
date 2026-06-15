import { Controller, Get, Post, Patch, Delete, Body, Param, Headers, Request } from '@nestjs/common';
import { MembroService } from './membro.service';
import { CartaoService } from './cartao.service';
import { LancamentoService } from './lancamento.service';
import { AuditLogService } from './audit-log.service';
import { ApiTags, ApiBearerAuth, ApiHeader, ApiOperation, ApiOkResponse, ApiCreatedResponse, ApiUnauthorizedResponse, ApiBadRequestResponse, ApiBody } from '@nestjs/swagger';

import { MembroDto } from './dto/membro.dto';
import { CartaoDto } from './dto/cartao.dto';
import { FaturaDto } from './dto/fatura.dto';
import { GastoDto } from './dto/gasto.dto';
import { ContaFixaDto } from './dto/conta-fixa.dto';
import { CriarTenantDto } from './dto/criar-tenant.dto';
import { EntrarTenantDto } from './dto/entrar-tenant.dto';
import { ExcluirMuitosGastosDto } from './dto/excluir-muitos-gastos.dto';
import { Public } from '../auth/public.decorator';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import type { AuthenticatedRequest } from '../auth/auth.types';
import { ProductValidationService } from './product-validation.service';
import { ValidationStatusDto } from './dto/validation-status.dto';
import { AtualizarPermissoesDto } from './dto/atualizar-permissoes.dto';

@ApiTags('Financeiro')
@ApiBearerAuth('JWT-auth')
@ApiUnauthorizedResponse({ description: 'Token JWT ausente ou inválido' })
@Controller('financeiro')
export class FinanceiroController {
  constructor(
    private membroService: MembroService,
    private cartaoService: CartaoService,
    private lancamentoService: LancamentoService,
    private auditLogService: AuditLogService,
    private productValidationService: ProductValidationService,
  ) {}

  @ApiOperation({ summary: 'Consultar os marcos de validação do produto para a casa ativa' })
  @ApiHeader({ name: 'X-Tenant-ID', required: true, description: 'ID do Tenant (casa) ativo' })
  @ApiOkResponse({ description: 'Status de validação retornado com sucesso', type: ValidationStatusDto })
  @Roles(Role.ADMIN)
  @Get('validacao/status')
  async obterStatusValidacao(@Headers('x-tenant-id') tenantId: string) {
    return this.productValidationService.obterStatus(tenantId);
  }

  @ApiOperation({ summary: 'Obter preview de uma casa pelo código de convite', description: 'Retorna nome da casa e membros disponíveis para vínculo (sem login).' })
  @ApiOkResponse({ description: 'Dados da casa retornados com sucesso' })
  @ApiBadRequestResponse({ description: 'Código de convite inválido ou casa inexistente' })
  @Public()
  @Get('tenants/invite/:code')
  async obterPreviewConvite(@Param('code') code: string) {
    return this.membroService.obterPreviewConvite(code);
  }

  @ApiOperation({ summary: 'Criar um novo Tenant (casa)', description: 'Cria uma nova organização multitenant e vincula o usuário autenticado como administrador.' })
  @ApiCreatedResponse({ description: 'Tenant criado com sucesso' })
  @ApiBadRequestResponse({ description: 'Dados de entrada inválidos' })
  @Post('tenants')
  async criarTenant(@Body() criarTenantDto: CriarTenantDto, @Request() req: AuthenticatedRequest) {
    return this.membroService.criarTenant(criarTenantDto.name, req.user.userId);
  }

  @ApiOperation({ summary: 'Entrar em um Tenant existente usando código de convite', description: 'Associa o usuário autenticado a um tenant correspondente ao código de convite informado.' })
  @ApiOkResponse({ description: 'Acesso ao tenant concedido com sucesso' })
  @ApiBadRequestResponse({ description: 'Código de convite inválido ou tenant inexistente' })
  @Post('tenants/entrar')
  async entrarTenantPorCodigo(@Body() entrarTenantDto: EntrarTenantDto, @Request() req: AuthenticatedRequest) {
    return this.membroService.entrarTenantPorCodigo(entrarTenantDto.inviteCode, req.user.userId);
  }

  @ApiOperation({ summary: 'Listar todos os membros do tenant', description: 'Retorna a lista de membros que participam do rateio no tenant ativo.' })
  @ApiHeader({ name: 'X-Tenant-ID', required: true, description: 'ID do Tenant (casa) ativo no qual a operação será executada', example: 'd3b07384-d113-4c4c-a110-230c45aa835b' })
  @ApiOkResponse({ description: 'Membros listados com sucesso', type: [MembroDto] })
  @Roles(Role.ADMIN, Role.MORADOR, Role.VISUALIZADOR)
  @Get('membros')
  async listarMembros(@Headers('x-tenant-id') tenantId: string) {
    return this.membroService.listarMembros(tenantId);
  }

  @ApiOperation({ summary: 'Salvar/atualizar um membro no tenant', description: 'Cria ou atualiza as informações de um membro associado ao tenant ativo.' })
  @ApiHeader({ name: 'X-Tenant-ID', required: true, description: 'ID do Tenant (casa) ativo', example: 'd3b07384-d113-4c4c-a110-230c45aa835b' })
  @ApiOkResponse({ description: 'Membro salvo com sucesso', type: MembroDto })
  @Roles(Role.ADMIN, Role.MORADOR)
  @Post('membros')
  async salvarMembro(
    @Headers('x-tenant-id') tenantId: string,
    @Body() membroDto: MembroDto,
    @Request() req: AuthenticatedRequest
  ) {
    return this.membroService.salvarMembro(tenantId, membroDto, req.user.userId);
  }

  @ApiOperation({ summary: 'Listar cartões de crédito do tenant', description: 'Retorna todos os cartões cadastrados no tenant ativo.' })
  @ApiHeader({ name: 'X-Tenant-ID', required: true, description: 'ID do Tenant (casa) ativo', example: 'd3b07384-d113-4c4c-a110-230c45aa835b' })
  @ApiOkResponse({ description: 'Cartões listados com sucesso', type: [CartaoDto] })
  @Roles(Role.ADMIN, Role.MORADOR, Role.VISUALIZADOR)
  @Get('cartoes')
  async listarCartoes(@Headers('x-tenant-id') tenantId: string) {
    return this.cartaoService.listarCartoes(tenantId);
  }

  @ApiOperation({ summary: 'Salvar/atualizar um cartão de crédito no tenant', description: 'Cria ou updates um cartão de crédito no tenant ativo.' })
  @ApiHeader({ name: 'X-Tenant-ID', required: true, description: 'ID do Tenant (casa) ativo', example: 'd3b07384-d113-4c4c-a110-230c45aa835b' })
  @ApiOkResponse({ description: 'Cartão salvo com sucesso', type: CartaoDto })
  @Roles(Role.ADMIN, Role.MORADOR)
  @Post('cartoes')
  async salvarCartao(
    @Headers('x-tenant-id') tenantId: string,
    @Body() cartaoDto: CartaoDto,
    @Request() req: AuthenticatedRequest
  ) {
    return this.cartaoService.salvarCartao(tenantId, cartaoDto, req.user.userId);
  }

  @ApiOperation({ summary: 'Excluir um cartão de crédito', description: 'Exclui um cartão de crédito específico a partir do seu ID.' })
  @ApiHeader({ name: 'X-Tenant-ID', required: true, description: 'ID do Tenant (casa) ativo', example: 'd3b07384-d113-4c4c-a110-230c45aa835b' })
  @ApiOkResponse({ description: 'Cartão excluído com sucesso' })
  @Roles(Role.ADMIN, Role.MORADOR)
  @Delete('cartoes/:id')
  async excluirCartao(
    @Headers('x-tenant-id') tenantId: string, 
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest
  ) {
    return this.cartaoService.excluirCartao(tenantId, id, req.user.userId);
  }

  @ApiOperation({ summary: 'Listar todas as faturas do tenant', description: 'Retorna a lista completa de faturas de cartões do tenant ativo.' })
  @ApiHeader({ name: 'X-Tenant-ID', required: true, description: 'ID do Tenant (casa) ativo', example: 'd3b07384-d113-4c4c-a110-230c45aa835b' })
  @ApiOkResponse({ description: 'Faturas listadas com sucesso', type: [FaturaDto] })
  @Roles(Role.ADMIN, Role.MORADOR, Role.VISUALIZADOR)
  @Get('faturas')
  async listarFaturas(@Headers('x-tenant-id') tenantId: string) {
    return this.cartaoService.listarFaturas(tenantId);
  }

  @ApiOperation({ summary: 'Salvar/atualizar uma fatura no tenant', description: 'Cria ou updates uma fatura de cartão de crédito no tenant ativo.' })
  @ApiHeader({ name: 'X-Tenant-ID', required: true, description: 'ID do Tenant (casa) ativo', example: 'd3b07384-d113-4c4c-a110-230c45aa835b' })
  @ApiOkResponse({ description: 'Fatura salva com sucesso', type: FaturaDto })
  @Roles(Role.ADMIN, Role.MORADOR)
  @Post('faturas')
  async salvarFatura(
    @Headers('x-tenant-id') tenantId: string,
    @Body() faturaDto: FaturaDto,
    @Request() req: AuthenticatedRequest
  ) {
    return this.cartaoService.salvarFatura(tenantId, faturaDto, req.user.userId);
  }

  @ApiOperation({ summary: 'Salvar faturas em lote (batch)', description: 'Salva ou updates várias faturas simultaneamente para fins de sincronização.' })
  @ApiHeader({ name: 'X-Tenant-ID', required: true, description: 'ID do Tenant (casa) ativo', example: 'd3b07384-d113-4c4c-a110-230c45aa835b' })
  @ApiBody({ type: [FaturaDto] })
  @ApiOkResponse({ description: 'Faturas em lote sincronizadas com sucesso' })
  @Roles(Role.ADMIN, Role.MORADOR)
  @Post('faturas/batch')
  async salvarMuitasFaturas(
    @Headers('x-tenant-id') tenantId: string,
    @Body() faturasDto: FaturaDto[],
    @Request() req: AuthenticatedRequest
  ) {
    return this.cartaoService.salvarMuitasFaturas(tenantId, faturasDto, req.user.userId);
  }

  @ApiOperation({ summary: 'Listar gastos do tenant', description: 'Retorna a lista completa de gastos cadastrados no tenant ativo.' })
  @ApiHeader({ name: 'X-Tenant-ID', required: true, description: 'ID do Tenant (casa) ativo no qual a operação será executada', example: 'd3b07384-d113-4c4c-a110-230c45aa835b' })
  @ApiOkResponse({ description: 'Gastos listados com sucesso', type: [GastoDto] })
  @Roles(Role.ADMIN, Role.MORADOR, Role.VISUALIZADOR)
  @Get('gastos')
  async listarGastos(
    @Headers('x-tenant-id') tenantId: string,
    @Request() req: AuthenticatedRequest
  ) {
    return this.lancamentoService.listarGastosVisiveis(tenantId, req.user.userId);
  }

  @ApiOperation({ summary: 'Salvar/atualizar um gasto no tenant', description: 'Cria ou updates as informações de um gasto (incluindo seu rateio de divisão) no tenant ativo.' })
  @ApiHeader({ name: 'X-Tenant-ID', required: true, description: 'ID do Tenant (casa) ativo', example: 'd3b07384-d113-4c4c-a110-230c45aa835b' })
  @ApiOkResponse({ description: 'Gasto salvo com sucesso', type: GastoDto })
  @Roles(Role.ADMIN, Role.MORADOR)
  @Post('gastos')
  async salvarGasto(
    @Headers('x-tenant-id') tenantId: string,
    @Body() gastoDto: GastoDto,
    @Request() req: AuthenticatedRequest
  ) {
    return this.lancamentoService.salvarGasto(tenantId, gastoDto, req.user.userId);
  }

  @ApiOperation({ summary: 'Salvar gastos em lote (batch)', description: 'Sincroniza múltiplos gastos simultaneamente no banco de dados do tenant ativo.' })
  @ApiHeader({ name: 'X-Tenant-ID', required: true, description: 'ID do Tenant (casa) ativo', example: 'd3b07384-d113-4c4c-a110-230c45aa835b' })
  @ApiBody({ type: [GastoDto] })
  @ApiOkResponse({ description: 'Gastos em lote sincronizados com sucesso' })
  @Roles(Role.ADMIN, Role.MORADOR)
  @Post('gastos/batch')
  async salvarMuitosGastos(
    @Headers('x-tenant-id') tenantId: string,
    @Body() gastosDto: GastoDto[],
    @Request() req: AuthenticatedRequest
  ) {
    return this.lancamentoService.salvarMuitosGastos(tenantId, gastosDto, req.user.userId);
  }

  @ApiOperation({ summary: 'Excluir um gasto', description: 'Remove um gasto específico do tenant ativo através do seu ID.' })
  @ApiHeader({ name: 'X-Tenant-ID', required: true, description: 'ID do Tenant (casa) ativo', example: 'd3b07384-d113-4c4c-a110-230c45aa835b' })
  @ApiOkResponse({ description: 'Gasto excluído com sucesso' })
  @Roles(Role.ADMIN, Role.MORADOR)
  @Delete('gastos/:id')
  async excluirGasto(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest
  ) {
    return this.lancamentoService.excluirGasto(tenantId, id, req.user.userId);
  }

  @ApiOperation({ summary: 'Excluir gastos em lote (batch)', description: 'Exclui múltiplos gastos especificados no corpo da requisição.' })
  @ApiHeader({ name: 'X-Tenant-ID', required: true, description: 'ID do Tenant (casa) ativo', example: 'd3b07384-d113-4c4c-a110-230c45aa835b' })
  @ApiOkResponse({ description: 'Gastos em lote excluídos com sucesso' })
  @Roles(Role.ADMIN, Role.MORADOR)
  @Post('gastos/delete-batch')
  async excluirMuitosGastos(
    @Headers('x-tenant-id') tenantId: string,
    @Body() excluirDto: ExcluirMuitosGastosDto,
    @Request() req: AuthenticatedRequest
  ) {
    return this.lancamentoService.excluirMuitosGastos(tenantId, excluirDto.ids, req.user.userId);
  }

  @ApiOperation({ summary: 'Listar contas fixas do tenant', description: 'Retorna a lista de todas as contas fixas cadastradas no tenant ativo.' })
  @ApiHeader({ name: 'X-Tenant-ID', required: true, description: 'ID do Tenant (casa) ativo', example: 'd3b07384-d113-4c4c-a110-230c45aa835b' })
  @ApiOkResponse({ description: 'Contas fixas listadas com sucesso', type: [ContaFixaDto] })
  @Roles(Role.ADMIN, Role.MORADOR, Role.VISUALIZADOR)
  @Get('contas-fixas')
  async listarContasFixas(@Headers('x-tenant-id') tenantId: string) {
    return this.lancamentoService.listarContasFixas(tenantId);
  }

  @ApiOperation({ summary: 'Salvar/atualizar conta fixa no tenant', description: 'Cria ou updates uma conta fixa no tenant ativo.' })
  @ApiHeader({ name: 'X-Tenant-ID', required: true, description: 'ID do Tenant (casa) ativo', example: 'd3b07384-d113-4c4c-a110-230c45aa835b' })
  @ApiOkResponse({ description: 'Conta fixa salva com sucesso', type: ContaFixaDto })
  @Roles(Role.ADMIN, Role.MORADOR)
  @Post('contas-fixas')
  async salvarContaFixa(
    @Headers('x-tenant-id') tenantId: string, 
    @Body() contaFixaDto: ContaFixaDto,
    @Request() req: AuthenticatedRequest
  ) {
    return this.lancamentoService.salvarContaFixa(tenantId, contaFixaDto, req.user.userId);
  }

  @ApiOperation({ summary: 'Excluir uma conta fixa', description: 'Exclui uma conta fixa cadastrada no tenant ativo.' })
  @ApiHeader({ name: 'X-Tenant-ID', required: true, description: 'ID do Tenant (casa) ativo', example: 'd3b07384-d113-4c4c-a110-230c45aa835b' })
  @ApiOkResponse({ description: 'Conta fixa excluída com sucesso' })
  @Roles(Role.ADMIN, Role.MORADOR)
  @Delete('contas-fixas/:id')
  async excluirContaFixa(
    @Headers('x-tenant-id') tenantId: string, 
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest
  ) {
    return this.lancamentoService.excluirContaFixa(tenantId, id, req.user.userId);
  }

  @ApiOperation({ summary: 'Listar histórico de auditoria da casa' })
  @ApiHeader({ name: 'X-Tenant-ID', required: true, description: 'ID do Tenant (casa) ativo' })
  @Roles(Role.ADMIN, Role.MORADOR, Role.VISUALIZADOR)
  @Get('audit-logs')
  async listarAuditLogs(
    @Headers('x-tenant-id') tenantId: string,
    @Request() req: AuthenticatedRequest
  ) {
    return this.auditLogService.listar(tenantId, req.user.userId);
  }

  @ApiOperation({ summary: 'Obter permissões dinâmicas de moradores do tenant ativo' })
  @ApiHeader({ name: 'X-Tenant-ID', required: true, description: 'ID do Tenant (casa) ativo' })
  @Roles(Role.ADMIN, Role.MORADOR, Role.VISUALIZADOR)
  @Get('tenants/permissions')
  async obterTenantPermissions(@Headers('x-tenant-id') tenantId: string) {
    return this.membroService.obterTenantPermissions(tenantId);
  }

  @ApiOperation({ summary: 'Atualizar permissões dinâmicas de um papel (exclusivo Admin)' })
  @ApiHeader({ name: 'X-Tenant-ID', required: true, description: 'ID do Tenant (casa) ativo' })
  @Roles(Role.ADMIN)
  @Patch('tenants/permissions/:role')
  async atualizarTenantPermissions(
    @Headers('x-tenant-id') tenantId: string,
    @Param('role') role: string,
    @Body() permissionsDto: AtualizarPermissoesDto,
    @Request() req: AuthenticatedRequest
  ) {
    return this.membroService.atualizarTenantPermissions(tenantId, role, permissionsDto, req.user.userId);
  }
}
