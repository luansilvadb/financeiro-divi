import { Gasto } from '../entities/Gasto'

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
    // O total de parcelas e parcelas restantes define qual índice de parcela estamos processando (0-indexed)
    const parcelaAtualIdx = g.totalInstallments - g.installments

    if (g.isLoan) {
      const parcelasEmprestimo = g.valorTotal.distribuir(g.totalInstallments)
      const valorParcelaCentavos = parcelasEmprestimo[parcelaAtualIdx].centavos
      if (g.compradorId) saldosCentavos[g.compradorId] += valorParcelaCentavos
      if (g.borrowerId) saldosCentavos[g.borrowerId] -= valorParcelaCentavos
    } else {
      const pagadorId = (g.method === 'card' && g.cardOwner) ? g.cardOwner : g.compradorId

      let totalDebitosCentavos = 0
      g.divisoes.forEach(div => {
        const distribuicaoDiv = div.valor.distribuir(g.totalInstallments)
        const valorDebitoCentavos = distribuicaoDiv[parcelaAtualIdx].centavos
        saldosCentavos[div.membroId] -= valorDebitoCentavos
        totalDebitosCentavos += valorDebitoCentavos
      })

      if (pagadorId) {
        saldosCentavos[pagadorId] += totalDebitosCentavos
      }
    }
  })

  const saldos: Record<string, number> = {}
  for (const key in saldosCentavos) {
    saldos[key] = Math.round(saldosCentavos[key]) / 100
  }

  return saldos
}

/**
 * Algoritmo guloso de netting: gera o conjunto mínimo de transferências
 * para zerar os saldos entre membros.
 */
export function calcularTransacoesNetting(saldos: Record<string, number>): TransferenciaNetting[] {
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
