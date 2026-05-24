import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import App from './App.vue'

vi.mock('./shared/container', () => ({
  tenantSessionService: {
    isAuthenticated: () => true,
    getActiveTenantId: () => 'tenant-123',
    getCurrentUserId: () => 'user-123'
  },
  migrationService: {
    migrar: vi.fn()
  }
}))

vi.mock('./viewmodels/useMembros', () => ({
  useMembros: () => ({
    ativos: ref([]),
    membros: ref([]),
    inicializar: vi.fn(),
  }),
}))

vi.mock('./viewmodels/useCartoesEFaturas', () => ({
  useCartoesEFaturas: () => ({
    cartoes: ref([]),
    acertos: ref([]),
    faturasAbertas: ref([]),
    faturasFechadas: ref([]),
    inicializar: vi.fn(),
    fecharFaturaManual: vi.fn(),
    reabrirFaturaManual: vi.fn(),
    quitarAcertoMembro: vi.fn(),
    calcularConsumoMembro: vi.fn(() => 0),
    calcularAdiantamentoMembro: vi.fn(() => 0),
  }),
}))

vi.mock('./viewmodels/useStorageSync', () => ({
  useStorageSync: vi.fn(),
}))

const isAnyBottomSheetOpenMock = ref(false)
vi.mock('./viewmodels/useBottomSheetState', () => ({
  useBottomSheetState: () => ({
    isAnyBottomSheetOpen: isAnyBottomSheetOpenMock,
  }),
}))

describe('App FAB', () => {
  it('renderiza o FAB circular sem texto', () => {
    const wrapper = mount(App, {
      global: {
        stubs: {
          DashboardSaldos: true,
          NovoLancamentoWizard: true,
          ConfiguracoesMembros: true,
          BottomSheet: {
            template: '<div><slot /></div>',
          },
        },
      },
    })

    const fabWrapper = wrapper.find('[data-fixed-wrapper]')
    const fabButton = wrapper.find('[data-testid="novo-lancamento-fab"]')

    expect(fabWrapper.exists()).toBe(true)
    expect(fabWrapper.classes()).toContain('fixed')
    expect(fabWrapper.classes()).toContain('left-0')
    expect(fabWrapper.classes()).toContain('right-0')

    expect(fabButton.exists()).toBe(true)
    expect(fabButton.text()).not.toContain('Novo lancamento')
    expect(fabButton.classes()).toContain('w-14')
    expect(fabButton.classes()).toContain('h-14')
    expect(fabButton.classes()).toContain('rounded-full')
    expect(fabButton.classes()).toContain('bg-midnight')
  })
})


