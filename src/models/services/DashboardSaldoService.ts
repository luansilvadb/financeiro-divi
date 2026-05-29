import type { Fatura } from '../entities/Fatura'
import type { Gasto } from '../entities/Gasto'
import { valorParcelaAtual } from '../entities/ParcelaCalculator'

export interface SeparacaoGastosDashboard {
  gastosSaldoReal: Gasto[]
  gastosPrevisaoCartao: Gasto[]
}

function obterPeriodoDoGasto(gasto: Gasto, fatura?: Fatura): { mes: number; ano: number } | null {
  if (fatura?.periodo) {
    return { mes: fatura.periodo.mes, ano: fatura.periodo.ano }
  }
  const match = gasto.faturaId.match(/(?:.*-)?(\d+)-(\d+)$/)
  if (match) {
    return {
      mes: parseInt(match[1], 10),
      ano: parseInt(match[2], 10)
    }
  }
  return null
}

function temCartaoFechadoNoPeriodo(periodo: { mes: number; ano: number } | null, faturas: Fatura[]): boolean {
  if (!periodo) return false
  return faturas.some(
    f => f.cartaoId !== 'PIX_DEFAULT_ID' &&
         f.periodo.mes === periodo.mes &&
         f.periodo.ano === periodo.ano &&
         f.status !== 'ABERTA'
  )
}

function deveIncluirSettlement(
  gasto: Gasto,
  faturaAberta: boolean,
  fatura: Fatura | undefined,
  faturas: Fatura[]
): boolean {
  if (gasto.settlementDetails) {
    // Se a fatura estiver aberta, o Pix de netting compensa os gastos comuns ativos deste período.
    // Se a fatura estiver fechada, a compensação já é tratada pela quitação do AcertoMembro correspondente.
    // Se houver fatura de cartão fechada no mesmo período, a compensação já é computada nos acertos virtuais.
    const periodo = obterPeriodoDoGasto(gasto, fatura)
    const temFechado = temCartaoFechadoNoPeriodo(periodo, faturas)
    return faturaAberta && !temFechado
  }
  
  // Settlement gastos sem detalhes (ex: carryover do rollover que traz o saldo inicial ou audit-settlement persistido)
  // Devem ser incluídos APENAS se a fatura estiver aberta.
  // Se a fatura estiver fechada, o saldo já está consolidado no AcertoMembro daquela fatura,
  // e incluí-los aqui causaria contagem dupla (Ghost Debt).
  return faturaAberta
}

function ehGastoDeCartao(gasto: Gasto): boolean {
  return gasto.method === 'card' || !!gasto.cardOwner
}

function deveIrParaSaldoReal(
  gasto: Gasto,
  faturaAberta: boolean,
  fatura: Fatura | undefined,
  faturas: Fatura[]
): boolean {
  if (gasto.isSettlement) {
    return deveIncluirSettlement(gasto, faturaAberta, fatura, faturas)
  }
  
  if (gasto.isLoan) {
    return true
  }

  return faturaAberta && !ehGastoDeCartao(gasto)
}

function deveIrParaPrevisaoCartao(gasto: Gasto, faturaAberta: boolean): boolean {
  if (gasto.isSettlement || gasto.isLoan) {
    return false
  }

  return faturaAberta && ehGastoDeCartao(gasto)
}

export function separarGastosSaldoRealEPreviaCartao(
  gastos: Gasto[],
  faturas: Fatura[]
): SeparacaoGastosDashboard {
  const faturasPorId = new Map(faturas.map(f => [f.id, f]))
  const gastosSaldoReal: Gasto[] = []
  const gastosPrevisaoCartao: Gasto[] = []

  for (const gasto of gastos) {
    const fatura = faturasPorId.get(gasto.faturaId)
    const faturaAberta = !fatura || fatura.status === 'ABERTA'

    if (deveIrParaSaldoReal(gasto, faturaAberta, fatura, faturas)) {
      gastosSaldoReal.push(gasto)
    } else if (deveIrParaPrevisaoCartao(gasto, faturaAberta)) {
      gastosPrevisaoCartao.push(gasto)
    }
    // Gastos de faturas fechadas/acertadas são ignorados aqui pois serão substituídos por AcertoMembro no ViewModel
  }

  return { gastosSaldoReal, gastosPrevisaoCartao }
}

export function calcularPreviaCartaoAberto(gastos: Gasto[]): Record<string, number> {
  const totalPorMembro: Record<string, number> = {}

  for (const gasto of gastos) {
    for (const div of gasto.divisoes) {
      const valor = valorParcelaAtual(div.valor, gasto.installments, gasto.totalInstallments)
      if (valor.centavos > 0) {
        totalPorMembro[div.membroId] = (totalPorMembro[div.membroId] || 0) + valor.centavos
      }
    }
  }

  return totalPorMembro
}
