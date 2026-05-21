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

  it('should identify lock status of selected period', () => {
    const dummyProps = {
      membros: [],
      faturasAbertas: [],
      faturasFechadas: [{ periodo: { mes: 5, ano: 2026 } }],
      acertosPendentes: [],
      cartoes: [],
      calcularConsumo: () => 0
    }
    localStorage.setItem('divi_periodo_selecionado', JSON.stringify({ mes: 5, ano: 2026 }))
    const emit = vi.fn()
    const vm = useDashboardViewModel(dummyProps, emit)
    expect(vm.faturaSelecionadaTrancada.value).toBe(true)
    expect(emit).toHaveBeenCalledWith('periodoStatusChanged', true)
  })

  it('should compute month selector list correctly', () => {
    const dummyProps = {
      membros: [],
      faturasAbertas: [],
      faturasFechadas: [{ periodo: { mes: 5, ano: 2026 } }],
      acertosPendentes: [],
      cartoes: [],
      calcularConsumo: () => 0
    }
    const vm = useDashboardViewModel(dummyProps, vi.fn())
    expect(vm.listaMesesSeletor.value.length).toBe(25) // de -12 a +12 meses
    const matchingOption = vm.listaMesesSeletor.value.find(
      (m: any) => m.mes === 5 && m.ano === 2026
    )
    expect(matchingOption?.status).toBe('FECHADA')
  })
})
