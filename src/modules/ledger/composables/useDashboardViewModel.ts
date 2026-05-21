import { ref, watch, computed } from 'vue'
import { Fatura } from '../core/domain/Fatura'

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

  const faturaSelecionadaTrancada = computed(() => {
    const p = periodoSelecionado.value
    return props.faturasFechadas.some(f => f.periodo.mes === p.mes && f.periodo.ano === p.ano)
  })

  watch(faturaSelecionadaTrancada, (isLocked) => {
    emit('periodoStatusChanged', isLocked)
  }, { immediate: true })

  const faturaAtivaVisualizada = computed(() => {
    const p = periodoSelecionado.value
    const faturaEncontrada = props.faturasAbertas.find(f => f.periodo.mes === p.mes && f.periodo.ano === p.ano) ||
                             props.faturasFechadas.find(f => f.periodo.mes === p.mes && f.periodo.ano === p.ano)
    if (faturaEncontrada) return faturaEncontrada

    return new Fatura({
      id: `virtual-${p.mes}-${p.ano}`,
      cartaoId: props.cartoes[0]?.id || 'virtual-card',
      periodo: { mes: p.mes, ano: p.ano },
      responsavelId: props.membros[0]?.id || 'virtual-member',
      status: 'ABERTA'
    })
  })

  const listaMesesSeletor = computed(() => {
    const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
    const hoje = new Date()
    const list = []

    for (let i = -12; i <= 12; i++) {
      const d = new Date(hoje.getFullYear(), hoje.getMonth() + i, 1)
      const mesIdx = d.getMonth() + 1
      const anoIdx = d.getFullYear()
      
      const estaFechada = props.faturasFechadas.some(
        f => f.periodo.mes === mesIdx && f.periodo.ano === anoIdx
      )

      list.push({
        mes: mesIdx,
        ano: anoIdx,
        nome: `${meses[mesIdx - 1]} ${anoIdx}`,
        status: estaFechada ? 'FECHADA' : 'ABERTA'
      })
    }

    return list
  })

  const mesesAbertosOpcoes = computed(() => {
    return listaMesesSeletor.value.filter(item => item.status === 'ABERTA')
  })

  const mesesTrancadosOpcoes = computed(() => {
    return listaMesesSeletor.value.filter(item => item.status === 'FECHADA')
  })

  return {
    periodoSelecionado,
    faturaSelecionadaTrancada,
    faturaAtivaVisualizada,
    listaMesesSeletor,
    mesesAbertosOpcoes,
    mesesTrancadosOpcoes
  }
}
