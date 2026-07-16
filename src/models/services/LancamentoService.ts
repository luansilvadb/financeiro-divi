import type { IGastoRepository } from '../repositories/IGastoRepository'
import type { IFaturaRepository } from '../repositories/IFaturaRepository'
import type { ICartaoRepository } from '../repositories/ICartaoRepository'
import { Gasto } from '../entities/Gasto'
import { Dinheiro } from '../entities/Dinheiro'
import { DivisaoDeGasto } from '../entities/DivisaoDeGasto'
import { Fatura } from '../entities/Fatura'
import type { LancarGastoInput } from './GastoService'
import { resolverCartao } from './CartaoResolver'
import { resolverIdsPorSplit } from '../../shared/utils/resolverFaturaId'

export class LancamentoService {
  constructor(
    private gastoRepo: IGastoRepository,
    private faturaRepo: IFaturaRepository,
    private cartaoRepo: ICartaoRepository
  ) {}

  async lancarGastoOuEmprestimo(dados: LancarGastoInput): Promise<void> {
    this.validarDivisoes(dados.divisoes)

    const total = Dinheiro.deReais(dados.valor)
    const todosCartoes = dados.paymentMethod === 'card'
      ? await this.cartaoRepo.listarTodos()
      : []
    const { cartaoId, cardOwner: resolvedCardOwner, responsavelFaturaId } = resolverCartao(
      dados.paymentMethod,
      dados.cardOwnerId,
      dados.compradorId,
      todosCartoes
    )
    
    const faturaAtiva = cartaoId
      ? await this.faturaRepo.assegurarObterOuCriarFatura(cartaoId, dados.periodo.mes, dados.periodo.ano, responsavelFaturaId)
      : null

    if (dados.flow === 'settlement') {
      await this.processarAcerto(dados, total)
      return
    }
    
    if (dados.paymentMethod === 'card' && dados.installments > 1) {
      await this.processarCompraParcelada(dados, total, resolvedCardOwner, faturaAtiva, responsavelFaturaId)
    } else {
      await this.processarGastoSimples(dados, total, resolvedCardOwner, faturaAtiva)
    }
  }

  private validarDivisoes(divisoes: DivisaoDeGasto[]): void {
    if (!divisoes || divisoes.length === 0) {
      throw new Error('É necessário informar ao menos um participante na divisão.')
    }
    const divisoesInvalidas = divisoes.filter(d => !d.membroId || d.membroId.trim() === '')
    if (divisoesInvalidas.length > 0) {
      throw new Error('Um ou mais participantes da divisão possuem ID inválido.')
    }
  }

  private validateSettlement(dados: LancarGastoInput): void {
    if (!dados.settlementDetails) return

    const { fromMemberId, toMemberId } = dados.settlementDetails
    const involvesExternal = fromMemberId.startsWith('externo:') || toMemberId.startsWith('externo:')

    const invalidations = [
      fromMemberId === toMemberId,
      dados.valor <= 0,
      dados.paymentMethod === 'card',
      dados.installments !== 1,
      involvesExternal && !dados.isPrivate,
    ]

    if (invalidations.some(Boolean)) {
      throw new Error('Dados do acerto são inválidos')
    }
  }

  private async processarAcerto(dados: LancarGastoInput, total: Dinheiro): Promise<void> {
    if (!dados.settlementDetails) {
      throw new Error('Dados do acerto são inválidos')
    }
    this.validateSettlement(dados)

    await this.gastoRepo.salvar(new Gasto({
      id: crypto.randomUUID(),
      faturaId: null,
      descricao: dados.descricao,
      valorTotal: total,
      compradorId: dados.settlementDetails.fromMemberId,
      divisoes: dados.divisoes,
      installments: 1,
      totalInstallments: 1,
      isLoan: false,
      isSettlement: true,
      settlementDetails: dados.settlementDetails,
      method: dados.paymentMethod,
      cardOwner: null,
      grupoParcelasId: null,
      isPrivate: dados.isPrivate || false,
      splitMode: 'custom'
    }))
  }

  private criarPropsParcela(
    dados: LancarGastoInput,
    total: Dinheiro,
    grupoParcelasId: string,
    resolvedCardOwner: string | null,
    faturaId: string,
    installments: number,
    totalInstallments: number,
    divisoes = dados.divisoes,
  ) {
    return {
      id: crypto.randomUUID(),
      faturaId,
      descricao: dados.descricao,
      valorTotal: total,
      compradorId: dados.compradorId,
      divisoes,
      installments,
      totalInstallments,
      isLoan: false,
      method: 'card' as const,
      cardOwner: resolvedCardOwner,
      grupoParcelasId,
      isPrivate: dados.isPrivate || false,
      splitMode: dados.splitMode,
    }
  }

  private async processarCompraParcelada(
    dados: LancarGastoInput,
    total: Dinheiro,
    resolvedCardOwner: string | null,
    faturaAtiva: Fatura | null,
    responsavelFaturaId: string,
  ): Promise<void> {
    if (!faturaAtiva) throw new Error('Não foi possível obter fatura para compra parcelada em cartão')
    const grupoParcelasId = crypto.randomUUID()
    const faturasParaSalvar: Fatura[] = []
    const todasFaturas = await this.faturaRepo.listarTodas()

    const gastosParaSalvar: Gasto[] = [
      new Gasto(this.criarPropsParcela(dados, total, grupoParcelasId, resolvedCardOwner,
        faturaAtiva.id, dados.installments, dados.installments)),
    ]

    for (const periodo of this.gerarPeriodosFuturos(faturaAtiva.periodo, dados.installments - 1)) {
      const faturaFutura = await this.obterOuCriarFaturaMemoria(
        faturaAtiva.cartaoId!, periodo.mes, periodo.ano, responsavelFaturaId, faturasParaSalvar, todasFaturas,
      )
      gastosParaSalvar.push(new Gasto(this.criarPropsParcela(
        dados, total, grupoParcelasId, resolvedCardOwner,
        faturaFutura.id, dados.installments - gastosParaSalvar.length, dados.installments,
        [...dados.divisoes],
      )))
    }

    if (faturasParaSalvar.length > 0) {
      await this.faturaRepo.salvarMuitas(faturasParaSalvar)
      const faturasReais = await this.faturaRepo.listarTodas()
      resolverIdsPorSplit(gastosParaSalvar, faturasReais)
    }
    await this.gastoRepo.salvarMuitos(gastosParaSalvar)
  }

  /** Gera períodos mensais consecutivos a partir de um período inicial. */
  private *gerarPeriodosFuturos(
    inicio: { mes: number; ano: number },
    quantidade: number
  ): Generator<{ mes: number; ano: number }> {
    let { mes, ano } = inicio
    for (let i = 0; i < quantidade; i++) {
      if (++mes > 12) { mes = 1; ano++ }
      yield { mes, ano }
    }
  }

  private async processarGastoSimples(
    dados: LancarGastoInput,
    total: Dinheiro,
    resolvedCardOwner: string | null,
    faturaAtiva: Fatura | null
  ): Promise<void> {
    const descricaoEfetiva = dados.flow === 'loan'
      ? (dados.descricao.trim() || 'Empréstimo Pessoal')
      : dados.descricao

    await this.gastoRepo.salvar(new Gasto({
      id: crypto.randomUUID(),
      faturaId: faturaAtiva?.id ?? null,
      descricao: descricaoEfetiva,
      valorTotal: total,
      compradorId: dados.compradorId,
      divisoes: dados.divisoes,
      installments: dados.installments,
      totalInstallments: dados.installments,
      isLoan: dados.flow === 'loan',
      borrowerId: dados.borrowerId,
      method: dados.paymentMethod,
      cardOwner: resolvedCardOwner,
      grupoParcelasId: null,
      isPrivate: dados.isPrivate || false,
      splitMode: dados.splitMode,
    }))
  }

  async obterOuCriarFaturaMemoria(cartaoId: string, mes: number, ano: number, responsavelId: string, acumuladorMemoria: Fatura[], todasFaturasPersistidas: Fatura[]): Promise<Fatura> {
    const finder = (f: Fatura) => f.cartaoId === cartaoId && f.periodo.mes === mes && f.periodo.ano === ano
    const fatura = todasFaturasPersistidas.find(finder) || acumuladorMemoria.find(finder)
    if (fatura) return fatura

    const novaFatura = new Fatura({ id: `${cartaoId}-${mes}-${ano}`, cartaoId, periodo: { mes, ano }, responsavelId, status: 'ABERTA' })
    acumuladorMemoria.push(novaFatura)
    return novaFatura
  }

  async lancarGastoContaFixa(dados: { faturaId: string | null; conta: { id: string; name: string }; valorCentavos: number; compradorId: string; participantes: string[] }): Promise<void> {
    const total = Dinheiro.deCentavos(dados.valorCentavos)
    const divisoes = dados.participantes.map((membroId, i) => new DivisaoDeGasto(membroId, total.valorNoIndice(dados.participantes.length, i)))
    await this.gastoRepo.salvar(new Gasto({ id: crypto.randomUUID(), faturaId: dados.faturaId, descricao: `Talão: ${dados.conta.name}`, valorTotal: total, compradorId: dados.compradorId, divisoes, recurringBillId: dados.conta.id, installments: 1, isLoan: false, splitMode: 'equal' }))
  }
}
