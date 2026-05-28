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
}
