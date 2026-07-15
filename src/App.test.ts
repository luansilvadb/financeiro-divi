import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { ref } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'
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
    tenantPermissions: ref({}),
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

const DashboardStub = {
  template: '<div data-testid="dashboard" :data-loading="String(false)"><button data-testid="novo-lancamento-fab" class="w-11 h-11 rounded-full bg-ember" /></div>'
}

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: '/dashboard' },
    { path: '/login', component: { template: '<div data-testid="login" />' } },
    { path: '/dashboard', component: DashboardStub },
  ]
})

const mountApp = () => mount(App, {
  global: {
    plugins: [router],
    stubs: {
      ToastNotification: true,
      IllustrationMascot: true,
      Transition: false,
    }
  }
})

describe('App loading', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('mostra a tela de inicializacao antes dos dados carregarem', async () => {
    const wrapper = mountApp()

    expect(wrapper.text()).toContain('Iniciando aventura')
  })

  it('navega para o dashboard apos inicializacao', async () => {
    vi.useFakeTimers()
    mountApp()

    await flushPromises()
    await router.isReady()

    expect(router.currentRoute.value.path).toBe('/dashboard')
  })
})
