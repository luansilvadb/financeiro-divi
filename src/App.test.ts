import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { ref } from 'vue'
import App from './App.vue'

const {
  inicializarSessao,
  inicializarMembros,
  recarregarMembros,
  inicializarCartoes,
  inicializarContasFixas
} = vi.hoisted(() => ({
  inicializarSessao: vi.fn().mockResolvedValue(undefined),
  inicializarMembros: vi.fn().mockResolvedValue(undefined),
  recarregarMembros: vi.fn().mockResolvedValue(undefined),
  inicializarCartoes: vi.fn().mockResolvedValue(undefined),
  inicializarContasFixas: vi.fn().mockResolvedValue(undefined)
}))

vi.mock('./shared/container', () => ({
  tenantSessionService: {
    isAuthenticated: () => true,
    getActiveTenantId: () => 'tenant-123',
    getCurrentUserId: () => 'user-123',
    inicializarSessao
  },
  migrationService: {
    migrar: vi.fn()
  },
  socketService: {
    conectar: vi.fn(),
    desconectar: vi.fn(),
    on: vi.fn(),
    off: vi.fn()
  }
}))

vi.mock('./viewmodels/useMembros', () => ({
  useMembros: () => ({
    ativos: ref([]),
    membros: ref([]),
    inicializar: inicializarMembros,
    carregar: recarregarMembros
  }),
}))

vi.mock('./viewmodels/useCartoesEFaturas', () => ({
  useCartoesEFaturas: () => ({
    cartoes: ref([]),
    acertos: ref([]),
    faturasAbertas: ref([]),
    faturasFechadas: ref([]),
    inicializar: inicializarCartoes,
    fecharFatura: vi.fn(),
    reabrirFatura: vi.fn(),
    quitarAcertoMembro: vi.fn(),
    calcularAdiantamentoMembro: vi.fn(() => 0),
  }),
}))

vi.mock('./viewmodels/useStorageSync', () => ({
  useStorageSync: vi.fn(),
}))

vi.mock('./viewmodels/useContasFixas', () => ({
  useContasFixas: () => ({
    contasFixas: ref([]),
    salvarContaFixa: vi.fn(),
    excluirContaFixa: vi.fn(),
    lancarGastoContaFixa: vi.fn(),
    carregarTemplates: inicializarContasFixas,
    resetar: vi.fn()
  }),
}))

const isAnyBottomSheetOpenMock = ref(false)
vi.mock('./viewmodels/useBottomSheetState', () => ({
  useBottomSheetState: () => ({
    isAnyBottomSheetOpen: isAnyBottomSheetOpenMock,
  }),
}))

describe('App FAB', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  const mountApp = () => mount(App, {
    global: {
      stubs: {
        DashboardSaldos: {
          props: ['isLoading'],
          template: '<div data-testid="dashboard-stub" :data-loading="String(isLoading)" />'
        },
        NovoLancamentoWizard: true,
        ConfiguracoesMembros: true,
        BottomSheet: {
          template: '<div><slot /></div>',
        },
        BottomTabBar: true,
        IllustrationMascot: true,
        LoginScreen: true,
        TenantSelectorScreen: true,
        ToastNotification: true
      },
    },
  })

  it('terminates initial dashboard loading without a minimum timeout', async () => {
    vi.useFakeTimers()
    const wrapper = mountApp()

    await flushPromises()

    expect(wrapper.get('[data-testid="dashboard-stub"]').attributes('data-loading')).toBe('false')
    expect(vi.getTimerCount()).toBe(0)
  })

  it('renderiza o FAB circular sem texto', async () => {
    vi.useFakeTimers()
    const wrapper = mountApp()

    await flushPromises()
    vi.runAllTimers()
    await flushPromises()

    const fabButton = wrapper.find('[data-testid="novo-lancamento-fab"]')

    expect(fabButton.exists()).toBe(true)
    expect(fabButton.text()).not.toContain('Novo lancamento')
    expect(fabButton.classes()).toContain('w-16')
    expect(fabButton.classes()).toContain('h-16')
    expect(fabButton.classes()).toContain('rounded-full')
    expect(fabButton.classes()).toContain('bg-ember')
  })
})


