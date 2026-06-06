import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { ref } from 'vue'
import App from './App.vue'

vi.mock('./shared/container', () => ({
  tenantSessionService: {
    isAuthenticated: () => true,
    getActiveTenantId: () => 'tenant-123',
    getCurrentUserId: () => 'user-123',
    inicializarSessao: vi.fn().mockResolvedValue(undefined),
    logout: vi.fn().mockResolvedValue(undefined)
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
    currentMembro: ref(null),
    inicializar: vi.fn().mockResolvedValue(undefined),
    carregar: vi.fn().mockResolvedValue(undefined)
  })
}))

vi.mock('./viewmodels/useCartoesEFaturas', () => ({
  useCartoesEFaturas: () => ({
    cartoes: ref([]),
    faturasAbertas: ref([]),
    faturasFechadas: ref([]),
    inicializar: vi.fn().mockResolvedValue(undefined)
  })
}))

vi.mock('./viewmodels/useContasFixas', () => ({
  useContasFixas: () => ({
    carregarTemplates: vi.fn().mockResolvedValue(undefined)
  })
}))

vi.mock('./viewmodels/useBottomSheetState', () => ({
  useBottomSheetState: () => ({
    isAnyBottomSheetOpen: ref(false)
  })
}))

const mountApp = () => mount(App, {
  global: {
    stubs: {
      DashboardSaldos: {
        props: ['isLoading'],
        template: '<div data-testid="dashboard" :data-loading="String(isLoading)" />'
      },
      NovoLancamentoWizard: true,
      ConfiguracoesMembros: true,
      BottomSheet: { template: '<div><slot /></div>' },
      BottomTabBar: true,
      ToastNotification: true,
      IllustrationMascot: true
    }
  }
})

describe('App loading', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('libera o dashboard assim que a carga inicial termina sem timeout minimo', async () => {
    vi.useFakeTimers()
    const wrapper = mountApp()

    await flushPromises()

    expect(wrapper.get('[data-testid="dashboard"]').attributes('data-loading')).toBe('false')
    expect(vi.getTimerCount()).toBe(0)
  })

  it('renderiza o FAB atual como acao circular central', async () => {
    const wrapper = mountApp()

    await flushPromises()

    const fabButton = wrapper.get('[data-testid="novo-lancamento-fab"]')

    expect(fabButton.classes()).toContain('w-16')
    expect(fabButton.classes()).toContain('h-16')
    expect(fabButton.classes()).toContain('rounded-full')
    expect(fabButton.classes()).toContain('bg-ember')
  })
})
