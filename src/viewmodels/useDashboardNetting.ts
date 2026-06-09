import { computed, type Ref } from 'vue'
import { calcularSaldosUnificados, calcularTransacoesNetting } from '../models/services/NettingService'
import type { Gasto } from '../models/entities/Gasto'

export function useDashboardNetting(
  membros: Ref<{ id: string; nome: string; ativo?: boolean }[]>,
  gastosSaldoReal: Ref<Gasto[]>
) {
  const saldosUnificadosAtivosCentavos = computed(() =>
    calcularSaldosUnificados(membros.value, gastosSaldoReal.value)
  )

  const saldosUnificadosAtivos = computed(() => {
    const centavos = saldosUnificadosAtivosCentavos.value
    const reais: Record<string, number> = {}
    for (const key in centavos) {
      reais[key] = centavos[key] / 100
    }
    return reais
  })

  const nettingTransferencias = computed(() => calcularTransacoesNetting(saldosUnificadosAtivosCentavos.value))

  const membrosVisiveis = computed(() => {
    return membros.value.filter(m => {
      if (m.ativo !== false) return true
      const saldoCentavos = saldosUnificadosAtivosCentavos.value[m.id] || 0
      return Math.abs(saldoCentavos) > 0
    })
  })

  return {
    saldosUnificadosAtivosCentavos,
    saldosUnificadosAtivos,
    nettingTransferencias,
    membrosVisiveis
  }
}
