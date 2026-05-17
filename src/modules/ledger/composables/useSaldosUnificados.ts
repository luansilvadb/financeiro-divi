import { Gasto } from '../core/domain/Gasto'

export interface TransferenciaNetting {
  from: string
  to: string
  val: number
}

export function useSaldosUnificados() {
  const calcularSaldosUnificados = (
    membros: { id: string; nome: string }[],
    gastos: Gasto[]
  ): Record<string, number> => {
    const saldos: Record<string, number> = {}
    membros.forEach(m => { saldos[m.id] = 0 })

    gastos.forEach(g => {
      const valorParcela = g.valorTotal.centavos / g.installments
      if (g.isLoan) {
        if (g.compradorId) saldos[g.compradorId] += valorParcela / 100
        if (g.borrowerId) saldos[g.borrowerId] -= valorParcela / 100
      } else {
        // Gasto Comum ou Acerto
        const pagadorId = (g.method === 'card' && g.cardOwner) ? g.cardOwner : g.compradorId
        if (pagadorId) saldos[pagadorId] += valorParcela / 100

        // Ratear entre participantes
        const splitCount = g.divisoes.length
        if (splitCount > 0) {
          g.divisoes.forEach(div => {
            saldos[div.membroId] -= (div.valor.centavos / g.installments) / 100
          })
        }
      }
    })

    // Arredondar os saldos para evitar float bugs
    for (const key in saldos) {
      saldos[key] = Math.round(saldos[key] * 100) / 100
    }

    return saldos
  }

  const calcularTransacoesNetting = (saldos: Record<string, number>): TransferenciaNetting[] => {
    const creditors: { id: string; val: number }[] = []
    const debtors: { id: string; val: number }[] = []

    for (const mId in saldos) {
      const val = saldos[mId]
      if (val > 0.005) {
        creditors.push({ id: mId, val })
      } else if (val < -0.005) {
        debtors.push({ id: mId, val: -val })
      }
    }

    // Ordenar do maior para o menor para otimizar netting guloso
    creditors.sort((a, b) => b.val - a.val)
    debtors.sort((a, b) => b.val - a.val)

    const transferencias: TransferenciaNetting[] = []
    let cIdx = 0
    let dIdx = 0

    while (cIdx < creditors.length && dIdx < debtors.length) {
      const creditor = creditors[cIdx]
      const debtor = debtors[dIdx]
      const amount = Math.min(creditor.val, debtor.val)

      if (amount > 0.005) {
        transferencias.push({
          from: debtor.id,
          to: creditor.id,
          val: Math.round(amount * 100) / 100
        })
      }

      creditor.val -= amount
      debtor.val -= amount

      if (creditor.val < 0.005) cIdx++
      if (debtor.val < 0.005) dIdx++
    }

    return transferencias
  }

  return {
    calcularSaldosUnificados,
    calcularTransacoesNetting
  }
}
