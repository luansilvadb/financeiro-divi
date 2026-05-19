import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import App from './App.vue'

vi.mock('./modules/ledger/composables/useMembros', () => ({
  useMembros: () => ({
    ativos: ref([]),
    membros: ref([]),
    inicializar: vi.fn(),
  }),
}))

vi.mock('./modules/ledger/composables/useCartoesEFaturas', () => ({
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

vi.mock('./modules/ledger/composables/useStorageSync', () => ({
  useStorageSync: vi.fn(),
}))

const isAnyBottomSheetOpenMock = ref(false)
vi.mock('./composables/useBottomSheetState', () => ({
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
    expect(fabButton.classes()).toContain('bg-gradient-to-br')
  })
})


