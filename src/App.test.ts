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

vi.mock('./composables/useBottomSheetState', () => ({
  useBottomSheetState: () => ({
    isAnyBottomSheetOpen: ref(false),
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
    expect(fab.classes()).toContain('fab-rounded')
    expect(fab.classes()).toContain('w-14')
    expect(fab.classes()).toContain('h-14')
  })
})
