import type { IGastoRepository } from '../repositories/IGastoRepository'
import type { IFaturaRepository } from '../repositories/IFaturaRepository'
import type { ICartaoRepository } from '../repositories/ICartaoRepository'
import { Gasto } from '../entities/Gasto'
import { Dinheiro } from '../entities/Dinheiro'
import { DivisaoDeGasto } from '../entities/DivisaoDeGasto'
import { Fatura } from '../entities/Fatura'
import type { IGastoService } from './IGastoService'

export class GastoService implements IGastoService {
  constructor(
    private gastoRepo: IGastoRepository,
    private faturaRepo: IFaturaRepository,
    private cartaoRepo: ICartaoRepository
  ) {}

  async lancarGastoOuEmprestimo(dados: {
    flow: 'expense' | 'loan'
    paymentMethod: 'pix' | 'card'
    compradorId: string
    valor: number
    descricao: string
    divisoes: any[]
    installments: number
    cardOwnerId: string | null
    borrowerId: string | null
    periodo: { mes: number; ano: number }
  }): Promise<void> {
    const { flow, paymentMethod, compradorId, valor, descricao, divisoes, installments, cardOwnerId, borrowerId, periodo } = dados
    const total = Dinheiro.deReais(valor)
    const faturaAtiva = await this.findActiveFatura(paymentMethod, cardOwnerId, compradorId, periodo)

    if (paymentMethod === 'card' && installments > 1) {
      await this.projetarGastosParcelados({
        total,
        divisoes,
        faturaAtiva,
        descricao,
        compradorId,
        installments,
        cardOwner: cardOwnerId
      })
    } else {
      const novoGasto = new Gasto({
        id: crypto.randomUUID(),
        faturaId: faturaAtiva.id,
        descricao: flow === 'loan' ? (descricao.trim() || 'Empréstimo Pessoal') : descricao,
        valorTotal: total,
        compradorId,
        divisoes,
        installments,
        totalInstallments: installments,
        isLoan: flow === 'loan',
        borrowerId,
        method: paymentMethod,
        cardOwner: cardOwnerId,
        grupoParcelasId: null
      })
      await this.gastoRepo.salvar(novoGasto)
    }
  }

  private async findActiveFatura(paymentMethod: 'pix' | 'card', cardOwnerId: string | null, compradorId: string, periodo: { mes: number; ano: number }): Promise<any> {
    const cartaoId = await this.determinarCartaoId(paymentMethod, cardOwnerId, compradorId)
    return this.obterOuCriarFatura(cartaoId, periodo.mes, periodo.ano, compradorId)
  }

  private async determinarCartaoId(paymentMethod: 'pix' | 'card', cardOwnerId: string | null, compradorId: string): Promise<string> {
    const todosCartoes = await this.cartaoRepo.listarTodos()
    if (paymentMethod === 'card' && cardOwnerId) {
      const cartao = todosCartoes.find(c => c.responsavelPadraoId === compradorId || c.id === cardOwnerId)
      if (cartao) return cartao.id
    }
    return todosCartoes.length > 0 ? todosCartoes[0].id : 'PIX_DEFAULT_ID'
  }

  private async obterOuCriarFatura(cartaoId: string, mes: number, ano: number, responsavelId: string): Promise<any> {
    const todasFaturas = await this.faturaRepo.listarTodas()
    let fatura = todasFaturas.find(f => f.cartaoId === cartaoId && f.periodo.mes === mes && f.periodo.ano === ano)
    if (!fatura) {
      fatura = new Fatura({
        id: crypto.randomUUID(),
        cartaoId,
        periodo: { mes, ano },
        responsavelId,
        status: 'ABERTA'
      })
      await this.faturaRepo.salvar(fatura)
    }
    return fatura
  }

  private async projetarGastosParcelados(dados: {
    total: Dinheiro
    divisoes: any[]
    faturaAtiva: any
    descricao: string
    compradorId: string
    installments: number
    cardOwner: string | null
  }): Promise<void> {
    const { total, divisoes, faturaAtiva, descricao, compradorId, installments, cardOwner } = dados
    const grupoParcelasId = crypto.randomUUID()
    
    // Salvar primeira parcela
    const primeiroGasto = new Gasto({
      id: crypto.randomUUID(),
      faturaId: faturaAtiva.id,
      descricao,
      valorTotal: total,
      compradorId,
      divisoes,
      installments,
      totalInstallments: installments,
      isLoan: false,
      borrowerId: null,
      method: 'card',
      cardOwner,
      grupoParcelasId
    })
    await this.gastoRepo.salvar(primeiroGasto)

    // Salvar parcelas futuras
    let currentMes = faturaAtiva.periodo.mes
    let currentAno = faturaAtiva.periodo.ano
    
    for (let i = 2; i <= installments; i++) {
      currentMes++
      if (currentMes > 12) {
        currentMes = 1
        currentAno++
      }
      
      const faturaFutura = await this.obterOuCriarFatura(faturaAtiva.cartaoId, currentMes, currentAno, compradorId)
      const gastoFuturo = new Gasto({
        id: crypto.randomUUID(),
        faturaId: faturaFutura.id,
        descricao,
        valorTotal: total,
        compradorId,
        divisoes: [...divisoes],
        installments: installments - i + 1,
        totalInstallments: installments,
        isLoan: false,
        borrowerId: null,
        method: 'card',
        cardOwner,
        grupoParcelasId
      })
      await this.gastoRepo.salvar(gastoFuturo)
    }
  }

  async excluirGasto(id: string): Promise<void> {
    await this.gastoRepo.excluir(id)
  }

  async registrarAcertoNetting(dados: {
    faturaId: string
    descricao: string
    valor: number
    fromMemberId: string
    toMemberId: string
    method: string
  }): Promise<void> {
    const total = Dinheiro.deReais(dados.valor)
    const acertoGasto = new Gasto({
      id: crypto.randomUUID(),
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

  async lancarGastoContaFixa(dados: {
    faturaId: string
    conta: { id: string; name: string }
    valorTotal: number
    compradorId: string
    participantes: string[]
  }): Promise<void> {
    const total = Dinheiro.deReais(dados.valorTotal)
    const partes = total.distribuir(dados.participantes.length)
    const divisoes = dados.participantes.map((id, idx) => new DivisaoDeGasto(id, partes[idx]))

    const novoGasto = new Gasto({
      id: crypto.randomUUID(),
      faturaId: dados.faturaId,
      descricao: `Talão: ${dados.conta.name}`,
      valorTotal: total,
      compradorId: dados.compradorId,
      divisoes,
      recurringBillId: dados.conta.id,
      installments: 1,
      isLoan: false
    })

    await this.gastoRepo.salvar(novoGasto)
  }

  async atualizarGastoCompleto(
    gastoId: string,
    dados: {
      descricao: string
      valorTotal: Dinheiro
      compradorId: string
      method: 'pix' | 'card'
      cardOwner: string | null
      divisoes: DivisaoDeGasto[]
      installments: number
    }
  ): Promise<void> {
    const original = await this.gastoRepo.buscarPorId(gastoId)
    if (!original) throw new Error('Gasto não encontrado')

    const novoGasto = new Gasto({
      id: original.id,
      faturaId: original.faturaId,
      descricao: dados.descricao,
      valorTotal: dados.valorTotal,
      compradorId: dados.compradorId,
      divisoes: dados.divisoes,
      method: dados.method,
      cardOwner: dados.cardOwner,
      installments: dados.installments,
      isLoan: original.isLoan,
      borrowerId: original.borrowerId,
      recurringBillId: original.recurringBillId,
      isSettlement: original.isSettlement,
      settlementDetails: original.settlementDetails
    })

    await this.gastoRepo.salvar(novoGasto)
  }
}
