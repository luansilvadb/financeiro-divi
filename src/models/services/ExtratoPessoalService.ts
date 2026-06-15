import { Gasto } from '../entities/Gasto'
import { Dinheiro } from '../entities/Dinheiro'
import { valorParcelaAtual } from '../entities/ParcelaCalculator'

export interface ItemExtratoPessoal {
  id: string
  descricao: string
  valorPago: Dinheiro
  valorConsumido: Dinheiro
  valorLiquido: Dinheiro
  saldoAcumulado: Dinheiro
  isLoan: boolean
  isSettlement: boolean
  compradorId: string
  borrowerId: string | null
  createdAt: Date
}

export interface SaldoPessoalPendencia {
  id: string     // formato: "externo:Nome" ou ID de membro interno
  nome: string   // "Nome"
  saldo: Dinheiro
}

export class ExtratoPessoalService {
  /**
   * Calcula o extrato de movimentações pessoais (gastos privados do próprio membro).
   */
  static obterExtratoPessoal(membroId: string, gastos: Gasto[]): ItemExtratoPessoal[] {
    const gastosPrivados = gastos.filter(g => {
      if (!g.isPrivate) return false
      
      const envolvidoNasDivisoes = g.divisoes.some(d => d.membroId === membroId)
      return g.compradorId === membroId || g.cardOwner === membroId || g.borrowerId === membroId || envolvidoNasDivisoes
    })

    const ordenados = [...gastosPrivados].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    let saldoAcumulado = Dinheiro.deCentavos(0)

    return ordenados.map(g => {
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
      } 
      else if (g.isSettlement && g.settlementDetails) {
        const valor = valorParcelaAtual(g.valorTotal, g.installments, g.totalInstallments)
        const valorCentavos = valor.centavos

        if (g.settlementDetails.fromMemberId === membroId) {
          centavosPagos = valorCentavos
        }
        if (g.settlementDetails.toMemberId === membroId) {
          centavosConsumidos = valorCentavos
        }
      } 
      else {
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

        centavosPagos = (pagadorId === membroId) ? totalDebitosParcela : 0
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
        saldoAcumulado,
        isLoan: g.isLoan,
        isSettlement: g.isSettlement,
        compradorId: g.compradorId,
        borrowerId: g.borrowerId,
        createdAt: g.createdAt
      }
    })
  }

  /**
   * Calcula saldos liquidados com outras pessoas (externas ou da casa).
   */
  static calcularSaldosPessoais(membroId: string, gastos: Gasto[]): SaldoPessoalPendencia[] {
    const saldosCentavos: Record<string, number> = {}
    const gastosPrivados = gastos.filter(g => g.isPrivate)

    gastosPrivados.forEach(g => {
      if (g.isLoan) {
        const valorParcela = valorParcelaAtual(g.valorTotal, g.installments, g.totalInstallments)
        if (valorParcela.centavos > 0) {
          const v = valorParcela.centavos
          if (g.compradorId === membroId && g.borrowerId && g.borrowerId !== membroId) {
            saldosCentavos[g.borrowerId] = (saldosCentavos[g.borrowerId] || 0) + v
          }
          if (g.compradorId !== membroId && g.borrowerId === membroId) {
            saldosCentavos[g.compradorId] = (saldosCentavos[g.compradorId] || 0) - v
          }
        }
      } 
      else if (g.isSettlement && g.settlementDetails) {
        const valor = valorParcelaAtual(g.valorTotal, g.installments, g.totalInstallments)
        if (valor.centavos > 0) {
          const v = valor.centavos
          const { fromMemberId, toMemberId } = g.settlementDetails
          if (fromMemberId === membroId && toMemberId !== membroId) {
            saldosCentavos[toMemberId] = (saldosCentavos[toMemberId] || 0) + v
          }
          if (fromMemberId !== membroId && toMemberId === membroId) {
            saldosCentavos[fromMemberId] = (saldosCentavos[fromMemberId] || 0) - v
          }
        }
      } 

    })

    const lista: SaldoPessoalPendencia[] = []
    for (const key in saldosCentavos) {
      const saldoCentavos = saldosCentavos[key]
      if (saldoCentavos !== 0) {
        const nome = key.startsWith('externo:') ? key.substring(8) : ''
        lista.push({
          id: key,
          nome,
          saldo: Dinheiro.deCentavos(saldoCentavos)
        })
      }
    }

    return lista
  }
}
