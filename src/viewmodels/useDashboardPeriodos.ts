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
    
    return [...abertas, ...fechadas]
  }

  const criarFaturaVirtual = (p: { mes: number; ano: number }, cartaoId: string, responsavelId: string): Fatura => {
    return new Fatura({
      id: `${cartaoId}-${p.mes}-${p.ano}`,
      cartaoId,
      periodo: { mes: p.mes, ano: p.ano },
      responsavelId,
      status: 'ABERTA'
    })
  }

  const faturasPeriodoSelecionado = computed(() => {
    const p = periodoSelecionado.value
    const faturasExistentes = buscarFaturasNoPeriodo(p)
    const todosCartoes = getCartoes()
    const membros = getMembros()
    
    if (todosCartoes.length === 0) {
      const existePix = faturasExistentes.find(f => f.cartaoId === 'PIX_DEFAULT_ID')
      if (existePix) return faturasExistentes
      return [...faturasExistentes, criarFaturaVirtual(p, 'PIX_DEFAULT_ID', membros[0]?.id || 'virtual-member')]
    }

    const listaFinal: Fatura[] = todosCartoes.map(cartao => {
      const existente = faturasExistentes.find(f => f.cartaoId === cartao.id)
      if (existente) return existente
      return criarFaturaVirtual(p, cartao.id, cartao.responsavelPadraoId || membros[0]?.id || 'virtual-member')
    })

    const pixExistente = faturasExistentes.find(f => f.cartaoId === 'PIX_DEFAULT_ID')
    if (pixExistente) {
      listaFinal.push(pixExistente)
    } else {
      listaFinal.push(criarFaturaVirtual(p, 'PIX_DEFAULT_ID', 'PIX_SYSTEM_OWNER'))
    }

    for (const fatura of faturasExistentes) {
      const jaIncluida = listaFinal.some(f => f.id === fatura.id)
      const cartaoAindaExiste = todosCartoes.some(cartao => cartao.id === fatura.cartaoId)
      if (!jaIncluida && !cartaoAindaExiste && fatura.cartaoId !== 'PIX_DEFAULT_ID') {
        listaFinal.push(fatura)
      }
    }

    return listaFinal.sort((a, b) => {
      if (a.cartaoId === 'PIX_DEFAULT_ID') return 1
      if (b.cartaoId === 'PIX_DEFAULT_ID') return -1
      if (a.cartaoId < b.cartaoId) return -1
      if (a.cartaoId > b.cartaoId) return 1
      return 0
    })
  })

  const faturaPixPeriodoSelecionado = computed(() => {
    const p = periodoSelecionado.value
    const pix = faturasPeriodoSelecionado.value.find(f => f.cartaoId === 'PIX_DEFAULT_ID')
    if (pix) return pix

    return criarFaturaVirtual(p, 'PIX_DEFAULT_ID', 'PIX_SYSTEM_OWNER')
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

  const faturaSelecionadaFechada = computed(() => verificarPeriodoTrancado(periodoSelecionado.value))

  watch(faturaSelecionadaFechada, (isLocked) => {
    emit('periodoStatusChanged', isLocked)
  }, { immediate: true })

  const faturaAtivaVisualizada = computed(() => {
    return faturasPeriodoSelecionado.value[0]
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

  const setPeriodoSelecionado = (mes: number, ano: number) => {
    periodoSelecionado.value = { mes, ano }
  }

  return {
    periodoSelecionado,
    setPeriodoSelecionado,
    faturaSelecionadaFechada,
    faturaAtivaVisualizada,
    faturasPeriodoSelecionado,
    faturaPixPeriodoSelecionado,
    listaMesesSeletor,
    mesesAbertosOpcoes,
    mesesTrancadosOpcoes,
    currentMonthName,
    currentYear
  }
}
