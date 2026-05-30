import { Gasto } from '../entities/Gasto'
import { Dinheiro } from '../entities/Dinheiro'
import { valorParcelaAtual } from '../entities/ParcelaCalculator'

export interface ItemExtrato {
  id: string
  descricao: string
  valorPago: Dinheiro
  valorConsumido: Dinheiro
  valorLiquido: Dinheiro
  saldoAcumulado: Dinheiro
}

export interface BreakdownGranular {
  pixFez: number
  pixConsumo: number
  cardFez: number
  cardConsumo: number
  loanFez: number
  loanTomou: number
}

export class ExtratoService {
  /**
   * Calcula o extrato detalhado para um membro específico a partir de uma lista de gastos.
   */
  static obterExtratoMembro(membroId: string, gastos: Gasto[]): ItemExtrato[] {
    const gastosOrdenados = [...gastos].sort((a, b) => a.id.localeCompare(b.id))
    
    let saldoAcumulado = Dinheiro.deCentavos(0)
    
    return gastosOrdenados.map(g => {
      let centavosPagos = 0
      let centavosConsumidos = 0

      if (g.isLoan) {
        const valorParcela = valorParcelaAtual(g.valorTotal, g.installments, g.totalInstallments)
        const valorParcelaCentavos = valorParcela.centavos

        if (g.compradorId === membroId) {
          centavosPagos = valorParcelaCentavos
        }
        if (g.borrowerId === membroId) {
          centavosConsumidos = valorParcelaCentavos
        }
      } else {
        const pagadorId = (g.method === 'card' && g.cardOwner) ? g.cardOwner : g.compradorId
        
        let totalDebitosParcela = 0
        g.divisoes.forEach(div => {
          const valorDebito = valorParcelaAtual(div.valor, g.installments, g.totalInstallments)
          if (valorDebito.centavos > 0) {
            const centavosDiv = valorDebito.centavos
            totalDebitosParcela += centavosDiv
            
            if (div.membroId === membroId) {
              centavosConsumidos = centavosDiv
            }
          }
        })

        if (pagadorId === membroId) {
          centavosPagos = totalDebitosParcela
        }
      }

      const valorPago = Dinheiro.deCentavos(centavosPagos)
      const valorConsumido = Dinheiro.deCentavos(centavosConsumidos)
      const valorLiquido = valorPago.subtrair(valorConsumido)
      
      saldoAcumulado = saldoAcumulado.somar(valorLiquido)
      
      return {
        id: g.id,
        descricao: g.descricao,
        valorPago,
        valorConsumido,
        valorLiquido,
        saldoAcumulado
      }
    })
  }

  /**
   * Calcula os acumuladores granulares (PIX, Cartão, Empréstimo) para todos os moradores
   */
  static obterBreakdownGranular(membros: { id: string }[], gastos: Gasto[]): Record<string, BreakdownGranular> {
    const breakdown: Record<string, BreakdownGranular> = {}

    membros.forEach(m => {
      breakdown[m.id] = { pixFez: 0, pixConsumo: 0, cardFez: 0, cardConsumo: 0, loanFez: 0, loanTomou: 0 }
    })

    gastos.forEach(g => {
      const valorParcela = valorParcelaAtual(g.valorTotal, g.installments, g.totalInstallments).centavos
      
      if (g.isLoan) {
        if (g.compradorId && breakdown[g.compradorId]) {
          breakdown[g.compradorId].loanFez += valorParcela
        }
        if (g.borrowerId && breakdown[g.borrowerId]) {
          breakdown[g.borrowerId].loanTomou += valorParcela
        }
      } else {
        if (g.method === 'pix' || g.isSettlement) {
          if (g.compradorId && breakdown[g.compradorId]) {
            breakdown[g.compradorId].pixFez += valorParcela
          }
          g.divisoes.forEach(d => {
            if (breakdown[d.membroId]) {
              breakdown[d.membroId].pixConsumo += valorParcelaAtual(d.valor, g.installments, g.totalInstallments).centavos
            }
          })
        } else {
          const pagadorId = g.cardOwner || g.compradorId
          if (pagadorId && breakdown[pagadorId]) {
            breakdown[pagadorId].cardFez += valorParcela
          }
          g.divisoes.forEach(d => {
            if (breakdown[d.membroId]) {
              breakdown[d.membroId].cardConsumo += valorParcelaAtual(d.valor, g.installments, g.totalInstallments).centavos
            }
          })
        }
      }
    })

    return breakdown
  }
}
