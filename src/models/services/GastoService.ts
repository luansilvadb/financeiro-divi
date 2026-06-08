import type { IGastoRepository } from '../repositories/IGastoRepository'
import type { IFaturaRepository } from '../repositories/IFaturaRepository'
import type { ICartaoRepository } from '../repositories/ICartaoRepository'
import { Gasto } from '../entities/Gasto'
import { Dinheiro } from '../entities/Dinheiro'
import { DivisaoDeGasto } from '../entities/DivisaoDeGasto'
import type { Fatura } from '../entities/Fatura'
import { LancamentoService } from './LancamentoService'
import { resolverCartao } from './CartaoResolver'

export interface LancarGastoInput {
  flow: 'expense' | 'loan'
  paymentMethod: 'pix' | 'card'
  compradorId: string
  valor: number
  descricao: string
  divisoes: DivisaoDeGasto[]
  installments: number
  cardOwnerId: string | null
  borrowerId: string | null
  periodo: { mes: number; ano: number }
}

export interface NettingInput {
  faturaId: string
  descricao: string
  valor: number
  fromMemberId: string
  toMemberId: string
  method: 'pix' | 'cash'
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

  async registrarAcertoNetting(dados: NettingInput): Promise<void> {
    const total = Dinheiro.deReais(dados.valor)
    await this.gastoRepo.salvar(new Gasto({
      id: `netting-${dados.faturaId}-${dados.fromMemberId}-${dados.toMemberId}-${dados.valor}-${Date.now()}`,
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
    }))
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
    const { cardOwner: resolvedCardOwner } = resolverCartao(
      dados.method,
      dados.cardOwner,
      dados.compradorId,
      todosCartoes
    )

    if (original.grupoParcelasId) {
      const todosGastos = await this.gastoRepo.listarTodos()
      const gastosDoGrupo = todosGastos.filter(g => g.grupoParcelasId === original.grupoParcelasId)
      
      if (original.totalInstallments !== dados.installments || original.method !== dados.method) {
        const primeiraParcela = gastosDoGrupo.reduce((prev, curr) => curr.installments > prev.installments ? curr : prev, gastosDoGrupo[0] || original)
        const faturaOriginal = await this.faturaRepo.buscarPorId(primeiraParcela.faturaId)
        if (!faturaOriginal) throw new Error(`Fatura original não encontrada para o gasto ${gastoId}`)
        
        await this.gastoRepo.excluirMuitos(gastosDoGrupo.map(g => g.id))
        
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
          periodo: faturaOriginal.periodo
        })
      } else {
        const faturasParaSalvar: Fatura[] = []
        const gastosParaSalvar: Gasto[] = []
        const todasFaturasPersistidas = await this.faturaRepo.listarTodas()

        for (const g of gastosDoGrupo) {
          let novaFaturaId = g.faturaId
          const fat = await this.faturaRepo.buscarPorId(novaFaturaId)
          if (fat) {
            const { cartaoId, responsavelFaturaId } = resolverCartao(
              dados.method,
              dados.cardOwner,
              dados.compradorId,
              todosCartoes
            )
            const novaFatura = await this.lancamentoService.obterOuCriarFaturaMemoria(cartaoId, fat.periodo.mes, fat.periodo.ano, responsavelFaturaId, faturasParaSalvar, todasFaturasPersistidas)
            novaFaturaId = novaFatura.id
          }

          gastosParaSalvar.push(new Gasto({
            id: g.id, faturaId: novaFaturaId, descricao: dados.descricao, valorTotal: dados.valorTotal, compradorId: dados.compradorId, divisoes: dados.divisoes, method: dados.method, cardOwner: resolvedCardOwner, installments: g.installments, totalInstallments: g.totalInstallments, grupoParcelasId: g.grupoParcelasId, isLoan: g.isLoan, borrowerId: g.borrowerId, recurringBillId: g.recurringBillId, isSettlement: g.isSettlement, settlementDetails: g.settlementDetails
          }))
        }
        if (faturasParaSalvar.length > 0) await this.faturaRepo.salvarMuitas(faturasParaSalvar)
        if (gastosParaSalvar.length > 0) await this.gastoRepo.salvarMuitos(gastosParaSalvar)
      }
    } else if (dados.method === 'card' && dados.installments > 1) {
      const faturaOriginal = await this.faturaRepo.buscarPorId(original.faturaId)
      if (!faturaOriginal) throw new Error(`Fatura original não encontrada para o gasto ${gastoId}`)
      
      await this.gastoRepo.excluir(original.id)
      await this.lancarGastoOuEmprestimo({
        flow: original.isLoan ? 'loan' : 'expense', paymentMethod: dados.method, compradorId: dados.compradorId, valor: dados.valorTotal.centavos / 100, descricao: dados.descricao, divisoes: dados.divisoes, installments: dados.installments, cardOwnerId: dados.cardOwner, borrowerId: original.borrowerId, periodo: faturaOriginal.periodo
      })
    } else {
      const faturaOriginal = await this.faturaRepo.buscarPorId(original.faturaId)
      let novaFaturaId = original.faturaId
      
      if (faturaOriginal) {
        const { cartaoId, responsavelFaturaId } = resolverCartao(
          dados.method,
          dados.cardOwner,
          dados.compradorId,
          todosCartoes
        )
        const novaFatura = await this.faturaRepo.assegurarObterOuCriarFatura(cartaoId, faturaOriginal.periodo.mes, faturaOriginal.periodo.ano, responsavelFaturaId)
        novaFaturaId = novaFatura.id
      }

      await this.gastoRepo.salvar(new Gasto({
        id: original.id, faturaId: novaFaturaId, descricao: dados.descricao, valorTotal: dados.valorTotal, compradorId: dados.compradorId, divisoes: dados.divisoes, method: dados.method, cardOwner: resolvedCardOwner, installments: dados.installments, totalInstallments: dados.installments, isLoan: original.isLoan, borrowerId: original.borrowerId, recurringBillId: original.recurringBillId, isSettlement: original.isSettlement, settlementDetails: original.settlementDetails
      }))
    }
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
      grupoParcelasId: g.grupoParcelasId
    }))

    await this.gastoRepo.salvarMuitos(gastosParaSalvar)
  }
}
