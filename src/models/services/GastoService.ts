import type { IGastoRepository } from '../repositories/IGastoRepository'
import type { IFaturaRepository } from '../repositories/IFaturaRepository'
import type { ICartaoRepository } from '../repositories/ICartaoRepository'
import { Gasto, type GastoProps, type PaymentMethod, type SplitMode } from '../entities/Gasto'
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
    const periodo = await this.resolverPeriodoDoGasto(original)
    if (!periodo) throw new Error(`Fatura ou período original não encontrado para o gasto ${original.id}`)

    // Create replacement gasto(s) FIRST. If this fails, nothing is lost.
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
      settlementDetails: original.settlementDetails
        ? {
            fromMemberId: original.settlementDetails.fromMemberId,
            toMemberId: original.settlementDetails.toMemberId,
            method: original.settlementDetails.method,
          }
        : undefined
    })

    // Delete originals AFTER successful recreation.
    // If this fails, duplicates exist — the caller should sync to detect them.
    try {
      if (idsParaExcluir.length === 1) await this.gastoRepo.excluir(idsParaExcluir[0])
      else await this.gastoRepo.excluirMuitos(idsParaExcluir)
    } catch (deleteErr) {
      throw new Error(
        `Gasto recriado com sucesso, mas falha ao excluir ${idsParaExcluir.length} gasto(s) original(is): ${(deleteErr as Error).message}. ` +
        `Recarregue a página para evitar duplicatas. IDs: ${idsParaExcluir.join(', ')}`,
        { cause: deleteErr }
      )
    }
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
      const faturaAtual = gasto.faturaId ? (faturasPersistidas.find(f => f.id === gasto.faturaId) ?? null) : null
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

    if (faturasParaSalvar.length > 0) {
      await this.faturaRepo.salvarMuitas(faturasParaSalvar)

      // Re-fetch faturas after saving to resolve composite IDs (cartaoId-mes-ano) to
      // real backend-generated UUIDs. Using in-memory objects from faturasParaSalvar
      // would keep frontend-generated composite IDs that don't match the DB rows.
      await this.remapearIdsCompostosDeFatura(gastosParaSalvar)
    }

    await this.atualizarGastosEmLote(gastosParaSalvar)
  }

  private async atualizarGastoIndividual(
    original: Gasto,
    dados: AtualizarGastoDados,
    cartaoResolvido: CartaoResolvido
  ): Promise<void> {
    let faturaId: string | null = original.faturaId

    if (cartaoResolvido.cartaoId) {
      const periodo = await this.resolverPeriodoDoGasto(original)

      if (periodo) {
        const novaFatura = await this.faturaRepo.assegurarObterOuCriarFatura(
          cartaoResolvido.cartaoId,
          periodo.mes,
          periodo.ano,
          cartaoResolvido.responsavelFaturaId
        )
        faturaId = novaFatura.id
      }
    } else {
      faturaId = null
    }

    const atualizado = this.criarGastoAtualizado(
      original,
      dados,
      faturaId,
      cartaoResolvido.cardOwner,
      dados.installments,
      dados.installments
    )
    await this.gastoRepo.atualizar(atualizado.id, atualizado)
  }

  private gastoToProps(g: Gasto): GastoProps {
    return {
      id: g.id, faturaId: g.faturaId, descricao: g.descricao,
      valorTotal: g.valorTotal, compradorId: g.compradorId, divisoes: g.divisoes,
      installments: g.installments, totalInstallments: g.totalInstallments,
      isLoan: g.isLoan, borrowerId: g.borrowerId, recurringBillId: g.recurringBillId,
      isSettlement: g.isSettlement, settlementDetails: g.settlementDetails,
      method: g.method, cardOwner: g.cardOwner, grupoParcelasId: g.grupoParcelasId,
      isPrivate: g.isPrivate, splitMode: g.splitMode,
    }
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
      ...this.gastoToProps(original),
      faturaId,
      descricao: dados.descricao,
      valorTotal: dados.valorTotal,
      compradorId: dados.compradorId,
      divisoes: dados.divisoes,
      method: dados.method,
      cardOwner,
      installments,
      totalInstallments,
    })
  }

  async removerAssociacaoContaFixa(contaFixaId: string): Promise<void> {
    const gastosAssociados = (await this.gastoRepo.listarTodos()).filter(g => g.recurringBillId === contaFixaId)
    if (gastosAssociados.length === 0) return

    // Use PUT (atualizar) for existing gastos — salvarMuitos uses POST /batch
    // which would create duplicates instead of updating.
    await Promise.all(gastosAssociados.map(g =>
      this.gastoRepo.atualizar(g.id, this.desassociarContaFixa(g))
    ))
  }

  // ── Helpers extraídos ──────────────────────────────────────────

  /**
   * Resolve o período (mês/ano) de um gasto a partir da fatura associada,
   * ou pela data de criação como fallback.
   */
  private async resolverPeriodoDoGasto(original: Gasto): Promise<{ mes: number; ano: number } | undefined> {
    if (original.faturaId) {
      const fatura = await this.faturaRepo.buscarPorId(original.faturaId)
      return fatura?.periodo
    }
    return { mes: original.createdAt.getMonth() + 1, ano: original.createdAt.getFullYear() }
  }

  /**
   * Substitui IDs compostos de fatura (cartaoId-mes-ano) pelos UUIDs reais
   * gerados pelo backend após a persistência.
   */
  private async remapearIdsCompostosDeFatura(gastos: Gasto[]): Promise<void> {
    const faturasReais = await this.faturaRepo.listarTodas()
    const idRealPorComposto = new Map<string, string>()
    for (const f of faturasReais) {
      const chave = `${f.cartaoId}-${f.periodo.mes}-${f.periodo.ano}`
      idRealPorComposto.set(chave, f.id)
    }
    // Composite IDs have the format: <cartao-uuid>-<mes>-<ano> (3 segments, last two are numbers).
    const compositoPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-\d{1,2}-\d{4}$/
    for (const g of gastos) {
      if (g.faturaId && compositoPattern.test(g.faturaId)) {
        const realId = idRealPorComposto.get(g.faturaId)
        if (realId) {
          ;(g as { faturaId: string | null }).faturaId = realId
        }
      }
    }
  }

  /** Atualiza múltiplos gastos individualmente, acumulando erros. */
  private async atualizarGastosEmLote(gastos: Gasto[]): Promise<void> {
    if (gastos.length === 0) return
    const erros: { id: string; message: string }[] = []
    for (const g of gastos) {
      try {
        await this.gastoRepo.atualizar(g.id, g)
      } catch (e) {
        erros.push({ id: g.id, message: (e as Error).message })
      }
    }
    if (erros.length > 0) {
      const detalhes = erros.map(e => `${e.id}: ${e.message}`).join('; ')
      throw new Error(`Falha ao atualizar ${erros.length} de ${gastos.length} parcelas: ${detalhes}`)
    }
  }

  private desassociarContaFixa(g: Gasto): Gasto {
    return new Gasto({ ...this.gastoToProps(g), recurringBillId: null })
  }
}
