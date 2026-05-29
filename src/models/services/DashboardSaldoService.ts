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
      // Settlement gastos em faturas ABERTAS são confirmações de Pix já processadas.
      // Seu efeito já está capturado via AcertoMembro (acertosVirtuaisParaNetting).
      // Incluí-los aqui causaria double-counting com semântica invertida no cálculo de saldo.
      
      // Mesmo em faturas FECHADAS, se for um gasto de liquidação real (com settlementDetails),
      // ele não deve entrar no saldo pois o AcertoMembro correspondente já reflete a quitação.
      if (gasto.settlementDetails) {
        continue
      }

      // Settlement gastos sem detalhes (ex: carryover do rollover que traz o saldo inicial)
      // devem ser incluídos em faturas não-abertas para compor o saldo inicial visual.
      if (!faturaAberta) {
        gastosSaldoReal.push(gasto)
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
