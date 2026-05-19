import { ref } from 'vue'
import { Gasto } from '../core/domain/Gasto'
import { DivisaoDeGasto } from '../core/domain/DivisaoDeGasto'
import { Dinheiro } from '../../../shared/primitives/Dinheiro'
import { LocalStorageFaturaRepository } from '../adapters/LocalStorageFaturaRepository'
import { LocalStorageGastoRepository } from '../adapters/LocalStorageGastoRepository'
import { Fatura } from '../core/domain/Fatura'

export function useFaturaRollover() {
  const isMonthLocked = ref(localStorage.getItem('divi_is_month_locked') === 'true')

  const setMonthLocked = (locked: boolean) => {
    isMonthLocked.value = locked
    localStorage.setItem('divi_is_month_locked', locked ? 'true' : 'false')
  }

  const processarRolloverParcelas = (novaFaturaId: string, gastosAnteriores: Gasto[]): Gasto[] => {
    return gastosAnteriores
      .filter(g => g.installments > 1 && !g.grupoParcelasId)
      .map(g => {
        return new Gasto({
          id: crypto.randomUUID(), // Gera um ID único para a nova parcela
          faturaId: novaFaturaId,
          descricao: g.descricao,
          valorTotal: g.valorTotal,
          compradorId: g.compradorId,
          divisoes: [...g.divisoes],
          installments: g.installments - 1, // Decrementa a contagem de parcelas
          totalInstallments: g.totalInstallments || g.installments, // <- NOVO
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

  const executarRolloverPeriodo = async (
    nomeNovoPeriodo: string,
    faturasAbertas: Fatura[],
    cartoes: any[],
    saldosAcumulados: Record<string, number>,
    nomePeriodoAnterior: string
  ) => {
    if (faturasAbertas.length === 0) return

    const fRepo = new LocalStorageFaturaRepository()

    // 1. Fechar as faturas abertas do período diretamente via repositório
    for (const f of faturasAbertas) {
      f.fechar(f.responsavelId, new Date())
      await fRepo.salvar(f)
    }

    // 2. Criar faturas e período no novo mês
    const [mesStr, anoStr] = nomeNovoPeriodo.split(' ')
    const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
    const mesNum = meses.indexOf(mesStr) + 1 || new Date().getMonth() + 1
    const anoNum = parseInt(anoStr) || new Date().getFullYear()

    const novasFaturas: Fatura[] = []

    for (const card of cartoes) {
      const novaFatura = new Fatura({
        id: crypto.randomUUID(),
        cartaoId: card.id,
        periodo: { mes: mesNum, ano: anoNum },
        responsavelId: card.responsavelPadraoId,
        status: 'ABERTA'
      })
      await fRepo.salvar(novaFatura)
      novasFaturas.push(novaFatura)
    }

    const novaFaturaIdPrincipal = novasFaturas[0]?.id

    if (novaFaturaIdPrincipal) {
      const gRepo = new LocalStorageGastoRepository()

      // 3. Decrementar parcelas ativas
      const todosGastosAnteriores: Gasto[] = []
      for (const f of faturasAbertas) {
        const porFatura = await gRepo.buscarPorFatura(f.id)
        todosGastosAnteriores.push(...porFatura)
      }

      const gastosParceladosNovos = processarRolloverParcelas(novaFaturaIdPrincipal, todosGastosAnteriores)
      for (const g of gastosParceladosNovos) {
        await gRepo.salvar(g)
      }

      // 4. Aplicar Netting final e carregar saldos devedores/credores como "Saldo Inicial Pendente"
      const transacoesCarryover = gerarTransacoesNettingSaldoInicial(
        novaFaturaIdPrincipal, 
        nomePeriodoAnterior, 
        saldosAcumulados
      )
      for (const g of transacoesCarryover) {
        await gRepo.salvar(g)
      }
    }

    // 5. Destranca
    setMonthLocked(false)
  }

  return {
    isMonthLocked,
    setMonthLocked,
    processarRolloverParcelas,
    gerarTransacoesNettingSaldoInicial,
    executarRolloverPeriodo
  }
}

