import type { Fatura } from '../entities/Fatura'
import type { Gasto } from '../entities/Gasto'
import { valorParcelaAtual } from '../entities/ParcelaCalculator'

export interface SeparacaoGastosDashboard {
  gastosSaldoReal: Gasto[]
  gastosPrevisaoCartao: Gasto[]
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
    const ehCartao = gasto.method === 'card' || !!gasto.cardOwner
    const faturaAberta = !fatura || fatura.status === 'ABERTA'

    if (gasto.isSettlement) {
      if (gasto.settlementDetails) {
        // Se a fatura estiver aberta, o Pix de netting compensa os gastos comuns ativos deste período.
        // Se a fatura estiver fechada, a compensação já é tratada pela quitação do AcertoMembro correspondente.
        // Se houver fatura de cartão fechada no mesmo período, a compensação já é computada nos acertos virtuais.
        let mes = fatura?.periodo.mes
        let ano = fatura?.periodo.ano
        if (!mes || !ano) {
          const match = gasto.faturaId.match(/(?:.*-)?(\d+)-(\d+)$/)
          if (match) {
            mes = parseInt(match[1], 10)
            ano = parseInt(match[2], 10)
          }
        }

        const temCartaoFechadoNoPeriodo = mes !== undefined && ano !== undefined && faturas.some(
          f => f.cartaoId !== 'PIX_DEFAULT_ID' && f.periodo.mes === mes && f.periodo.ano === ano && f.status !== 'ABERTA'
        )

        if (faturaAberta && !temCartaoFechadoNoPeriodo) {
          gastosSaldoReal.push(gasto)
        }
      } else {
        // Settlement gastos sem detalhes (ex: carryover do rollover que traz o saldo inicial ou audit-settlement persistido)
        // Devem ser incluídos APENAS se a fatura estiver aberta.
        // Se a fatura estiver fechada, o saldo já está consolidado no AcertoMembro daquela fatura,
        // e incluí-los aqui causaria contagem dupla (Ghost Debt).
        if (faturaAberta) {
          gastosSaldoReal.push(gasto)
        }
      }
      continue
    }

    if (gasto.isLoan) {
      gastosSaldoReal.push(gasto)
      continue
    }

    if (faturaAberta) {
      if (ehCartao) {
        gastosPrevisaoCartao.push(gasto)
      } else {
        gastosSaldoReal.push(gasto)
      }
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
