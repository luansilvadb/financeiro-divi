import type { IGastoRepository } from '../repositories/IGastoRepository'
import type { IFaturaRepository } from '../repositories/IFaturaRepository'
import type { ICartaoRepository } from '../repositories/ICartaoRepository'
import type { IAcertoMembroRepository } from '../repositories/IAcertoMembroRepository'
import type { IMembroRepository } from '../repositories/IMembroRepository'
import { Gasto } from '../entities/Gasto'
import { Dinheiro } from '../entities/Dinheiro'
import { DivisaoDeGasto } from '../entities/DivisaoDeGasto'
import { Fatura } from '../entities/Fatura'
import type { Cartao } from '../entities/Cartao'
import type { IGastoService, LancarGastoInput } from './IGastoService'
import { LancamentoService, type ILancamentoService } from './LancamentoService'
import { EstornoService, type IEstornoService } from './EstornoService'

type AtualizarGastoDados = {
  descricao: string
  valorTotal: Dinheiro
  compradorId: string
  method: 'pix' | 'card'
  cardOwner: string | null
  divisoes: DivisaoDeGasto[]
  installments: number
}

type StatusFaturaGasto = { gasto: Gasto; fatura: Fatura | null }

export class GastoService implements IGastoService {
  private lancamentoService: ILancamentoService
  private estornoService: IEstornoService

  constructor(
    private gastoRepo: IGastoRepository,
    private faturaRepo: IFaturaRepository,
    private cartaoRepo: ICartaoRepository,
    membroRepo?: IMembroRepository,
    private acertoRepo?: IAcertoMembroRepository,
    lancamentoService?: ILancamentoService,
    estornoService?: IEstornoService
  ) {
    this.lancamentoService = lancamentoService || new LancamentoService(gastoRepo, faturaRepo, cartaoRepo, membroRepo)
    this.estornoService = estornoService || new EstornoService(gastoRepo, faturaRepo, acertoRepo)
  }

  async lancarGastoOuEmprestimo(dados: LancarGastoInput): Promise<void> {
    return this.lancamentoService.lancarGastoOuEmprestimo(dados)
  }

  async excluirGasto(id: string): Promise<void> {
    return this.estornoService.excluirGasto(id)
  }

  async registrarAcertoNetting(dados: {
    faturaId: string
    descricao: string
    valor: number
    fromMemberId: string
    toMemberId: string
    method: string
  }): Promise<void> {
    await this.gerarGastoNetting(dados)
    
    if (this.acertoRepo) {
      const faturasFechadas = await this.obterFaturasParaBaixa(dados.faturaId)
      await this.processarBaixaDeAcertos(faturasFechadas, dados)
    }
  }

  private async gerarGastoNetting(dados: {
    faturaId: string
    descricao: string
    valor: number
    fromMemberId: string
    toMemberId: string
    method: string
  }): Promise<void> {
    const total = Dinheiro.deReais(dados.valor)
    const deterministicId = `netting-${dados.faturaId}-${dados.fromMemberId}-${dados.toMemberId}-${dados.valor}`
    const acertoGasto = new Gasto({
      id: deterministicId,
      faturaId: dados.faturaId,
      descricao: dados.descricao,
      valorTotal: total,
      compradorId: dados.fromMemberId,
      divisoes: [new DivisaoDeGasto(dados.toMemberId, total)],
      isSettlement: true,
      settlementDetails: {
        fromMemberId: dados.fromMemberId,
        toMemberId: dados.toMemberId,
        method: dados.method as 'pix' | 'cash' | 'mutual'
      },
      installments: 1,
      isLoan: false
    })
    await this.gastoRepo.salvar(acertoGasto)
  }

  private async obterFaturasParaBaixa(faturaId: string): Promise<Fatura[]> {
    let mes: number | undefined
    let ano: number | undefined

    const faturaAtual = await this.faturaRepo.buscarPorId(faturaId)
    if (faturaAtual) {
      mes = faturaAtual.periodo.mes
      ano = faturaAtual.periodo.ano
    } else {
      const match = faturaId.match(/(?:.*-)?(\d+)-(\d+)$/)
      if (match) {
        mes = parseInt(match[1], 10)
        ano = parseInt(match[2], 10)
      }
    }

    if (mes === undefined || ano === undefined) {
      return []
    }

    let anteriorMes = mes - 1
    let anteriorAno = ano
    if (anteriorMes < 1) {
      anteriorMes = 12
      anteriorAno -= 1
    }

    const todasFaturas = await this.faturaRepo.listarTodas()
    return todasFaturas.filter(
      f => (
        (f.periodo.mes === anteriorMes && f.periodo.ano === anteriorAno) || 
        (f.periodo.mes === mes && f.periodo.ano === ano)
      ) && f.status === 'FECHADA'
    )
  }

  private async processarBaixaDeAcertos(
    faturasFechadas: Fatura[],
    dados: { valor: number, fromMemberId: string, toMemberId: string }
  ): Promise<void> {
    if (!this.acertoRepo) return

    const total = Dinheiro.deReais(dados.valor)
    let restPagadorCentavos = total.centavos
    let restRecebedorCentavos = total.centavos

    for (const fatTarget of faturasFechadas) {
      const acertosMembro = await this.acertoRepo.buscarPorFatura(fatTarget.id)

      const acertoPagador = acertosMembro.find(a => a.membroId === dados.fromMemberId && a.tipo === 'MEMBRO_PAGA' && !a.pago)
      restPagadorCentavos = await this.abaterDividaAcerto(acertoPagador, restPagadorCentavos)

      const acertoRecebedor = acertosMembro.find(a => a.membroId === dados.toMemberId && a.tipo === 'RESPONSAVEL_PAGA' && !a.pago)
      restRecebedorCentavos = await this.abaterDividaAcerto(acertoRecebedor, restRecebedorCentavos)

      const acertosAtualizados = await this.acertoRepo.buscarPorFatura(fatTarget.id)
      const todosQuitados = acertosAtualizados.every(a => a.pago)
      if (todosQuitados && fatTarget.dataPagamentoBanco && fatTarget.status !== 'ACERTADA') {
        const acertada = fatTarget.marcarAcertada()
        await this.faturaRepo.salvar(acertada)
      }
    }
  }

  private async abaterDividaAcerto(acerto: any, restCentavos: number): Promise<number> {
    if (acerto && restCentavos > 0) {
      const faltaPagarCentavos = acerto.valorAcerto.centavos - acerto.valorPago.centavos
      if (faltaPagarCentavos > 0) {
        const valorAbateCentavos = Math.min(restCentavos, faltaPagarCentavos)
        acerto.registrarReembolso(Dinheiro.deCentavos(valorAbateCentavos), new Date())
        await this.acertoRepo!.salvar(acerto)
        return restCentavos - valorAbateCentavos
      }
    }
    return restCentavos
  }

  async lancarGastoContaFixa(dados: {
    faturaId: string
    conta: { id: string; name: string }
    valorCentavos: number
    compradorId: string
    participantes: string[]
  }): Promise<void> {
    return this.lancamentoService.lancarGastoContaFixa(dados)
  }

  async atualizarGastoCompleto(
    gastoId: string,
    dados: AtualizarGastoDados
  ): Promise<void> {
    await this.validarMembrosAtivosParaAtualizacao(dados)

    const original = await this.validarEObterOriginal(gastoId)
    await this.validarNettingNoPeriodo(original)

    const periodosOriginal = await this.obterPeriodosDoGasto(original)

    const todosCartoes = (await this.cartaoRepo.listarTodos()) || []
    const { cartaoReal, resolvedCardOwner } = this.resolverCartaoEResponsavel(dados.method, dados.cardOwner, todosCartoes)

    await this.executarAtualizacaoPorTipo(gastoId, original, dados, resolvedCardOwner, cartaoReal, todosCartoes)

    await this.limparNettingDosPeriodosAfetados(gastoId, periodosOriginal)
  }

  private async validarMembrosAtivosParaAtualizacao(dados: AtualizarGastoDados): Promise<void> {
    const membrosEnvolvidos = [dados.compradorId, ...dados.divisoes.map(d => d.membroId)]
    const unicos = [...new Set(membrosEnvolvidos)]
    await this.lancamentoService.validarMembrosAtivos(unicos)
  }

  private async executarAtualizacaoPorTipo(
    gastoId: string,
    original: Gasto,
    dados: AtualizarGastoDados,
    resolvedCardOwner: string | null,
    cartaoReal: Cartao | undefined,
    todosCartoes: Cartao[]
  ): Promise<void> {
    if (original.grupoParcelasId) {
      await this.atualizarGastoGrupoParcelas(gastoId, original, dados, resolvedCardOwner, cartaoReal, todosCartoes)
    } else if (dados.method === 'card' && dados.installments > 1) {
      await this.atualizarGastoSimplesParaParcelado(gastoId, original, dados)
    } else {
      await this.atualizarGastoSimplesParaSimples(original, dados, resolvedCardOwner, cartaoReal, todosCartoes)
    }
  }

  private async limparNettingDosPeriodosAfetados(gastoId: string, periodosOriginal: { mes: number; ano: number }[]): Promise<void> {
    const atualizado = await this.gastoRepo.buscarPorId(gastoId)
    const periodosDepois = atualizado ? await this.obterPeriodosDoGasto(atualizado) : []

    const todosPeriodos = [...periodosOriginal, ...periodosDepois]
    const periodosUnicos = todosPeriodos.filter((p, index, self) =>
      self.findIndex(item => item.mes === p.mes && item.ano === p.ano) === index
    )

    for (const p of periodosUnicos) {
      await this.estornoService.limparNettingDoPeriodo(p.mes, p.ano)
    }
  }

  private async obterPeriodosDoGasto(gasto: Gasto): Promise<{ mes: number; ano: number }[]> {
    const periodos: { mes: number; ano: number }[] = []
    
    const gastosParaProcessar = gasto.grupoParcelasId 
      ? (await this.gastoRepo.listarTodos()).filter(g => g.grupoParcelasId === gasto.grupoParcelasId)
      : [gasto]

    for (const g of gastosParaProcessar) {
      const fat = await this.faturaRepo.buscarPorId(g.faturaId)
      if (fat) {
        periodos.push({ mes: fat.periodo.mes, ano: fat.periodo.ano })
      }
    }
    return periodos
  }

  private async validarEObterOriginal(gastoId: string): Promise<Gasto> {
    const original = await this.gastoRepo.buscarPorId(gastoId)
    if (!original) throw new Error('Gasto não encontrado')

    if (original.grupoParcelasId && original.installments !== original.totalInstallments) {
      throw new Error(
        'Este lançamento faz parte de um parcelamento. Para editá-lo, acesse a primeira parcela no período de origem do gasto.'
      )
    }
    return original
  }

  private async validarNettingNoPeriodo(original: Gasto): Promise<void> {
    if (original.isSettlement) return

    let faturaIds: string[]
    if (original.grupoParcelasId) {
      const todos = await this.gastoRepo.listarTodos()
      const grupo = todos.filter(g => g.grupoParcelasId === original.grupoParcelasId)
      faturaIds = grupo.map(g => g.faturaId)

      const temNettingNoPeriodo = todos.some(
        g => faturaIds.includes(g.faturaId) && g.isSettlement
      )
      if (temNettingNoPeriodo) {
        throw new Error(
          'Não é possível alterar gastos comuns neste período pois já existem acertos de contas (Pix) confirmados. Estorne os acertos primeiro.'
        )
      }
    } else {
      faturaIds = [original.faturaId]
      const todosGastos = (await this.gastoRepo.listarTodos()) || []
      const temNettingNoPeriodo = todosGastos.some(
        g => faturaIds.includes(g.faturaId) && g.isSettlement
      )
      if (temNettingNoPeriodo) {
        throw new Error(
          'Não é possível alterar gastos comuns neste período pois já existem acertos de contas (Pix) confirmados. Estorne os acertos primeiro.'
        )
      }
    }
  }

  private resolverCartaoEResponsavel(
    method: 'pix' | 'card',
    cardOwner: string | null,
    todosCartoes: Cartao[]
  ): { cartaoReal: Cartao | undefined; resolvedCardOwner: string | null } {
    let cartaoReal: Cartao | undefined = undefined
    if (method === 'card' && cardOwner) {
      cartaoReal = todosCartoes.find(c => c.id === cardOwner || c.responsavelPadraoId === cardOwner)
    }
    const resolvedCardOwner = cartaoReal ? cartaoReal.responsavelPadraoId : null
    return { cartaoReal, resolvedCardOwner }
  }

  private async atualizarGastoGrupoParcelas(
    gastoId: string,
    original: Gasto,
    dados: AtualizarGastoDados,
    resolvedCardOwner: string | null,
    cartaoReal: Cartao | undefined,
    todosCartoes: Cartao[]
  ): Promise<void> {
    const todosGastos = await this.gastoRepo.listarTodos()
    const gastosDoGrupo = todosGastos.filter(g => g.grupoParcelasId === original.grupoParcelasId)

    const statusFaturas = await Promise.all(
      gastosDoGrupo.map(async g => {
        const fat = await this.faturaRepo.buscarPorId(g.faturaId)
        return { gasto: g, fatura: fat }
      })
    )

    if (original.totalInstallments !== dados.installments || original.method !== dados.method) {
      await this.relancarGrupoParcelas(gastoId, original, dados, gastosDoGrupo)
    } else {
      await this.atualizarParcelasAbertas(statusFaturas, dados, resolvedCardOwner, cartaoReal, todosCartoes)
    }
  }

  private async relancarGrupoParcelas(
    gastoId: string,
    original: Gasto,
    dados: AtualizarGastoDados,
    gastosDoGrupo: Gasto[]
  ): Promise<void> {
    const primeiraParcela = gastosDoGrupo.reduce((prev, curr) => curr.installments > prev.installments ? curr : prev, gastosDoGrupo[0] || original)
    const faturaOriginal = await this.faturaRepo.buscarPorId(primeiraParcela.faturaId)
    if (faturaOriginal && typeof faturaOriginal.validarOperacaoPermitida === 'function') {
      faturaOriginal.validarOperacaoPermitida()
    }

    await this.gastoRepo.excluirMuitos(gastosDoGrupo.map(g => g.id))

    if (!faturaOriginal) throw new Error(`Fatura original não encontrada para o gasto ${gastoId}`)
    const periodoInicial = faturaOriginal.periodo
    await this.lancarGastoOuEmprestimo({
      flow: original.isLoan ? 'loan' : 'expense',
      paymentMethod: dados.method,
      compradorId: dados.compradorId,
      valor: dados.valorTotal.centavos / 100,
      descricao: dados.descricao,
      divisoes: dados.divisoes,
      installments: dados.installments,
      cardOwnerId: dados.cardOwner,
      borrowerId: original.borrowerId,
      periodo: periodoInicial
    })
  }

  private async atualizarParcelasAbertas(
    statusFaturas: StatusFaturaGasto[],
    dados: AtualizarGastoDados,
    resolvedCardOwner: string | null,
    cartaoReal: Cartao | undefined,
    todosCartoes: Cartao[]
  ): Promise<void> {
    const faturasParaSalvar: Fatura[] = []
    const gastosParaSalvar: Gasto[] = []
    const todasFaturasPersistidas = await this.faturaRepo.listarTodas()

    for (const sf of statusFaturas) {
      const g = sf.gasto
      let novaFaturaId = g.faturaId

      if (sf.fatura) {
        const cartaoId = (dados.method === 'card')
          ? (cartaoReal ? cartaoReal.id : (todosCartoes.length > 0 ? todosCartoes[0].id : 'PIX_DEFAULT_ID'))
          : 'PIX_DEFAULT_ID'
        const responsavelFaturaId = cartaoReal ? cartaoReal.responsavelPadraoId : dados.compradorId
        const novaFatura = await this.lancamentoService.obterOuCriarFaturaMemoria(cartaoId, sf.fatura.periodo.mes, sf.fatura.periodo.ano, responsavelFaturaId, faturasParaSalvar, todasFaturasPersistidas)
        if (novaFatura && typeof novaFatura.validarOperacaoPermitida === 'function') {
          novaFatura.validarOperacaoPermitida()
        }
        novaFaturaId = novaFatura.id
      }

      const novoG = new Gasto({
        id: g.id,
        faturaId: novaFaturaId,
        descricao: dados.descricao,
        valorTotal: dados.valorTotal,
        compradorId: dados.compradorId,
        divisoes: dados.divisoes,
        method: dados.method,
        cardOwner: resolvedCardOwner,
        installments: g.installments,
        totalInstallments: g.totalInstallments,
        grupoParcelasId: g.grupoParcelasId,
        isLoan: g.isLoan,
        borrowerId: g.borrowerId,
        recurringBillId: g.recurringBillId,
        isSettlement: g.isSettlement,
        settlementDetails: g.settlementDetails
      })
      gastosParaSalvar.push(novoG)
    }

    if (faturasParaSalvar.length > 0) {
      await this.faturaRepo.salvarMuitas(faturasParaSalvar)
    }
    if (gastosParaSalvar.length > 0) {
      await this.gastoRepo.salvarMuitos(gastosParaSalvar)
    }
  }

  private async atualizarGastoSimplesParaParcelado(
    gastoId: string,
    original: Gasto,
    dados: AtualizarGastoDados
  ): Promise<void> {
    const faturaOriginal = await this.faturaRepo.buscarPorId(original.faturaId)
    if (faturaOriginal && typeof faturaOriginal.validarOperacaoPermitida === 'function') {
      faturaOriginal.validarOperacaoPermitida()
    }

    await this.gastoRepo.excluir(original.id)

    if (!faturaOriginal) throw new Error(`Fatura original não encontrada para o gasto ${gastoId}`)
    const periodoInicial = faturaOriginal.periodo
    await this.lancarGastoOuEmprestimo({
      flow: original.isLoan ? 'loan' : 'expense',
      paymentMethod: dados.method,
      compradorId: dados.compradorId,
      valor: dados.valorTotal.centavos / 100,
      descricao: dados.descricao,
      divisoes: dados.divisoes,
      installments: dados.installments,
      cardOwnerId: dados.cardOwner,
      borrowerId: original.borrowerId,
      periodo: periodoInicial
    })
  }

  private async atualizarGastoSimplesParaSimples(
    original: Gasto,
    dados: AtualizarGastoDados,
    resolvedCardOwner: string | null,
    cartaoReal: Cartao | undefined,
    todosCartoes: Cartao[]
  ): Promise<void> {
    const faturaOriginal = await this.faturaRepo.buscarPorId(original.faturaId)
    if (faturaOriginal && typeof faturaOriginal.validarOperacaoPermitida === 'function') {
      faturaOriginal.validarOperacaoPermitida()
    }

    let novaFaturaId = original.faturaId
    if (faturaOriginal) {
      const cartaoId = (dados.method === 'card')
        ? (cartaoReal ? cartaoReal.id : (todosCartoes.length > 0 ? todosCartoes[0].id : 'PIX_DEFAULT_ID'))
        : 'PIX_DEFAULT_ID'
      const responsavelFaturaId = cartaoReal ? cartaoReal.responsavelPadraoId : dados.compradorId
      const novaFatura = await this.faturaRepo.assegurarObterOuCriarFatura(cartaoId, faturaOriginal.periodo.mes, faturaOriginal.periodo.ano, responsavelFaturaId)
      if (novaFatura && typeof novaFatura.validarOperacaoPermitida === 'function') {
        novaFatura.validarOperacaoPermitida()
      }
      novaFaturaId = novaFatura.id
    }

    const novoGasto = new Gasto({
      id: original.id,
      faturaId: novaFaturaId,
      descricao: dados.descricao,
      valorTotal: dados.valorTotal,
      compradorId: dados.compradorId,
      divisoes: dados.divisoes,
      method: dados.method,
      cardOwner: resolvedCardOwner,
      installments: dados.installments,
      totalInstallments: dados.installments,
      isLoan: original.isLoan,
      borrowerId: original.borrowerId,
      recurringBillId: original.recurringBillId,
      isSettlement: original.isSettlement,
      settlementDetails: original.settlementDetails
    })

    await this.gastoRepo.salvar(novoGasto)
  }

  async removerAssociacaoContaFixa(contaFixaId: string): Promise<void> {
    const todos = await this.gastoRepo.listarTodos()
    const gastosAssociados = todos.filter(g => g.recurringBillId === contaFixaId)
    for (const g of gastosAssociados) {
      const novoGasto = new Gasto({
        id: g.id,
        faturaId: g.faturaId,
        descricao: g.descricao,
        valorTotal: g.valorTotal,
        compradorId: g.compradorId,
        divisoes: g.divisoes,
        installments: g.installments,
        totalInstallments: g.totalInstallments,
        isLoan: g.isLoan,
        borrowerId: g.borrowerId,
        recurringBillId: null,
        isSettlement: g.isSettlement,
        settlementDetails: g.settlementDetails,
        method: g.method,
        cardOwner: g.cardOwner,
        grupoParcelasId: g.grupoParcelasId
      })
      await this.gastoRepo.salvar(novoGasto)
    }
  }
}
