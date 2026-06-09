import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref } from 'vue'
import { useDashboardViewModel } from './useDashboardViewModel'
import type { DashboardProps } from './useDashboardViewModel'
import { Dinheiro } from '../models/entities/Dinheiro'
import { Cartao } from '../models/entities/Cartao'
import { Fatura } from '../models/entities/Fatura'
import { Gasto } from '../models/entities/Gasto'

vi.mock('../composables/useToast', () => {
  const showMock = vi.fn()
  const hideMock = vi.fn()
  return {
    useToast: () => ({
      show: showMock,
      hide: hideMock,
      visible: ref(false)
    })
  }
})

const mockCartoesEFaturas = {
  registrarReembolsoParcialManual: vi.fn(),
  fecharFatura: vi.fn(),
  reabrirFatura: vi.fn(),
  atualizarGasto: vi.fn(),
  gastos: ref<Gasto[]>([]),
  faturas: ref<Fatura[]>([]),
  inicializar: vi.fn(),
}

const mockContasFixas = {
  contasFixas: ref([]),
  salvarContaFixa: vi.fn(),
  excluirContaFixa: vi.fn(),
  lancarGastoContaFixa: vi.fn(),
}

const mockCalculations = {
  getMembroNome: vi.fn((id) => `Membro ${id}`),
  formatarDinheiro: vi.fn((c) => c / 100),
  calcularTotalFatura: vi.fn(() => 0),
  gastosDaFatura: vi.fn(() => []),
  currentMonthName: ref('Maio'),
  currentYear: ref(2026),
  parcelasFuturasDetalhadas: ref([]),
}

const mockUseCartoesEFaturasSpy = vi.fn<(deps?: any) => any>(() => mockCartoesEFaturas)
const mockUseContasFixasSpy = vi.fn<(deps?: any) => any>(() => mockContasFixas)

vi.mock('./useCartoesEFaturas', () => ({
  useCartoesEFaturas: (deps?: any) => mockUseCartoesEFaturasSpy(deps)
}))

vi.mock('./useContasFixas', () => ({
  useContasFixas: (deps?: any) => mockUseContasFixasSpy(deps)
}))

vi.mock('./useDashboardCalculations', () => ({
  useDashboardCalculations: () => mockCalculations
}))



describe('useDashboardViewModel', () => {
  const dummyProps: DashboardProps = {
    membros: [{ id: 'm1', nome: 'Luan' }, { id: 'm2', nome: 'Maria' }],
    faturasAbertas: [],
    faturasFechadas: [],
    cartoes: [new Cartao({ id: 'c1', nome: 'Nubank', diaFechamento: 10, responsavelPadraoId: 'm1' })]
  }

  const createViewModel = (props = dummyProps, emit = vi.fn()) => {
    return useDashboardViewModel(props, emit)
  }

  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    mockUseCartoesEFaturasSpy.mockClear()
    mockUseContasFixasSpy.mockClear()
    mockCartoesEFaturas.gastos.value = []

  })

  it('should initialize selected period from localStorage if available', () => {
    localStorage.setItem('divi_periodo_selecionado', JSON.stringify({ mes: 5, ano: 2026 }))
    const vm = createViewModel(dummyProps, vi.fn())
    expect(vm.periodoSelecionado.value).toEqual({ mes: 5, ano: 2026 })
  })

  it('should identify lock status of selected period', () => {
    const propsComFaturaFechada: DashboardProps = {
      ...dummyProps,
      faturasFechadas: [
        new Fatura({
          id: 'f-mock-fechada-1',
          cartaoId: 'c1',
          periodo: { mes: 5, ano: 2026 },
          responsavelId: 'm1',
          status: 'FECHADA'
        })
      ]
    }
    localStorage.setItem('divi_periodo_selecionado', JSON.stringify({ mes: 5, ano: 2026 }))
    const emit = vi.fn()
    const vm = createViewModel(propsComFaturaFechada, emit)
    expect(vm.faturaSelecionadaFechada.value).toBe(true)
    expect(emit).toHaveBeenCalledWith('periodoStatusChanged', true)
  })

  it('should confirm expense adjustment and refresh data', async () => {
    const vm = createViewModel(dummyProps, vi.fn())
    const gastoMock = { id: 'g1', descricao: 'Almoço' }
    vm.gastoParaAjustar.value = gastoMock as any
    vm.abrirModal('ajustar-gasto')

    const dadosAjuste = { descricao: 'Almoço Executivo', valorTotal: Dinheiro.deReais(45) }
    await vm.confirmarAjusteGasto(dadosAjuste as any)

    expect(mockCartoesEFaturas.atualizarGasto).toHaveBeenCalledWith('g1', dadosAjuste)
    expect(vm.isModalNoTopo('ajustar-gasto')).toBe(false)
    expect(vm.gastoParaAjustar.value).toBeNull()
  })
})
