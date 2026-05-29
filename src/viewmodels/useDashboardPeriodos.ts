import { ref, computed, watch } from 'vue'
import { Fatura } from '../models/entities/Fatura'
import { Cartao } from '../models/entities/Cartao'
import { formatarMesAno, NOMES_MESES } from '../shared/utils/meses'
import { obterPeriodoSelecionado, salvarPeriodoSelecionado } from '../shared/utils/periodoStorage'

export function useDashboardPeriodos(
  getFaturasAbertas: () => Fatura[],
  getFaturasFechadas: () => Fatura[],
  getCartoes: () => Cartao[],
  getMembros: () => { id: string }[],
  emit: (event: any, ...args: any[]) => void
) {
  const obterPeriodoInicial = () => {
    const faturaReferencia = getFaturasAbertas()?.[0] || getFaturasFechadas()?.[0]
    const fallback = faturaReferencia?.periodo
      ? { mes: faturaReferencia.periodo.mes, ano: faturaReferencia.periodo.ano }
      : undefined
    return obterPeriodoSelecionado(fallback)
  }

  const periodoSelecionado = ref<{ mes: number; ano: number }>(obterPeriodoInicial())

  watch(periodoSelecionado, (novos) => {
    salvarPeriodoSelecionado(novos)
  }, { deep: true, immediate: true })

  const buscarFaturasNoPeriodo = (p: { mes: number; ano: number }) => {
    const abertas = getFaturasAbertas().filter(f => f.periodo.mes === p.mes && f.periodo.ano === p.ano)
    const fechadas = getFaturasFechadas().filter(f => f.periodo.mes === p.mes && f.periodo.ano === p.ano)
    
    return [...abertas, ...fechadas].sort((a, b) => {
      // Mantém a ordem estável baseada no ID do cartão
      if (a.cartaoId < b.cartaoId) return -1
      if (a.cartaoId > b.cartaoId) return 1
      return 0
    })
  }

  const buscarFaturaNoPeriodo = (p: { mes: number; ano: number }, cartaoId?: string) => {
    const faturas = buscarFaturasNoPeriodo(p)
    if (!cartaoId) return faturas[0]
    return faturas.find(f => f.cartaoId === cartaoId)
  }

  const criarFaturaVirtual = (p: { mes: number; ano: number }, cartaoId: string, responsavelId: string): Fatura => {
    return new Fatura({
      id: `virtual-${p.mes}-${p.ano}`,
      cartaoId,
      periodo: { mes: p.mes, ano: p.ano },
      responsavelId,
      status: 'ABERTA'
    })
  }

  const faturasPeriodoSelecionado = computed(() => {
    const p = periodoSelecionado.value
    const faturasExistentes = buscarFaturasNoPeriodo(p)
    if (faturasExistentes.length === 0) {
      return [
        criarFaturaVirtual(
          p,
          getCartoes()[0]?.id || 'PIX_DEFAULT_ID',
          getMembros()[0]?.id || 'virtual-member'
        )
      ]
    }
    return faturasExistentes
  })

  const faturaPixPeriodoSelecionado = computed(() => {
    const p = periodoSelecionado.value
    const faturaPix = buscarFaturaNoPeriodo(p, 'PIX_DEFAULT_ID')
    if (faturaPix) return faturaPix

    return new Fatura({
      id: `virtual-pix-${p.mes}-${p.ano}`,
      cartaoId: 'PIX_DEFAULT_ID',
      periodo: { mes: p.mes, ano: p.ano },
      responsavelId: 'PIX_SYSTEM_OWNER',
      status: 'ABERTA'
    })
  })

  const faturasPeriodoIds = computed(() => {
    const ids = faturasPeriodoSelecionado.value.map(f => f.id)
    const pixId = faturaPixPeriodoSelecionado.value?.id
    if (pixId && !ids.includes(pixId)) {
      ids.push(pixId)
    }
    return ids
  })

  const verificarPeriodoTrancado = (p: { mes: number; ano: number }): boolean => {
    const temFaturaPixAberta = getFaturasAbertas().some(f =>
      f.cartaoId === 'PIX_DEFAULT_ID' &&
      f.periodo.mes === p.mes &&
      f.periodo.ano === p.ano
    )

    if (getCartoes().length > 0) {
      const todosCartoesFechados = getCartoes().every(cartao => {
        const fechada = getFaturasFechadas().find(f => f.cartaoId === cartao.id && f.periodo.mes === p.mes && f.periodo.ano === p.ano)
        if (fechada) return true

        const aberta = getFaturasAbertas().find(f => f.cartaoId === cartao.id && f.periodo.mes === p.mes && f.periodo.ano === p.ano)
        if (aberta) return false

        return false
      })

      if (temFaturaPixAberta) return false
      return todosCartoesFechados
    }

    return getFaturasFechadas().some(f => f.periodo.mes === p.mes && f.periodo.ano === p.ano)
  }

  const faturaSelecionadaTrancada = computed(() => verificarPeriodoTrancado(periodoSelecionado.value))

  watch(faturaSelecionadaTrancada, (isLocked) => {
    emit('periodoStatusChanged', isLocked)
  }, { immediate: true })

  const faturaAtivaVisualizada = computed(() => {
    const p = periodoSelecionado.value
    return buscarFaturaNoPeriodo(p) || criarFaturaVirtual(
      p,
      getCartoes()[0]?.id || 'PIX_DEFAULT_ID',
      getMembros()[0]?.id || 'virtual-member'
    )
  })

  const listaMesesSeletor = computed(() => {
    const hoje = new Date()
    const list = []
    for (let i = -12; i <= 12; i++) {
      const d = new Date(hoje.getFullYear(), hoje.getMonth() + i, 1)
      const mesIdx = d.getMonth() + 1
      const anoIdx = d.getFullYear()
      const estaFechada = getFaturasFechadas().some(f => f.periodo.mes === mesIdx && f.periodo.ano === anoIdx)
      list.push({
        mes: mesIdx,
        ano: anoIdx,
        nome: formatarMesAno(mesIdx, anoIdx),
        status: (estaFechada ? 'FECHADA' : 'ABERTA') as 'FECHADA' | 'ABERTA'
      })
    }
    return list
  })

  const mesesAbertosOpcoes = computed(() => listaMesesSeletor.value.filter(item => item.status === 'ABERTA'))
  const mesesTrancadosOpcoes = computed(() => listaMesesSeletor.value.filter(item => item.status === 'FECHADA'))

  const currentMonthName = computed(() => {
    const fat = faturaAtivaVisualizada.value
    if (!fat) return 'Mês'
    return NOMES_MESES[fat.periodo.mes - 1]
  })

  const currentYear = computed(() => {
    const fat = faturaAtivaVisualizada.value
    if (!fat) return 'Atual'
    return fat.periodo.ano.toString()
  })

  return {
    periodoSelecionado,
    faturaSelecionadaTrancada,
    faturaAtivaVisualizada,
    faturasPeriodoSelecionado,
    faturasPeriodoIds,
    faturaPixPeriodoSelecionado,
    listaMesesSeletor,
    mesesAbertosOpcoes,
    mesesTrancadosOpcoes,
    currentMonthName,
    currentYear
  }
}
