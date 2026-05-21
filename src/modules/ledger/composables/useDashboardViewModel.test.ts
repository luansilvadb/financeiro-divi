import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useDashboardViewModel } from './useDashboardViewModel'

describe('useDashboardViewModel', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('should initialize selected period from localStorage if available', () => {
    localStorage.setItem('divi_periodo_selecionado', JSON.stringify({ mes: 5, ano: 2026 }))
    const dummyProps = {
      membros: [],
      faturasAbertas: [],
      faturasFechadas: [],
      acertosPendentes: [],
      cartoes: [],
      calcularConsumo: () => 0
    }
    const vm = useDashboardViewModel(dummyProps, vi.fn())
    expect(vm.periodoSelecionado.value).toEqual({ mes: 5, ano: 2026 })
  })

  it('should fallback to current date if localStorage is empty', () => {
    const dummyProps = {
      membros: [],
      faturasAbertas: [],
      faturasFechadas: [],
      acertosPendentes: [],
      cartoes: [],
      calcularConsumo: () => 0
    }
    const vm = useDashboardViewModel(dummyProps, vi.fn())
    const hoje = new Date()
    expect(vm.periodoSelecionado.value.mes).toBe(hoje.getMonth() + 1)
    expect(vm.periodoSelecionado.value.ano).toBe(hoje.getFullYear())
  })
})
