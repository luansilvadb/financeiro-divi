import { Gasto } from '../entities/Gasto'
import { valorParcelaAtual } from '../entities/ParcelaCalculator'

export interface TransferenciaNetting {
  from: string
  to: string
  val: number
}

/**
 * Calcula saldos unificados de crédito/débito entre membros a partir dos gastos.
 * Funções puras sem dependência de framework.
 */
export function calcularSaldosUnificados(
  membros: { id: string }[],
  gastos: Gasto[]
): Record<string, number> {
  const saldosCentavos: Record<string, number> = {}
  membros.forEach(m => { saldosCentavos[m.id] = 0 })


  gastos.forEach(g => {
    if (g.isLoan) {
      const valorParcela = valorParcelaAtual(g.valorTotal, g.installments, g.totalInstallments)
      if (valorParcela.centavos > 0) {
        const valorParcelaCentavos = valorParcela.centavos
        if (g.compradorId) {
          saldosCentavos[g.compradorId] = (saldosCentavos[g.compradorId] || 0) + valorParcelaCentavos
        }
        if (g.borrowerId) {
          saldosCentavos[g.borrowerId] = (saldosCentavos[g.borrowerId] || 0) - valorParcelaCentavos
        }
      }
    } else if (g.isSettlement && g.settlementDetails) {
      const valor = valorParcelaAtual(g.valorTotal, g.installments, g.totalInstallments)
      if (valor.centavos > 0) {
        const fromId = g.settlementDetails.fromMemberId
        const toId = g.settlementDetails.toMemberId
        
        saldosCentavos[fromId] = (saldosCentavos[fromId] || 0) + valor.centavos
        saldosCentavos[toId] = (saldosCentavos[toId] || 0) - valor.centavos
      }
    } else {
      const pagadorId = (g.method === 'card' && g.cardOwner) ? g.cardOwner : g.compradorId

      let totalDebitosCentavos = 0
      g.divisoes.forEach(div => {
        const valorDebito = valorParcelaAtual(div.valor, g.installments, g.totalInstallments)
        if (valorDebito.centavos > 0) {
          const valorDebitoCentavos = valorDebito.centavos
          saldosCentavos[div.membroId] = (saldosCentavos[div.membroId] || 0) - valorDebitoCentavos
          totalDebitosCentavos += valorDebitoCentavos
        }
      })

      if (pagadorId) {
        saldosCentavos[pagadorId] = (saldosCentavos[pagadorId] || 0) + totalDebitosCentavos
      }
    }
  })

  return saldosCentavos
}

/**
 * Algoritmo guloso de netting: gera o conjunto mínimo de transferências
 * para zerar os saldos entre membros trabalhando em centavos inteiros absolutos.
 */
export function calcularTransacoesNetting(saldosCentavos: Record<string, number>): TransferenciaNetting[] {
  const creditors: { id: string; val: number }[] = []
  const debtors: { id: string; val: number }[] = []

  for (const mId in saldosCentavos) {
    const val = saldosCentavos[mId]
    if (val > 0) {
      creditors.push({ id: mId, val })
    } else if (val < 0) {
      debtors.push({ id: mId, val: -val })
    }
  }

  creditors.sort((a, b) => b.val - a.val)
  debtors.sort((a, b) => b.val - a.val)

  const transferencias: TransferenciaNetting[] = []
  let cIdx = 0
  let dIdx = 0

  while (cIdx < creditors.length && dIdx < debtors.length) {
    const creditor = creditors[cIdx]
    const debtor = debtors[dIdx]
    const amount = Math.min(creditor.val, debtor.val)

    if (amount > 0) {
      transferencias.push({
        from: debtor.id,
        to: creditor.id,
        val: amount / 100 // Exposto em Reais para a visualização externa
      })
    }

    creditor.val -= amount
    debtor.val -= amount

    if (creditor.val === 0) cIdx++
    if (debtor.val === 0) dIdx++
  }

  return transferencias
}
