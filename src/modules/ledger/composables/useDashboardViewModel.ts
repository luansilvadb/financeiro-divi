import { ref, watch } from 'vue'

export interface DashboardProps {
  membros: { id: string; nome: string; ativo?: boolean }[]
  faturasAbertas: any[]
  faturasFechadas: any[]
  acertosPendentes: any[]
  cartoes: any[]
  calcularConsumo: (faturaId: string, membroId: string) => number
  gastos?: any[]
  activeTab?: any
}

export function useDashboardViewModel(props: DashboardProps, emit: any) {
  const obterPeriodoInicial = () => {
    const salvo = localStorage.getItem('divi_periodo_selecionado')
    if (salvo) {
      try {
        const parsed = JSON.parse(salvo)
        if (parsed.mes && parsed.ano) return parsed
      } catch (e) {}
    }
    const faturaReferencia = props.faturasAbertas?.[0] || props.faturasFechadas?.[0]
    if (faturaReferencia?.periodo) {
      return { mes: faturaReferencia.periodo.mes, ano: faturaReferencia.periodo.ano }
    }
    return { mes: new Date().getMonth() + 1, ano: new Date().getFullYear() }
  }

  const periodoSelecionado = ref<{ mes: number; ano: number }>(obterPeriodoInicial())

  watch(periodoSelecionado, (novos) => {
    localStorage.setItem('divi_periodo_selecionado', JSON.stringify(novos))
  }, { deep: true, immediate: true })

  return {
    periodoSelecionado
  }
}
