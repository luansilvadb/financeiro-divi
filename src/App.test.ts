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
          InvertedSection: {
            template: '<section><slot /></section>',
          },
        },
      },
    })

    const fab = wrapper.find('[data-testid="novo-lancamento-fab"]')

    expect(fab.exists()).toBe(true)
    expect(fab.text()).not.toContain('Novo lancamento')
    expect(fab.classes()).toContain('fixed')
    expect(fab.classes()).toContain('left-0')
    expect(fab.classes()).toContain('right-0')
    expect(fab.classes()).toContain('mx-auto')
    expect(fab.classes()).toContain('w-14')
    expect(fab.classes()).toContain('h-14')
    expect(fab.classes()).toContain('rounded-full')
    expect(fab.classes()).toContain('border-card')
  })
})


