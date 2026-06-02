import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick, reactive, ref } from 'vue'
import DashboardSaldos from './DashboardSaldos.vue'

const mockUseDashboardViewModel = vi.hoisted(() => vi.fn())
const mockUseCasasMultitenant = vi.hoisted(() => vi.fn())

vi.mock('../../viewmodels/useDashboardViewModel', () => ({
  useDashboardViewModel: mockUseDashboardViewModel
}))

vi.mock('../../viewmodels/useCasasMultitenant', () => ({
  useCasasMultitenant: mockUseCasasMultitenant
}))

const stub = { template: '<div />' }

const mountDashboard = (props: { activeTab?: 'hoje' | 'faturas'; isLoading?: boolean } = {}) => mount(DashboardSaldos, {
  props: {
    membros: [],
    faturasAbertas: [],
    faturasFechadas: [],
    cartoes: [],
    activeTab: 'hoje',
    isLoading: false,
    ...props
  },
  global: {
    stubs: {
      ActivityFeed: stub,
      Button: stub,
      Card: stub,
      ContasFixasPanel: stub,
      DashboardHeader: stub,
      DashboardModalsManager: stub,
      DetalhamentoSaldosCard: stub,
      IllustrationMascot: stub,
      NettingPanel: stub,
      UnifiedBalancePanel: stub
    }
  }
})

describe('DashboardSaldos loading', () => {
  beforeEach(() => {
    mockUseDashboardViewModel.mockReturnValue({
      faturaSelecionadaFechada: ref(false),
      saldosUnificadosAtivos: ref([]),
      nettingTransferencias: ref(Array.from({ length: 4 }, (_, index) => ({ id: `netting-${index}` }))),
      membrosVisiveis: ref(Array.from({ length: 4 }, (_, index) => ({ id: `member-${index}`, nome: `Membro ${index}` }))),
      contasFixas: ref(Array.from({ length: 6 }, (_, index) => ({ id: `fixed-${index}` }))),
      gastosFaturaSelecionada: ref(Array.from({ length: 7 }, (_, index) => ({ id: `expense-${index}` }))),
      getMembroNome: vi.fn(),
      currentMonthName: ref('Junho'),
      currentYear: ref(2026),
      abrirLancarBill: vi.fn(),
      abrirConfigurarBill: vi.fn(),
      abrirNovoBill: vi.fn(),
      abrirAjustarGasto: vi.fn(),
      abrirConfirmacaoEstornoGasto: vi.fn(),
      abrirBottomSheetNetting: vi.fn(),
      abrirNovoPeriodoBottomSheet: vi.fn(),
      estornarContaFixa: vi.fn(),
      totalLancamentosPeriodoSelecionado: ref(1),
      reabrirPeriodoSelecionado: vi.fn(),
      abrirModal: vi.fn(),
      isDropdownAbertosOpen: ref(false),
      periodoSelecionado: ref({ mes: 6, ano: 2026 })
    })

    mockUseCasasMultitenant.mockReturnValue({
      isAuthed: ref(true),
      activeTenantId: ref('tenant-123'),
      casas: ref([]),
      showBottomSheetCasas: ref(false),
      form: reactive({ nomeNovaCasa: '', codigoConvite: '', errorCasa: '' }),
      copiedCode: ref(null),
      activeTenantObj: ref(null),
      selecionarCasa: vi.fn(),
      criarNovaCasa: vi.fn(),
      entrarPorCodigo: vi.fn(),
      copyInviteCode: vi.fn(),
      handleLogoutClick: vi.fn()
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('does not render the skeleton when switching tabs without a data wait', async () => {
    vi.useFakeTimers()
    const wrapper = mountDashboard()

    await wrapper.setProps({ activeTab: 'faturas' })
    await nextTick()

    expect(wrapper.find('[data-testid="skeleton-mimic"]').exists()).toBe(false)

    vi.advanceTimersByTime(701)
    await nextTick()

    expect(wrapper.find('[data-testid="skeleton-mimic"]').exists()).toBe(false)
  })

  it('renders bounded faithful row counts for real hoje data waits', () => {
    const wrapper = mountDashboard({ isLoading: true })

    expect(wrapper.findAll('[data-testid="skeleton-balance-row"]')).toHaveLength(4)
    expect(wrapper.findAll('[data-testid="skeleton-fixed-bill-row"]')).toHaveLength(5)
    expect(wrapper.findAll('[data-testid="skeleton-activity-row"]')).toHaveLength(5)
    expect(wrapper.findAll('[data-testid="skeleton-netting-row"]')).toHaveLength(3)
  })

  it('renders the faithful faturas breakdown for real data waits', () => {
    const wrapper = mountDashboard({ activeTab: 'faturas', isLoading: true })

    expect(wrapper.findAll('[data-testid="skeleton-member-breakdown"]')).toHaveLength(4)
    expect(wrapper.findAll('[data-testid="skeleton-financial-summary"]')).toHaveLength(12)
  })
})
