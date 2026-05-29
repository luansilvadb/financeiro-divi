import { Controller, Get, Post, Delete, Body, Param, Headers, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { FinanceiroService } from './financeiro.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiHeader, ApiOperation, ApiOkResponse, ApiCreatedResponse, ApiUnauthorizedResponse, ApiBadRequestResponse, ApiBody } from '@nestjs/swagger';

import { MembroDto } from './dto/membro.dto';
import { CartaoDto } from './dto/cartao.dto';
import { FaturaDto } from './dto/fatura.dto';
import { GastoDto } from './dto/gasto.dto';
import { ContaFixaDto } from './dto/conta-fixa.dto';
import { AcertoDto } from './dto/acerto.dto';
import { AntecipacaoFaturaDto } from './dto/antecipacao-fatura.dto';
import { CriarTenantDto } from './dto/criar-tenant.dto';
import { EntrarTenantDto } from './dto/entrar-tenant.dto';
import { ExcluirMuitosGastosDto } from './dto/excluir-muitos-gastos.dto';

@ApiTags('Financeiro')
@ApiBearerAuth('JWT-auth')
@ApiUnauthorizedResponse({ description: 'Token JWT ausente ou inválido' })
@UseGuards(JwtAuthGuard)
@Controller('financeiro')
export class FinanceiroController {
  constructor(private financeiroService: FinanceiroService) {}

  // --- TENANTS ---
  @ApiOperation({ summary: 'Criar um novo Tenant (casa)', description: 'Cria uma nova organização multitenant e vincula o usuário autenticado como administrador.' })
  @ApiCreatedResponse({ description: 'Tenant criado com sucesso' })
  @ApiBadRequestResponse({ description: 'Dados de entrada inválidos' })
  @Post('tenants')
  async criarTenant(@Body() criarTenantDto: CriarTenantDto, @Request() req: any) {
    return this.financeiroService.criarTenant(criarTenantDto.name, req.user.userId);
  }

  @ApiOperation({ summary: 'Entrar em um Tenant existente usando código de convite', description: 'Associa o usuário autenticado a um tenant correspondente ao código de convite informado.' })
  @ApiOkResponse({ description: 'Acesso ao tenant concedido com sucesso' })
  @ApiBadRequestResponse({ description: 'Código de convite inválido ou tenant inexistente' })
  @Post('tenants/entrar')
  async entrarTenantPorCodigo(@Body() entrarTenantDto: EntrarTenantDto, @Request() req: any) {
    return this.financeiroService.entrarTenantPorCodigo(entrarTenantDto.inviteCode, req.user.userId);
  }

  // --- MEMBROS ---
  @ApiOperation({ summary: 'Listar todos os membros do tenant', description: 'Retorna a lista de membros que participam do rateio no tenant ativo.' })
  @ApiHeader({ name: 'X-Tenant-ID', required: true, description: 'ID do Tenant (casa) ativo no qual a operação será executada', example: 'd3b07384-d113-4c4c-a110-230c45aa835b' })
  @ApiOkResponse({ description: 'Membros listados com sucesso', type: [MembroDto] })
  @Get('membros')
  async listarMembros(@Headers('x-tenant-id') tenantId: string) {
    if (!tenantId) {
      throw new BadRequestException('O cabeçalho x-tenant-id é obrigatório.');
    }
    return this.financeiroService.listarMembros(tenantId);
  }

  @ApiOperation({ summary: 'Salvar/atualizar um membro no tenant', description: 'Cria ou atualiza as informações de um membro associado ao tenant ativo.' })
  @ApiHeader({ name: 'X-Tenant-ID', required: true, description: 'ID do Tenant (casa) ativo', example: 'd3b07384-d113-4c4c-a110-230c45aa835b' })
  @ApiOkResponse({ description: 'Membro salvo com sucesso', type: MembroDto })
  @Post('membros')
  async salvarMembro(@Headers('x-tenant-id') tenantId: string, @Body() membroDto: MembroDto) {
    if (!tenantId) {
      throw new BadRequestException('O cabeçalho x-tenant-id é obrigatório.');
    }
    return this.financeiroService.salvarMembro(tenantId, membroDto);
  }

  // --- CARTOES ---
  @ApiOperation({ summary: 'Listar cartões de crédito do tenant', description: 'Retorna todos os cartões cadastrados no tenant ativo.' })
  @ApiHeader({ name: 'X-Tenant-ID', required: true, description: 'ID do Tenant (casa) ativo', example: 'd3b07384-d113-4c4c-a110-230c45aa835b' })
  @ApiOkResponse({ description: 'Cartões listados com sucesso', type: [CartaoDto] })
  @Get('cartoes')
  async listarCartoes(@Headers('x-tenant-id') tenantId: string) {
    if (!tenantId) {
      throw new BadRequestException('O cabeçalho x-tenant-id é obrigatório.');
    }
    return this.financeiroService.listarCartoes(tenantId);
  }

  @ApiOperation({ summary: 'Salvar/atualizar um cartão de crédito no tenant', description: 'Cria ou updates um cartão de crédito no tenant ativo.' })
  @ApiHeader({ name: 'X-Tenant-ID', required: true, description: 'ID do Tenant (casa) ativo', example: 'd3b07384-d113-4c4c-a110-230c45aa835b' })
  @ApiOkResponse({ description: 'Cartão salvo com sucesso', type: CartaoDto })
  @Post('cartoes')
  async salvarCartao(@Headers('x-tenant-id') tenantId: string, @Body() cartaoDto: CartaoDto) {
    if (!tenantId) {
      throw new BadRequestException('O cabeçalho x-tenant-id é obrigatório.');
    }
    return this.financeiroService.salvarCartao(tenantId, cartaoDto);
  }

  @ApiOperation({ summary: 'Excluir um cartão de crédito', description: 'Exclui um cartão de crédito específico a partir do seu ID.' })
  @ApiHeader({ name: 'X-Tenant-ID', required: true, description: 'ID do Tenant (casa) ativo', example: 'd3b07384-d113-4c4c-a110-230c45aa835b' })
  @ApiOkResponse({ description: 'Cartão excluído com sucesso' })
  @Delete('cartoes/:id')
  async excluirCartao(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string) {
    if (!tenantId) {
      throw new BadRequestException('O cabeçalho x-tenant-id é obrigatório.');
    }
    return this.financeiroService.excluirCartao(tenantId, id);
  }

  // --- FATURAS ---
  @ApiOperation({ summary: 'Listar todas as faturas do tenant', description: 'Retorna a lista completa de faturas de cartões do tenant ativo.' })
  @ApiHeader({ name: 'X-Tenant-ID', required: true, description: 'ID do Tenant (casa) ativo', example: 'd3b07384-d113-4c4c-a110-230c45aa835b' })
  @ApiOkResponse({ description: 'Faturas listadas com sucesso', type: [FaturaDto] })
  @Get('faturas')
  async listarFaturas(@Headers('x-tenant-id') tenantId: string) {
    if (!tenantId) {
      throw new BadRequestException('O cabeçalho x-tenant-id é obrigatório.');
    }
    return this.financeiroService.listarFaturas(tenantId);
  }

  @ApiOperation({ summary: 'Salvar/atualizar uma fatura no tenant', description: 'Cria ou updates uma fatura de cartão de crédito no tenant ativo.' })
  @ApiHeader({ name: 'X-Tenant-ID', required: true, description: 'ID do Tenant (casa) ativo', example: 'd3b07384-d113-4c4c-a110-230c45aa835b' })
  @ApiOkResponse({ description: 'Fatura salva com sucesso', type: FaturaDto })
  @Post('faturas')
  async salvarFatura(@Headers('x-tenant-id') tenantId: string, @Body() faturaDto: FaturaDto) {
    if (!tenantId) {
      throw new BadRequestException('O cabeçalho x-tenant-id é obrigatório.');
    }
    return this.financeiroService.salvarFatura(tenantId, faturaDto);
  }

  @ApiOperation({ summary: 'Salvar faturas em lote (batch)', description: 'Salva ou updates várias faturas simultaneamente para fins de sincronização.' })
  @ApiHeader({ name: 'X-Tenant-ID', required: true, description: 'ID do Tenant (casa) ativo', example: 'd3b07384-d113-4c4c-a110-230c45aa835b' })
  @ApiBody({ type: [FaturaDto] })
  @ApiOkResponse({ description: 'Faturas em lote sincronizadas com sucesso' })
  @Post('faturas/batch')
  async salvarMuitasFaturas(@Headers('x-tenant-id') tenantId: string, @Body() faturasDto: FaturaDto[]) {
    if (!tenantId) {
      throw new BadRequestException('O cabeçalho x-tenant-id é obrigatório.');
    }
    return this.financeiroService.salvarMuitasFaturas(tenantId, faturasDto);
  }

  // --- GASTOS ---
  @ApiOperation({ summary: 'Listar gastos do tenant', description: 'Retorna a lista completa de gastos cadastrados no tenant ativo.' })
  @ApiHeader({ name: 'X-Tenant-ID', required: true, description: 'ID do Tenant (casa) ativo', example: 'd3b07384-d113-4c4c-a110-230c45aa835b' })
  @ApiOkResponse({ description: 'Gastos listados com sucesso', type: [GastoDto] })
  @Get('gastos')
  async listarGastos(@Headers('x-tenant-id') tenantId: string) {
    if (!tenantId) {
      throw new BadRequestException('O cabeçalho x-tenant-id é obrigatório.');
    }
    return this.financeiroService.listarGastos(tenantId);
  }

  @ApiOperation({ summary: 'Salvar/atualizar um gasto no tenant', description: 'Cria ou updates as informações de um gasto (incluindo seu rateio de divisão) no tenant ativo.' })
  @ApiHeader({ name: 'X-Tenant-ID', required: true, description: 'ID do Tenant (casa) ativo', example: 'd3b07384-d113-4c4c-a110-230c45aa835b' })
  @ApiOkResponse({ description: 'Gasto salvo com sucesso', type: GastoDto })
  @Post('gastos')
  async salvarGasto(@Headers('x-tenant-id') tenantId: string, @Body() gastoDto: GastoDto) {
    if (!tenantId) {
      throw new BadRequestException('O cabeçalho x-tenant-id é obrigatório.');
    }
    return this.financeiroService.salvarGasto(tenantId, gastoDto);
  }

  @ApiOperation({ summary: 'Salvar gastos em lote (batch)', description: 'Sincroniza múltiplos gastos simultaneamente no banco de dados do tenant ativo.' })
  @ApiHeader({ name: 'X-Tenant-ID', required: true, description: 'ID do Tenant (casa) ativo', example: 'd3b07384-d113-4c4c-a110-230c45aa835b' })
  @ApiBody({ type: [GastoDto] })
  @ApiOkResponse({ description: 'Gastos em lote sincronizados com sucesso' })
  @Post('gastos/batch')
  async salvarMuitosGastos(@Headers('x-tenant-id') tenantId: string, @Body() gastosDto: GastoDto[]) {
    if (!tenantId) {
      throw new BadRequestException('O cabeçalho x-tenant-id é obrigatório.');
    }
    return this.financeiroService.salvarMuitosGastos(tenantId, gastosDto);
  }

  @ApiOperation({ summary: 'Excluir um gasto', description: 'Remove um gasto específico do tenant ativo através do seu ID.' })
  @ApiHeader({ name: 'X-Tenant-ID', required: true, description: 'ID do Tenant (casa) ativo', example: 'd3b07384-d113-4c4c-a110-230c45aa835b' })
  @ApiOkResponse({ description: 'Gasto excluído com sucesso' })
  @Delete('gastos/:id')
  async excluirGasto(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string) {
    if (!tenantId) {
      throw new BadRequestException('O cabeçalho x-tenant-id é obrigatório.');
    }
    return this.financeiroService.excluirGasto(tenantId, id);
  }

  @ApiOperation({ summary: 'Excluir gastos em lote (batch)', description: 'Exclui múltiplos gastos especificados no corpo da requisição.' })
  @ApiHeader({ name: 'X-Tenant-ID', required: true, description: 'ID do Tenant (casa) ativo', example: 'd3b07384-d113-4c4c-a110-230c45aa835b' })
  @ApiOkResponse({ description: 'Gastos em lote excluídos com sucesso' })
  @Post('gastos/delete-batch')
  async excluirMuitosGastos(@Headers('x-tenant-id') tenantId: string, @Body() excluirDto: ExcluirMuitosGastosDto) {
    if (!tenantId) {
      throw new BadRequestException('O cabeçalho x-tenant-id é obrigatório.');
    }
    return this.financeiroService.excluirMuitosGastos(tenantId, excluirDto.ids);
  }

  // --- CONTAS FIXAS ---
  @ApiOperation({ summary: 'Listar contas fixas do tenant', description: 'Retorna a lista de todas as contas fixas cadastradas no tenant ativo.' })
  @ApiHeader({ name: 'X-Tenant-ID', required: true, description: 'ID do Tenant (casa) ativo', example: 'd3b07384-d113-4c4c-a110-230c45aa835b' })
  @ApiOkResponse({ description: 'Contas fixas listadas com sucesso', type: [ContaFixaDto] })
  @Get('contas-fixas')
  async listarContasFixas(@Headers('x-tenant-id') tenantId: string) {
    if (!tenantId) {
      throw new BadRequestException('O cabeçalho x-tenant-id é obrigatório.');
    }
    return this.financeiroService.listarContasFixas(tenantId);
  }

  @ApiOperation({ summary: 'Salvar/atualizar conta fixa no tenant', description: 'Cria ou updates uma conta fixa no tenant ativo.' })
  @ApiHeader({ name: 'X-Tenant-ID', required: true, description: 'ID do Tenant (casa) ativo', example: 'd3b07384-d113-4c4c-a110-230c45aa835b' })
  @ApiOkResponse({ description: 'Conta fixa salva com sucesso', type: ContaFixaDto })
  @Post('contas-fixas')
  async salvarContaFixa(@Headers('x-tenant-id') tenantId: string, @Body() contaFixaDto: ContaFixaDto) {
    if (!tenantId) {
      throw new BadRequestException('O cabeçalho x-tenant-id é obrigatório.');
    }
    return this.financeiroService.salvarContaFixa(tenantId, contaFixaDto);
  }

  @ApiOperation({ summary: 'Excluir uma conta fixa', description: 'Exclui uma conta fixa cadastrada no tenant ativo.' })
  @ApiHeader({ name: 'X-Tenant-ID', required: true, description: 'ID do Tenant (casa) ativo', example: 'd3b07384-d113-4c4c-a110-230c45aa835b' })
  @ApiOkResponse({ description: 'Conta fixa excluída com sucesso' })
  @Delete('contas-fixas/:id')
  async excluirContaFixa(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string) {
    if (!tenantId) {
      throw new BadRequestException('O cabeçalho x-tenant-id é obrigatório.');
    }
    return this.financeiroService.excluirContaFixa(tenantId, id);
  }

  // --- ACERTOS ---
  @ApiOperation({ summary: 'Listar acertos do tenant', description: 'Retorna todos os acertos de membros registrados no tenant ativo.' })
  @ApiHeader({ name: 'X-Tenant-ID', required: true, description: 'ID do Tenant (casa) ativo', example: 'd3b07384-d113-4c4c-a110-230c45aa835b' })
  @ApiOkResponse({ description: 'Acertos listados com sucesso', type: [AcertoDto] })
  @Get('acertos')
  async listarAcertos(@Headers('x-tenant-id') tenantId: string) {
    if (!tenantId) {
      throw new BadRequestException('O cabeçalho x-tenant-id é obrigatório.');
    }
    return this.financeiroService.listarAcertos(tenantId);
  }

  @ApiOperation({ summary: 'Listar antecipacoes de fatura do tenant', description: 'Retorna todas as antecipacoes registradas no tenant ativo.' })
  @ApiHeader({ name: 'X-Tenant-ID', required: true, description: 'ID do Tenant (casa) ativo', example: 'd3b07384-d113-4c4c-a110-230c45aa835b' })
  @ApiOkResponse({ description: 'Antecipacoes de fatura listadas com sucesso', type: [AntecipacaoFaturaDto] })
  @ApiBadRequestResponse({ description: 'Cabecalho x-tenant-id ausente ou invalido' })
  @Get('antecipacoes-fatura')
  async listarAntecipacoesFatura(@Headers('x-tenant-id') tenantId: string) {
    if (!tenantId) throw new BadRequestException('O cabecalho x-tenant-id e obrigatorio.');
    return this.financeiroService.listarAntecipacoesFatura(tenantId);
  }

  @ApiOperation({ summary: 'Salvar/atualizar uma antecipacao de fatura no tenant', description: 'Cria ou atualiza uma antecipacao de fatura no tenant ativo.' })
  @ApiHeader({ name: 'X-Tenant-ID', required: true, description: 'ID do Tenant (casa) ativo', example: 'd3b07384-d113-4c4c-a110-230c45aa835b' })
  @ApiCreatedResponse({ description: 'Antecipacao de fatura salva com sucesso', type: AntecipacaoFaturaDto })
  @ApiBadRequestResponse({ description: 'Dados de entrada invalidos ou cabecalho x-tenant-id ausente' })
  @Post('antecipacoes-fatura')
  async salvarAntecipacaoFatura(@Headers('x-tenant-id') tenantId: string, @Body() dto: AntecipacaoFaturaDto) {
    if (!tenantId) throw new BadRequestException('O cabecalho x-tenant-id e obrigatorio.');
    return this.financeiroService.salvarAntecipacaoFatura(tenantId, dto);
  }

  @ApiOperation({ summary: 'Excluir uma antecipacao de fatura', description: 'Remove uma antecipacao de fatura especifica do tenant ativo atraves do seu ID.' })
  @ApiHeader({ name: 'X-Tenant-ID', required: true, description: 'ID do Tenant (casa) ativo', example: 'd3b07384-d113-4c4c-a110-230c45aa835b' })
  @ApiOkResponse({ description: 'Antecipacao de fatura excluida com sucesso' })
  @ApiBadRequestResponse({ description: 'Cabecalho x-tenant-id ausente ou invalido' })
  @Delete('antecipacoes-fatura/:id')
  async excluirAntecipacaoFatura(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string) {
    if (!tenantId) throw new BadRequestException('O cabecalho x-tenant-id e obrigatorio.');
    return this.financeiroService.excluirAntecipacaoFatura(tenantId, id);
  }

  @ApiOperation({ summary: 'Salvar/atualizar um acerto no tenant', description: 'Cria ou updates as informações de acertos no tenant ativo.' })
  @ApiHeader({ name: 'X-Tenant-ID', required: true, description: 'ID do Tenant (casa) ativo', example: 'd3b07384-d113-4c4c-a110-230c45aa835b' })
  @ApiOkResponse({ description: 'Acerto salvo com sucesso', type: AcertoDto })
  @Post('acertos')
  async salvarAcerto(@Headers('x-tenant-id') tenantId: string, @Body() acertoDto: AcertoDto) {
    if (!tenantId) {
      throw new BadRequestException('O cabeçalho x-tenant-id é obrigatório.');
    }
    return this.financeiroService.salvarAcerto(tenantId, acertoDto);
  }
}
