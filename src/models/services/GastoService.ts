import type { IGastoRepository } from '../repositories/IGastoRepository'
import type { IFaturaRepository } from '../repositories/IFaturaRepository'
import type { ICartaoRepository } from '../repositories/ICartaoRepository'
import { Gasto, type PaymentMethod, type SplitMode } from '../entities/Gasto'
import { Dinheiro } from '../entities/Dinheiro'
import { DivisaoDeGasto } from '../entities/DivisaoDeGasto'
import type { Fatura } from '../entities/Fatura'
import { LancamentoService } from './LancamentoService'
import { resolverCartao, type CartaoResolvido } from './CartaoResolver'

export interface LancarGastoInput {
  flow: 'expense' | 'loan' | 'settlement'
  paymentMethod: PaymentMethod
  compradorId: string
  valor: number
  descricao: string
  divisoes: DivisaoDeGasto[]
  installments: number
  cardOwnerId: string | null
  borrowerId: string | null
  periodo: { mes: number; ano: number }
  isPrivate?: boolean
  splitMode: SplitMode
  settlementDetails?: {
    fromMemberId: string
    toMemberId: string
    method: 'pix' | 'cash'
  }
}

type AtualizarGastoDados = {
  descricao: string
  valorTotal: Dinheiro
  compradorId: string
  method: 'pix' | 'card'
  cardOwner: string | null
  divisoes: DivisaoDeGasto[]
  installments: number
}

export class GastoService {
  constructor(
    private gastoRepo: IGastoRepository,
    private faturaRepo: IFaturaRepository,
    private cartaoRepo: ICartaoRepository,
    private lancamentoService: LancamentoService = new LancamentoService(gastoRepo, faturaRepo, cartaoRepo)
  ) {}

  async lancarGastoOuEmprestimo(dados: LancarGastoInput): Promise<void> {
    await this.lancamentoService.lancarGastoOuEmprestimo(dados)
  }

  async excluirGasto(id: string): Promise<void> {
    await this.gastoRepo.excluir(id)
  }

  async lancarGastoContaFixa(dados: {
    faturaId: string
    conta: { id: string; name: string }
    valorCentavos: number
    compradorId: string
    participantes: string[]
  }): Promise<void> {
    await this.lancamentoService.lancarGastoContaFixa(dados)
  }

  async atualizarGastoCompleto(gastoId: string, dados: AtualizarGastoDados): Promise<void> {
    const original = await this.gastoRepo.buscarPorId(gastoId)
    if (!original) throw new Error('Gasto não encontrado')

    const todosCartoes = (await this.cartaoRepo.listarTodos()) || []
    const cartaoResolvido = resolverCartao(
      dados.method,
      dados.cardOwner,
      dados.compradorId,
      todosCartoes
    )

    if (original.grupoParcelasId) {
      await this.atualizarGrupoParcelas(original, dados, cartaoResolvido)
      return
    }

    if (dados.method === 'card' && dados.installments > 1) {
      await this.relancarGasto(original, [original.id], dados)
      return
    }

    await this.atualizarGastoIndividual(original, dados, cartaoResolvido)
  }

  private async atualizarGrupoParcelas(
    original: Gasto,
    dados: AtualizarGastoDados,
    cartaoResolvido: CartaoResolvido
  ): Promise<void> {
    const gastosDoGrupo = (await this.gastoRepo.listarTodos())
      .filter(g => g.grupoParcelasId === original.grupoParcelasId)

    const estruturaMudou = original.totalInstallments !== dados.installments || original.method !== dados.method
    if (estruturaMudou) {
      const primeiraParcela = gastosDoGrupo.reduce(
        (anterior, atual) => atual.installments > anterior.installments ? atual : anterior,
        gastosDoGrupo[0] || original
      )
      await this.relancarGasto(primeiraParcela, gastosDoGrupo.map(g => g.id), dados)
      return
    }

    await this.salvarParcelasAtualizadas(gastosDoGrupo, dados, cartaoResolvido)
  }

  private async relancarGasto(original: Gasto, idsParaExcluir: string[], dados: AtualizarGastoDados): Promise<void> {
    const periodo = original.faturaId
      ? (await this.faturaRepo.buscarPorId(original.faturaId))?.periodo
      : { mes: original.createdAt.getMonth() + 1, ano: original.createdAt.getFullYear() }

    if (!periodo) throw new Error(`Fatura ou período original não encontrado para o gasto ${original.id}`)

    if (idsParaExcluir.length === 1) await this.gastoRepo.excluir(idsParaExcluir[0])
    else await this.gastoRepo.excluirMuitos(idsParaExcluir)

    await this.lancarGastoOuEmprestimo({
      flow: original.isSettlement ? 'settlement' : original.isLoan ? 'loan' : 'expense',
      paymentMethod: dados.method,
      compradorId: dados.compradorId,
      valor: dados.valorTotal.centavos / 100,
      descricao: dados.descricao,
      divisoes: dados.divisoes,
      installments: dados.installments,
      cardOwnerId: dados.cardOwner,
      borrowerId: original.borrowerId,
      periodo: periodo,
      isPrivate: original.isPrivate,
      splitMode: original.splitMode,
      settlementDetails: original.settlementDetails && original.settlementDetails.method !== 'mutual'
        ? {
            fromMemberId: original.settlementDetails.fromMemberId,
            toMemberId: original.settlementDetails.toMemberId,
            method: original.settlementDetails.method,
          }
        : undefined
    })
  }

  private async salvarParcelasAtualizadas(
    gastos: Gasto[],
    dados: AtualizarGastoDados,
    cartaoResolvido: CartaoResolvido
  ): Promise<void> {
    const faturasParaSalvar: Fatura[] = []
    const gastosParaSalvar: Gasto[] = []
    const faturasPersistidas = await this.faturaRepo.listarTodas()

    for (const gasto of gastos) {
      const faturaAtual = gasto.faturaId ? await this.faturaRepo.buscarPorId(gasto.faturaId) : null
      let faturaId = gasto.faturaId
      if (faturaAtual && cartaoResolvido.cartaoId) {
        const novaFatura = await this.lancamentoService.obterOuCriarFaturaMemoria(
          cartaoResolvido.cartaoId,
          faturaAtual.periodo.mes,
          faturaAtual.periodo.ano,
          cartaoResolvido.responsavelFaturaId,
          faturasParaSalvar,
          faturasPersistidas
        )
        faturaId = novaFatura.id
      }
      gastosParaSalvar.push(this.criarGastoAtualizado(
        gasto,
        dados,
        faturaId,
        cartaoResolvido.cardOwner,
        gasto.installments,
        gasto.totalInstallments
      ))
    }

    if (faturasParaSalvar.length > 0) await this.faturaRepo.salvarMuitas(faturasParaSalvar)
    if (gastosParaSalvar.length > 0) await this.gastoRepo.salvarMuitos(gastosParaSalvar)
  }

  private async atualizarGastoIndividual(
    original: Gasto,
    dados: AtualizarGastoDados,
    cartaoResolvido: CartaoResolvido
  ): Promise<void> {
    const faturaOriginal = original.faturaId ? await this.faturaRepo.buscarPorId(original.faturaId) : null
    let faturaId = original.faturaId
    if (faturaOriginal && cartaoResolvido.cartaoId) {
      const novaFatura = await this.faturaRepo.assegurarObterOuCriarFatura(
        cartaoResolvido.cartaoId,
        faturaOriginal.periodo.mes,
        faturaOriginal.periodo.ano,
        cartaoResolvido.responsavelFaturaId
      )
      faturaId = novaFatura.id
    } else {
      faturaId = null
    }

    await this.gastoRepo.salvar(this.criarGastoAtualizado(
      original,
      dados,
      faturaId,
      cartaoResolvido.cardOwner,
      dados.installments,
      dados.installments
    ))
  }

  private criarGastoAtualizado(
    original: Gasto,
    dados: AtualizarGastoDados,
    faturaId: string | null,
    cardOwner: string | null,
    installments: number,
    totalInstallments: number
  ): Gasto {
    return new Gasto({
      id: original.id,
      faturaId,
      descricao: dados.descricao,
      valorTotal: dados.valorTotal,
      compradorId: dados.compradorId,
      divisoes: dados.divisoes,
      method: dados.method,
      cardOwner,
      installments,
      totalInstallments,
      grupoParcelasId: original.grupoParcelasId,
      isLoan: original.isLoan,
      borrowerId: original.borrowerId,
      recurringBillId: original.recurringBillId,
      isSettlement: original.isSettlement,
      settlementDetails: original.settlementDetails,
      isPrivate: original.isPrivate,
      splitMode: original.splitMode
    })
  }

  async removerAssociacaoContaFixa(contaFixaId: string): Promise<void> {
    const gastosAssociados = (await this.gastoRepo.listarTodos()).filter(g => g.recurringBillId === contaFixaId)
    if (gastosAssociados.length === 0) return

    const gastosParaSalvar = gastosAssociados.map(g => new Gasto({
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
      grupoParcelasId: g.grupoParcelasId,
      isPrivate: g.isPrivate,
      splitMode: g.splitMode
    }))

    await this.gastoRepo.salvarMuitos(gastosParaSalvar)
  }
}
