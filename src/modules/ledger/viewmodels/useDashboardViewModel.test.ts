import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref } from 'vue'
import { useDashboardViewModel } from './useDashboardViewModel'
import type { DashboardProps } from './useDashboardViewModel'
import { Dinheiro } from '../../../shared/primitives/Dinheiro'

// Mocks para os composables de suporte
const mockCartoesEFaturas = {
  registrarReembolsoParcialManual: vi.fn(),
  fecharFaturaManual: vi.fn(),
  quitarAcertoMembro: vi.fn(),
  atualizarGastoCompletoManual: vi.fn(),
  gastos: ref([]),
  acertos: ref([]),
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
  acertosDaFatura: vi.fn(() => []),
  gastosDaFatura: vi.fn(() => []),
  todosOsAcertosQuitados: vi.fn(() => false),
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

// Mocks para repositórios e serviços de domínio
const mockSalvarGasto = vi.fn()
const mockExcluirGasto = vi.fn()

const mockFaturaRolloverService = {
  executarRolloverPeriodo: vi.fn(),
  processarRolloverParcelas: vi.fn(() => []),
  gerarTransacoesNettingSaldoInicial: vi.fn(() => []),
}

describe('useDashboardViewModel', () => {
  const dummyProps: DashboardProps = {
    membros: [{ id: 'm1', nome: 'Luan' }, { id: 'm2', nome: 'Maria' }],
    faturasAbertas: [],
    faturasFechadas: [],
    acertosPendentes: [],
    cartoes: [{ id: 'c1', nome: 'Nubank' }],
    calcularConsumo: () => 0
  }

  const createViewModel = (props = dummyProps, emit = vi.fn(), deps?: any) => {
    const defaultDeps = {
      gastoRepository: {
        salvar: mockSalvarGasto,
        excluir: mockExcluirGasto,
        buscarPorFatura: vi.fn().mockResolvedValue([]),
        listarTodos: vi.fn().mockResolvedValue([])
      },
      faturaRepository: {
        salvar: vi.fn(),
        listarTodas: vi.fn().mockResolvedValue([]),
        buscarPorId: vi.fn().mockResolvedValue(null),
        excluirPorFatura: vi.fn()
      },
      cartaoRepository: {
        listarTodos: vi.fn().mockResolvedValue([]),
        salvar: vi.fn(),
        excluir: vi.fn()
      },
      contaFixaRepository: {
        listarTodas: vi.fn().mockResolvedValue([]),
        salvar: vi.fn(),
        excluir: vi.fn()
      },
      faturaRolloverService: mockFaturaRolloverService as any
    }
    return useDashboardViewModel(props, emit, deps || defaultDeps)
  }

  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    mockUseCartoesEFaturasSpy.mockClear()
    mockUseContasFixasSpy.mockClear()
    mockCartoesEFaturas.gastos.value = []
    mockCartoesEFaturas.acertos.value = []
  })

  it('should initialize selected period from localStorage if available', () => {
    localStorage.setItem('divi_periodo_selecionado', JSON.stringify({ mes: 5, ano: 2026 }))
    const vm = createViewModel(dummyProps, vi.fn())
    expect(vm.periodoSelecionado.value).toEqual({ mes: 5, ano: 2026 })
  })

  it('should fallback to current date if localStorage is empty', () => {
    const vm = createViewModel(dummyProps, vi.fn())
    const hoje = new Date()
    expect(vm.periodoSelecionado.value.mes).toBe(hoje.getMonth() + 1)
    expect(vm.periodoSelecionado.value.ano).toBe(hoje.getFullYear())
  })

  it('should identify lock status of selected period', () => {
    const propsComFaturaFechada = {
      ...dummyProps,
      faturasFechadas: [{ periodo: { mes: 5, ano: 2026 } }]
    }
    localStorage.setItem('divi_periodo_selecionado', JSON.stringify({ mes: 5, ano: 2026 }))
    const emit = vi.fn()
    const vm = createViewModel(propsComFaturaFechada, emit)
    expect(vm.faturaSelecionadaTrancada.value).toBe(true)
    expect(emit).toHaveBeenCalledWith('periodoStatusChanged', true)
  })

  it('should compute month selector list correctly', () => {
    const propsComFaturaFechada = {
      ...dummyProps,
      faturasFechadas: [{ periodo: { mes: 5, ano: 2026 } }]
    }
    const vm = createViewModel(propsComFaturaFechada, vi.fn())
    expect(vm.listaMesesSeletor.value.length).toBe(25)
    const matchingOption = vm.listaMesesSeletor.value.find(
      (m: any) => m.mes === 5 && m.ano === 2026
    )
    expect(matchingOption?.status).toBe('FECHADA')
  })

  it('should toggle historical bottom sheet correctly', () => {
    const vm = createViewModel(dummyProps, vi.fn())
    expect(vm.showBottomSheetHistorico.value).toBe(false)
    vm.showBottomSheetHistorico.value = true
    expect(vm.showBottomSheetHistorico.value).toBe(true)
    vm.showBottomSheetHistorico.value = false
    expect(vm.showBottomSheetHistorico.value).toBe(false)
  })

  it('should configure bill launch popup states', () => {
    const vm = createViewModel(dummyProps, vi.fn())
    const bill = { id: 'luz', name: 'Energia' }
    vm.abrirLancarBill(bill)
    expect(vm.billSelecionada.value).toEqual(bill)
    expect(vm.showPopupLancar.value).toBe(true)
  })

  // --- NOVOS TESTES UNITÁRIOS DE AÇÕES DE NEGÓCIO (TASK 4) ---

  it('should confirm invoice closing and refresh data', async () => {
    const vm = createViewModel(dummyProps, vi.fn())
    vm.showBottomSheetFechar.value = true
    vm.faturaParaFechar.value = { id: 'f1' }

    await vm.confirmarFechamentoFatura('f1', 'm1')

    expect(mockCartoesEFaturas.fecharFaturaManual).toHaveBeenCalledWith('f1', 'm1')
    expect(vm.showBottomSheetFechar.value).toBe(false)
    expect(vm.faturaParaFechar.value).toBeNull()
    expect(mockCartoesEFaturas.inicializar).toHaveBeenCalled()
  })

  it('should confirm expense adjustment and refresh data', async () => {
    const vm = createViewModel(dummyProps, vi.fn())
    const gastoMock = { id: 'g1', descricao: 'Almoço' }
    vm.gastoParaAjustar.value = gastoMock
    vm.showBottomSheetAjustar.value = true

    const dadosAjuste = { descricao: 'Almoço Executivo', valorTotal: Dinheiro.deReais(45) }
    await vm.confirmarAjusteGasto(dadosAjuste)

    expect(mockCartoesEFaturas.atualizarGastoCompletoManual).toHaveBeenCalledWith('g1', dadosAjuste)
    expect(vm.showBottomSheetAjustar.value).toBe(false)
    expect(vm.gastoParaAjustar.value).toBeNull()
    expect(mockCartoesEFaturas.inicializar).toHaveBeenCalled()
  })

  it('should start pix and send reimbursement correctly', async () => {
    const vm = createViewModel(dummyProps, vi.fn())
    const acertoMock = {
      id: 'a1',
      valorAcerto: { centavos: 5000 },
      valorPago: { centavos: 1000 }
    }

    vm.iniciarPix(acertoMock)
    expect(vm.acertoPixId.value).toBe('a1')
    // formatarDinheiro mockado divide por 100, ou seja, (5000 - 1000) / 100 = 40
    expect(vm.valorPixInput.value).toBe(40)

    await vm.enviarReembolsoPix('a1')
    expect(mockCartoesEFaturas.registrarReembolsoParcialManual).toHaveBeenCalledWith('a1', expect.anything())
    expect(vm.acertoPixId.value).toBeNull()
    expect(mockCartoesEFaturas.inicializar).toHaveBeenCalled()
  })

  it('should quit settlement with adjustment', async () => {
    const vm = createViewModel(dummyProps, vi.fn())
    vm.acertoPixId.value = 'a1'

    await vm.quitarComAjuste('a1')
    expect(mockCartoesEFaturas.quitarAcertoMembro).toHaveBeenCalledWith('a1')
    expect(vm.acertoPixId.value).toBeNull()
    expect(mockCartoesEFaturas.inicializar).toHaveBeenCalled()
  })

  it('should launch bill templates correctly', async () => {
    const vm = createViewModel(dummyProps, vi.fn())
    vm.billSelecionada.value = { id: 'b1', name: 'Luz' }
    vm.showPopupLancar.value = true

    const dadosLancamento = { valorReal: 150, compradorId: 'm1', splitIds: ['m1', 'm2'] }
    await vm.confirmarLancarBill(dadosLancamento)

    expect(mockContasFixas.lancarGastoContaFixa).toHaveBeenCalledWith(
      expect.stringContaining('virtual'),
      vm.billSelecionada.value,
      150,
      'm1',
      ['m1', 'm2']
    )
    expect(vm.showPopupLancar.value).toBe(false)
    expect(mockCartoesEFaturas.inicializar).toHaveBeenCalled()
  })

  it('should save and delete bill templates', () => {
    const vm = createViewModel(dummyProps, vi.fn())
    vm.showBottomSheetConfigCF.value = true

    const templateMock = { id: 'b1', name: 'Luz' }
    vm.confirmarSalvarTemplate(templateMock)
    expect(mockContasFixas.salvarContaFixa).toHaveBeenCalledWith(templateMock)
    expect(vm.showBottomSheetConfigCF.value).toBe(false)

    vm.showBottomSheetConfigCF.value = true
    vm.confirmarDeletarTemplate('b1')
    expect(mockContasFixas.excluirContaFixa).toHaveBeenCalledWith('b1')
    expect(vm.showBottomSheetConfigCF.value).toBe(false)
  })

  it('should execute rollover on confirm new period', async () => {
    const vm = createViewModel(dummyProps, vi.fn())
    vm.showBottomSheetNovoPeriodo.value = true
    vm.nomeNovoPeriodo.value = 'Junho 2026'

    await vm.confirmarNovoPeriodo()
    expect(mockFaturaRolloverService.executarRolloverPeriodo).toHaveBeenCalled()
    expect(vm.showBottomSheetNovoPeriodo.value).toBe(false)
    expect(mockCartoesEFaturas.inicializar).toHaveBeenCalled()
  })

  it('should save netting and delete expenses via repository', async () => {
    const vm = createViewModel(dummyProps, vi.fn())
    vm.showBottomSheetNetting.value = true
    vm.nettingTarget.value = { from: 'm1', to: 'm2', val: 50 }

    const dadosNetting = { from: 'm1', to: 'm2', valor: 50, method: 'pix', descricao: 'Netting' }
    await vm.confirmarBaixaNetting(dadosNetting)

    expect(mockSalvarGasto).toHaveBeenCalled()
    expect(vm.showBottomSheetNetting.value).toBe(false)
    expect(vm.nettingTarget.value).toBeNull()
    expect(mockCartoesEFaturas.inicializar).toHaveBeenCalled()

    await vm.excluirGasto('g1')
    expect(mockExcluirGasto).toHaveBeenCalledWith('g1')
    expect(mockCartoesEFaturas.inicializar).toHaveBeenCalled()
  })

  it('should reverse recurring bill expense on confirm', async () => {
    const vm = createViewModel(dummyProps, vi.fn())
    
    const activeFaturaId = vm.faturaAtivaVisualizada.value.id
    mockCartoesEFaturas.gastos.value = [
      { id: 'g-recur', faturaId: activeFaturaId, recurringBillId: 'b1' }
    ] as any

    const confirmSpy = vi.spyOn(window, 'confirm').mockImplementation(() => true)

    await vm.estornarContaFixa({ id: 'b1', name: 'Internet' })

    expect(confirmSpy).toHaveBeenCalled()
    expect(mockExcluirGasto).toHaveBeenCalledWith('g-recur')
    expect(mockCartoesEFaturas.inicializar).toHaveBeenCalled()
  })

  it('should inject dependencies into sub-composables correctly', () => {
    const customCartaoRepo = { listarTodos: vi.fn(), salvar: vi.fn(), excluir: vi.fn() }
    const customContaFixaRepo = { listarTodas: vi.fn(), salvar: vi.fn(), excluir: vi.fn() }

    createViewModel(dummyProps, vi.fn(), {
      cartaoRepository: customCartaoRepo,
      contaFixaRepository: customContaFixaRepo
    })

    expect(mockUseCartoesEFaturasSpy).toHaveBeenCalledWith(expect.objectContaining({
      cartaoRepository: customCartaoRepo
    }))

    expect(mockUseContasFixasSpy).toHaveBeenCalledWith(expect.objectContaining({
      contaFixaRepository: customContaFixaRepo
    }))
  })
})
