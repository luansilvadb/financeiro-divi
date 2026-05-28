import { computed, type Ref } from 'vue'
import { calcularSaldosUnificados, calcularTransacoesNetting } from '../models/services/NettingService'

export function useDashboardNetting(
  getMembros: () => { id: string; nome: string; ativo?: boolean }[],
  gastosFaturaSelecionada: Ref<any[]>
) {
  const saldosUnificadosAtivosCentavos = computed(() =>
    calcularSaldosUnificados(getMembros(), gastosFaturaSelecionada.value)
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
    return getMembros().filter(m => {
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
