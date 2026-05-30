import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref } from 'vue'
import { useDashboardViewModel } from './useDashboardViewModel'
import type { DashboardProps } from './useDashboardViewModel'
import { Dinheiro } from '../models/entities/Dinheiro'
import { Cartao } from '../models/entities/Cartao'
import { Fatura } from '../models/entities/Fatura'
import { AcertoMembro } from '../models/entities/AcertoMembro'
import { Gasto } from '../models/entities/Gasto'
import { DivisaoDeGasto } from '../models/entities/DivisaoDeGasto'
import { useToast } from '../composables/useToast'

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

// Mocks para os composables de suporte
const mockCartoesEFaturas = {
  registrarReembolsoParcialManual: vi.fn(),
  fecharFaturaManual: vi.fn(),
  reabrirFaturaManual: vi.fn(),
  quitarAcertoMembro: vi.fn(),
  atualizarGastoCompletoManual: vi.fn(),
  gastos: ref<Gasto[]>([]),
  acertos: ref<AcertoMembro[]>([]),
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

const mockSalvarGasto = vi.fn()
const mockExcluirGasto = vi.fn()
const mockGastoService = {
  lancarGastoOuEmprestimo: vi.fn().mockResolvedValue(undefined),
  excluirGasto: vi.fn().mockResolvedValue(undefined),
  registrarAcertoNetting: vi.fn().mockResolvedValue(undefined),
  lancarGastoContaFixa: vi.fn().mockResolvedValue(undefined),
  atualizarGastoCompleto: vi.fn().mockResolvedValue(undefined)
}

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
    cartoes: [new Cartao({ id: 'c1', nome: 'Nubank', diaFechamento: 10, responsavelPadraoId: 'm1' })],
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
      faturaRolloverService: mockFaturaRolloverService as any,
      gastoService: mockGastoService
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
    mockGastoService.lancarGastoOuEmprestimo.mockClear()
    mockGastoService.excluirGasto.mockClear()
    mockGastoService.registrarAcertoNetting.mockClear()
    mockGastoService.lancarGastoContaFixa.mockClear()
    mockGastoService.atualizarGastoCompleto.mockClear()
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
    expect(vm.faturaSelecionadaTrancada.value).toBe(true)
    expect(emit).toHaveBeenCalledWith('periodoStatusChanged', true)
  })

  it('should not lock period if one of multiple cards has its invoice closed and others are open', () => {
    const propsComMultiplosCartoes: DashboardProps = {
      ...dummyProps,
      cartoes: [
        new Cartao({ id: 'c1', nome: 'Nubank', diaFechamento: 10, responsavelPadraoId: 'm1' }),
        new Cartao({ id: 'c2', nome: 'Inter', diaFechamento: 15, responsavelPadraoId: 'm1' })
      ],
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
    const vm = createViewModel(propsComMultiplosCartoes, emit)
    expect(vm.faturaSelecionadaTrancada.value).toBe(false)
    expect(emit).toHaveBeenCalledWith('periodoStatusChanged', false)
  })

  it('should NOT lock period if a card has no invoice record for the period (F-11)', () => {
    const propsComCardSemFatura: DashboardProps = {
      ...dummyProps,
      cartoes: [
        new Cartao({ id: 'c1', nome: 'Nubank', diaFechamento: 10, responsavelPadraoId: 'm1' }),
        new Cartao({ id: 'c2', nome: 'Inter', diaFechamento: 15, responsavelPadraoId: 'm1' })
      ],
      faturasFechadas: [
        new Fatura({
          id: 'f-mock-fechada-1',
          cartaoId: 'c1',
          periodo: { mes: 5, ano: 2026 },
          responsavelId: 'm1',
          status: 'FECHADA'
        })
      ],
      faturasAbertas: [] // Card c2 has NO invoice
    }
    localStorage.setItem('divi_periodo_selecionado', JSON.stringify({ mes: 5, ano: 2026 }))
    const vm = createViewModel(propsComCardSemFatura, vi.fn())
    expect(vm.faturaSelecionadaTrancada.value).toBe(false)
  })

  it('should lock period if all of multiple cards have their invoices closed', () => {
    const propsComTodosFechados: DashboardProps = {
      ...dummyProps,
      cartoes: [
        new Cartao({ id: 'c1', nome: 'Nubank', diaFechamento: 10, responsavelPadraoId: 'm1' }),
        new Cartao({ id: 'c2', nome: 'Inter', diaFechamento: 15, responsavelPadraoId: 'm1' })
      ],
      faturasFechadas: [
        new Fatura({
          id: 'f-mock-fechada-1',
          cartaoId: 'c1',
          periodo: { mes: 5, ano: 2026 },
          responsavelId: 'm1',
          status: 'FECHADA'
        }),
        new Fatura({
          id: 'f-mock-fechada-2',
          cartaoId: 'c2',
          periodo: { mes: 5, ano: 2026 },
          responsavelId: 'm1',
          status: 'FECHADA'
        })
      ]
    }
    localStorage.setItem('divi_periodo_selecionado', JSON.stringify({ mes: 5, ano: 2026 }))
    const emit = vi.fn()
    const vm = createViewModel(propsComTodosFechados, emit)
    expect(vm.faturaSelecionadaTrancada.value).toBe(true)
    expect(emit).toHaveBeenCalledWith('periodoStatusChanged', true)
  })

  it('should compute month selector list correctly', () => {
    const propsComFaturaFechada: DashboardProps = {
      ...dummyProps,
      faturasFechadas: [
        new Fatura({
          id: 'f-mock-fechada-2',
          cartaoId: 'c1',
          periodo: { mes: 5, ano: 2026 },
          responsavelId: 'm1',
          status: 'FECHADA'
        })
      ]
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

    // fecharFaturaManual é chamado e os estados de UI são limpos corretamente.
    // O reload (inicializar) ocorre dentro de fecharFaturaManual, não em confirmarFechamentoFatura.
    expect(mockCartoesEFaturas.fecharFaturaManual).toHaveBeenCalledWith('f1', 'm1')
    expect(vm.showBottomSheetFechar.value).toBe(false)
    expect(vm.faturaParaFechar.value).toBeNull()
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
    const acertoMock = new AcertoMembro({
      id: 'a1',
      faturaId: 'f1',
      membroId: 'm1',
      totalConsumido: Dinheiro.deCentavos(5000),
      valorPago: Dinheiro.deCentavos(1000)
    })

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

    const dadosLancamento = { valorCentavos: 15000, compradorId: 'm1', splitIds: ['m1', 'm2'] }
    await vm.confirmarLancarBill(dadosLancamento)

    expect(mockContasFixas.lancarGastoContaFixa).toHaveBeenCalledWith(
      expect.stringContaining('PIX_DEFAULT_ID'),
      vm.billSelecionada.value,
      15000,
      'm1',
      ['m1', 'm2']
    )
    expect(vm.showPopupLancar.value).toBe(false)
    expect(mockCartoesEFaturas.inicializar).toHaveBeenCalled()
  })

  it('should launch bill even if period is locked', async () => {
    const propsWithLockedMonth: DashboardProps = {
      ...dummyProps,
      faturasFechadas: [
        new Fatura({
          id: 'f-c1-5-2026',
          cartaoId: 'c1',
          periodo: { mes: 5, ano: 2026 },
          responsavelId: 'm1',
          status: 'FECHADA'
        })
      ]
    }
    vi.setSystemTime(new Date(2026, 4, 1))

    const vm = createViewModel(propsWithLockedMonth, vi.fn())
    
    // Verificar se o ViewModel identificou que está trancado
    expect(vm.faturaSelecionadaTrancada.value).toBe(true)

    vm.billSelecionada.value = { id: 'b1', name: 'Luz' }
    vm.showPopupLancar.value = true

    const dadosLancamento = { valorCentavos: 15000, compradorId: 'm1', splitIds: ['m1', 'm2'] }
    await vm.confirmarLancarBill(dadosLancamento)

    expect(mockContasFixas.lancarGastoContaFixa).toHaveBeenCalled()
    expect(vm.showPopupLancar.value).toBe(false) 

    vi.useRealTimers()
  })

  it('should adjust expense even if period is locked', async () => {
    const propsWithLockedMonth: DashboardProps = {
      ...dummyProps,
      faturasFechadas: [
        new Fatura({
          id: 'f1',
          cartaoId: 'c1',
          periodo: { mes: 5, ano: 2026 },
          responsavelId: 'm1',
          status: 'FECHADA'
        })
      ]
    }
    vi.setSystemTime(new Date(2026, 4, 1))
    const vm = createViewModel(propsWithLockedMonth, vi.fn())
    
    vm.gastoParaAjustar.value = { id: 'g1' } as any
    await vm.confirmarAjusteGasto({ descricao: 'Novo' } as any)

    expect(mockCartoesEFaturas.atualizarGastoCompletoManual).toHaveBeenCalledWith('g1', { descricao: 'Novo' })
    vi.useRealTimers()
  })

  it('should delete expense even if period is locked', async () => {
    const propsWithLockedMonth: DashboardProps = {
      ...dummyProps,
      faturasFechadas: [
        new Fatura({
          id: 'f1',
          cartaoId: 'c1',
          periodo: { mes: 5, ano: 2026 },
          responsavelId: 'm1',
          status: 'FECHADA'
        })
      ]
    }
    vi.setSystemTime(new Date(2026, 4, 1))
    const vm = createViewModel(propsWithLockedMonth, vi.fn())
    
    await vm.excluirGasto('g1')

    expect(mockGastoService.excluirGasto).toHaveBeenCalledWith('g1')
    vi.useRealTimers()
  })

  it('should save and delete bill templates via confirmation', async () => {
    const vm = createViewModel(dummyProps, vi.fn())
    vm.showBottomSheetConfigCF.value = true

    const templateMock = { id: 'b1', name: 'Luz' }
    vm.confirmarSalvarTemplate(templateMock)
    expect(mockContasFixas.salvarContaFixa).toHaveBeenCalledWith(templateMock)
    expect(vm.showBottomSheetConfigCF.value).toBe(false)

    // Simula abertura de confirmação a partir do componente de configuração
    vm.abrirConfirmacaoEstornoBill(templateMock)
    expect(vm.showBottomSheetConfirmacaoEstorno.value).toBe(true)
    
    await vm.confirmarEstorno()
    expect(mockContasFixas.excluirContaFixa).toHaveBeenCalledWith('b1')
    expect(vm.showBottomSheetConfirmacaoEstorno.value).toBe(false)
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

    expect(mockGastoService.registrarAcertoNetting).toHaveBeenCalled()
    expect(vm.showBottomSheetNetting.value).toBe(false)
    expect(vm.nettingTarget.value).toBeNull()
    expect(mockCartoesEFaturas.inicializar).toHaveBeenCalled()

    await vm.excluirGasto('g1')
    expect(mockGastoService.excluirGasto).toHaveBeenCalledWith('g1')
    expect(mockCartoesEFaturas.inicializar).toHaveBeenCalled()
  })

  it('should reverse recurring bill expense on confirm', async () => {
    const vm = createViewModel(dummyProps, vi.fn())
    
    const activeFaturaId = vm.faturaAtivaVisualizada.value.id
    mockCartoesEFaturas.gastos.value = [
      { id: 'g-recur', faturaId: activeFaturaId, recurringBillId: 'b1' }
    ] as any

    await vm.estornarContaFixa({ id: 'b1', name: 'Internet' })

    // Agora deve abrir o BottomSheet em vez de confirm()
    expect(vm.showBottomSheetConfirmacaoEstorno.value).toBe(true)
    expect(vm.itemParaEstornar.value).toEqual({ id: 'g-recur', faturaId: activeFaturaId, recurringBillId: 'b1' })

    await vm.confirmarEstorno()

    expect(mockGastoService.excluirGasto).toHaveBeenCalledWith('g-recur')
    expect(mockCartoesEFaturas.inicializar).toHaveBeenCalled()
    expect(vm.showBottomSheetConfirmacaoEstorno.value).toBe(false)
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

  it('should consolidate expenses from multiple invoices of the same period in gastosFaturaSelecionada', () => {
    const fat1 = new Fatura({ id: 'f1', cartaoId: 'c1', periodo: { mes: 5, ano: 2026 }, responsavelId: 'm1', status: 'ABERTA' })
    const fat2 = new Fatura({ id: 'f2', cartaoId: 'c2', periodo: { mes: 5, ano: 2026 }, responsavelId: 'm1', status: 'ABERTA' })

    const propsComMultiplasFaturas: DashboardProps = {
      ...dummyProps,
      cartoes: [
        new Cartao({ id: 'c1', nome: 'Nubank', diaFechamento: 10, responsavelPadraoId: 'm1' }),
        new Cartao({ id: 'c2', nome: 'Inter', diaFechamento: 15, responsavelPadraoId: 'm1' })
      ],
      faturasAbertas: [fat1, fat2]
    }
    mockCartoesEFaturas.faturas.value = [fat1, fat2]
    mockCartoesEFaturas.gastos.value = [
      { id: 'g1', faturaId: 'f1', descricao: 'Gasto Cartão 1', divisoes: [] },
      { id: 'g2', faturaId: 'f2', descricao: 'Gasto Cartão 2', divisoes: [] },
      { id: 'g3', faturaId: 'f3', descricao: 'Gasto de Outro Mes', divisoes: [] }
    ] as any

    const vm = createViewModel(propsComMultiplasFaturas, vi.fn())
    vm.periodoSelecionado.value = { mes: 5, ano: 2026 }

    expect(vm.gastosFaturaSelecionada.value.length).toBe(2)
    expect(vm.gastosFaturaSelecionada.value.map((g: any) => g.id)).toContain('g1')
    expect(vm.gastosFaturaSelecionada.value.map((g: any) => g.id)).toContain('g2')
  })

  it('should call reabrirFaturaManual for all closed invoices of the period on reabrirPeriodoSelecionado', async () => {
    const propsComFaturasFechadas: DashboardProps = {
      ...dummyProps,
      faturasFechadas: [
        new Fatura({ id: 'f1', cartaoId: 'c1', periodo: { mes: 5, ano: 2026 }, responsavelId: 'm1', status: 'FECHADA' }),
        new Fatura({ id: 'f2', cartaoId: 'c2', periodo: { mes: 5, ano: 2026 }, responsavelId: 'm1', status: 'FECHADA' })
      ]
    }
    const vm = createViewModel(propsComFaturasFechadas, vi.fn())
    vm.periodoSelecionado.value = { mes: 5, ano: 2026 }

    await vm.reabrirPeriodoSelecionado()

    expect(mockCartoesEFaturas.reabrirFaturaManual).toHaveBeenCalledWith('f1')
    expect(mockCartoesEFaturas.reabrirFaturaManual).toHaveBeenCalledWith('f2')
    expect(mockCartoesEFaturas.inicializar).toHaveBeenCalled()
  })

  // GAP 1 — bloquear reabertura de período quando há acertos já pagos
  it('(GAP1) deve bloquear reabertura de periodo quando existe acerto ja pago e exibir toast de erro', async () => {
    const faturaFechada = new Fatura({ id: 'f1', cartaoId: 'c1', periodo: { mes: 5, ano: 2026 }, responsavelId: 'm1', status: 'FECHADA' })
    const acertoJaPago = new AcertoMembro({
      id: 'a1',
      faturaId: 'f1',
      membroId: 'm2',
      totalConsumido: Dinheiro.deReais(100),
      valorPago: Dinheiro.deReais(100),
      pago: true
    })

    const propsComAcertoPago: DashboardProps = {
      ...dummyProps,
      faturasFechadas: [faturaFechada],
      acertosPendentes: [acertoJaPago]
    }
    const vm = createViewModel(propsComAcertoPago, vi.fn())
    vm.periodoSelecionado.value = { mes: 5, ano: 2026 }

    await vm.reabrirPeriodoSelecionado()

    // Não deve ter chamado reabrirFaturaManual
    expect(mockCartoesEFaturas.reabrirFaturaManual).not.toHaveBeenCalled()
    // Deve exibir toast de erro
    const toast = useToast()
    expect(toast.show).toHaveBeenCalledWith(
      expect.stringContaining('pagamentos (Pix/Acertos) confirmados'),
      'error'
    )
  })

  // GAP 1 — permitir reabertura quando acerto existe mas não foi pago ainda
  it('(GAP1) deve permitir reabertura de periodo quando acerto existe mas nao foi pago', async () => {
    const faturaFechada = new Fatura({ id: 'f1', cartaoId: 'c1', periodo: { mes: 5, ano: 2026 }, responsavelId: 'm1', status: 'FECHADA' })
    const acertoNaoPago = new AcertoMembro({
      id: 'a1',
      faturaId: 'f1',
      membroId: 'm2',
      totalConsumido: Dinheiro.deReais(100),
      valorPago: Dinheiro.deCentavos(0),
      pago: false
    })

    const props: DashboardProps = {
      ...dummyProps,
      faturasFechadas: [faturaFechada],
      acertosPendentes: [acertoNaoPago]
    }
    const vm = createViewModel(props, vi.fn())
    vm.periodoSelecionado.value = { mes: 5, ano: 2026 }

    await vm.reabrirPeriodoSelecionado()

    // Deve ter chamado reabrirFaturaManual normalmente
    expect(mockCartoesEFaturas.reabrirFaturaManual).toHaveBeenCalledWith('f1')
  })

  it('should include virtual pix invoice expenses in gastosFaturaSelecionada even if no database invoice exists', () => {
    const propsSemFaturas: DashboardProps = {
      ...dummyProps,
      faturasAbertas: [],
      faturasFechadas: []
    }
    
    mockCartoesEFaturas.gastos.value = [
      { id: 'g-pix-virtual', faturaId: 'PIX_DEFAULT_ID-6-2026', descricao: 'Reprepasse Netting', divisoes: [] }
    ] as any

    const vm = createViewModel(propsSemFaturas, vi.fn())
    vm.periodoSelecionado.value = { mes: 6, ano: 2026 }

    expect(vm.faturasPeriodoIds.value).toContain('PIX_DEFAULT_ID-6-2026')
    expect(vm.gastosFaturaSelecionada.value.length).toBe(1)
    expect(vm.gastosFaturaSelecionada.value[0].id).toBe('g-pix-virtual')
  })

  it('deve impedir exclusao de gasto comum se houver acertos confirmados no periodo', async () => {
    const mockGastoComum = {
      id: 'g-comum',
      faturaId: 'f1',
      descricao: 'Gasto Comum',
      cardOwner: null,
      isSettlement: false,
      valorTotal: { centavos: 1000 }
    } as any

    const mockAcertoConfirmado = {
      id: 'a1',
      faturaId: 'f1',
      pago: true,
      valorPago: { centavos: 1000 }
    } as any

    const customProps = {
      membros: [{ id: 'm1', nome: 'Luan' }, { id: 'm2', nome: 'Maria' }],
      faturasAbertas: [],
      faturasFechadas: [],
      acertosPendentes: [mockAcertoConfirmado],
      cartoes: [new Cartao({ id: 'c1', nome: 'Nubank', diaFechamento: 10, responsavelPadraoId: 'm1' })],
      calcularConsumo: () => 0
    }
    
    const vm = createViewModel(customProps, vi.fn())
    
    // Configura o item a ser estornado no UI state do vm
    vm.itemParaEstornar.value = mockGastoComum
    vm.itemTypeParaEstornar.value = 'Lançamento'
    
    // Dispara a tentativa de estorno
    await vm.confirmarEstorno()
    
    // Garante que o toast de erro foi chamado
    const toast = useToast()
    expect(toast.show).toHaveBeenCalledWith(
      'Não é possível excluir gastos comuns neste período pois já existem acertos de contas (Pix) confirmados. Estorne os acertos primeiro',
      'error'
    )
    
    // Garante que o service de excluir gasto NÃO foi chamado
    expect(mockGastoService.excluirGasto).not.toHaveBeenCalled()
  })

  it('deve exibir toast de erro se a exclusão do gasto falhar no serviço', async () => {
    const errorMsg = 'Falha de conexão com a base de dados'
    mockGastoService.excluirGasto.mockRejectedValueOnce(new Error(errorMsg))
    
    mockCartoesEFaturas.gastos.value = [
      { id: 'g-id-erro', faturaId: 'f1', cardOwner: 'c1' }
    ] as any

    const vm = createViewModel(dummyProps, vi.fn())
    await vm.excluirGasto('g-id-erro')

    const toast = useToast()
    expect(toast.show).toHaveBeenCalledWith(errorMsg, 'error')
  })

  it('deve incluir acertos de faturas fechadas no netting e ignorar os gastos originais da fatura fechada', async () => {
    const faturaFechada = new Fatura({ id: 'f1', cartaoId: 'c1', periodo: { mes: 5, ano: 2026 }, responsavelId: 'm1', status: 'FECHADA' })
    const acertoPendente = new AcertoMembro({
      id: 'a1',
      faturaId: 'f1',
      membroId: 'm2',
      totalConsumido: Dinheiro.deReais(100),
      valorPago: Dinheiro.deCentavos(0),
      pago: false,
      tipo: 'MEMBRO_PAGA'
    })

    const gastoOriginal = new Gasto({
      id: 'g1',
      faturaId: 'f1',
      descricao: 'Gasto original',
      valorTotal: Dinheiro.deReais(100),
      compradorId: 'm1',
      divisoes: [new DivisaoDeGasto('m2', Dinheiro.deReais(100))],
      method: 'card',
      cardOwner: 'm1'
    })

    const props: DashboardProps = {
      membros: [{ id: 'm1', nome: 'Luan' }, { id: 'm2', nome: 'Maria' }],
      faturasAbertas: [],
      faturasFechadas: [faturaFechada],
      acertosPendentes: [acertoPendente],
      cartoes: [new Cartao({ id: 'c1', nome: 'Nubank', diaFechamento: 10, responsavelPadraoId: 'm1' })],
      calcularConsumo: () => 0
    }
    
    mockCartoesEFaturas.gastos.value = [gastoOriginal]

    const vm = createViewModel(props, vi.fn())
    vm.periodoSelecionado.value = { mes: 5, ano: 2026 }

    expect(vm.nettingTransferencias.value.length).toBe(1)
    expect(vm.nettingTransferencias.value[0]).toEqual(expect.objectContaining({
      from: 'm2',
      to: 'm1',
      val: 100
    }))
  })
})
