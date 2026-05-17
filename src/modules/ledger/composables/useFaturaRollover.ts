import { ref } from 'vue'
import { Gasto } from '../core/domain/Gasto'
import { DivisaoDeGasto } from '../core/domain/DivisaoDeGasto'
import { Dinheiro } from '../../../shared/primitives/Dinheiro'

export function useFaturaRollover() {
  const isMonthLocked = ref(false)

  const processarRolloverParcelas = (novaFaturaId: string, gastosAnteriores: Gasto[]): Gasto[] => {
    return gastosAnteriores
      .filter(g => g.installments > 1)
      .map(g => {
        return new Gasto({
          id: g.id, // Mantém o ID de origem do parcelamento
          faturaId: novaFaturaId,
          descricao: g.descricao,
          valorTotal: g.valorTotal,
          compradorId: g.compradorId,
          divisoes: [...g.divisoes],
          installments: g.installments - 1, // Decrementa a contagem de parcelas
          isLoan: g.isLoan,
          borrowerId: g.borrowerId,
          recurringBillId: g.recurringBillId
        })
      })
  }

  const gerarTransacoesNettingSaldoInicial = (
    novaFaturaId: string,
    nomePeriodoAnterior: string,
    saldosAnteriores: Record<string, number>
  ): Gasto[] => {
    const creditors: { id: string; val: number }[] = []
    const debtors: { id: string; val: number }[] = []

    for (const mId in saldosAnteriores) {
      const val = saldosAnteriores[mId]
      if (val > 0.005) {
        creditors.push({ id: mId, val: val })
      } else if (val < -0.005) {
        debtors.push({ id: mId, val: -val })
      }
    }

    creditors.sort((a, b) => b.val - a.val)
    debtors.sort((a, b) => b.val - a.val)

    const carryovers: Gasto[] = []
    let cIdx = 0
    let dIdx = 0

    while (cIdx < creditors.length && dIdx < debtors.length) {
      const creditor = creditors[cIdx]
      const debtor = debtors[dIdx]
      const amount = Math.min(creditor.val, debtor.val)

      if (amount > 0.005) {
        const total = Dinheiro.deReais(amount)
        carryovers.push(new Gasto({
          id: `carry_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          faturaId: novaFaturaId,
          descricao: `Saldo Inicial Pendente (${nomePeriodoAnterior})`,
          valorTotal: total,
          compradorId: creditor.id, // O credor "paga" para constar a receber
          divisoes: [new DivisaoDeGasto(debtor.id, total)], // O devedor assume 100% da dívida
          installments: 1,
          isSettlement: true
        }))
      }

      creditor.val -= amount
      debtor.val -= amount

      if (creditor.val < 0.005) cIdx++
      if (debtor.val < 0.005) dIdx++
    }

    return carryovers
  }

  return {
    isMonthLocked,
    processarRolloverParcelas,
    gerarTransacoesNettingSaldoInicial
  }
}
