import type { IGastoRepository } from '../ports/IGastoRepository'
import type { IFaturaRepository } from '../ports/IFaturaRepository'
import type { ICartaoRepository } from '../ports/ICartaoRepository'
import { Gasto } from '../domain/Gasto'
import { Dinheiro } from '../../../../shared/primitives/Dinheiro'
import { Fatura } from '../domain/Fatura'

export class GastoService {
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
  }): Promise<void> {
    const { flow, paymentMethod, compradorId, valor, descricao, divisoes, installments, cardOwnerId, borrowerId } = dados
    const total = Dinheiro.deReais(valor)
    const faturaAtiva = await this.findActiveFatura(paymentMethod, cardOwnerId, compradorId)

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

  private async findActiveFatura(paymentMethod: 'pix' | 'card', cardOwnerId: string | null, compradorId: string): Promise<any> {
    const { mes, ano } = this.obterPeriodoCorrente()
    const cartaoId = await this.determinarCartaoId(paymentMethod, cardOwnerId, compradorId)
    return this.obterOuCriarFatura(cartaoId, mes, ano, compradorId)
  }

  private obterPeriodoCorrente(): { mes: number; ano: number } {
    const periodoSalvoRaw = localStorage.getItem('divi_periodo_selecionado')
    if (periodoSalvoRaw) {
      try {
        const parsed = JSON.parse(periodoSalvoRaw)
        if (parsed.mes && parsed.ano) {
          return { mes: Number(parsed.mes), ano: Number(parsed.ano) }
        }
      } catch (e) {}
    }
    return { mes: new Date().getMonth() + 1, ano: new Date().getFullYear() }
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
}
