import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createApp, defineComponent, nextTick } from 'vue'
import { useCasasMultitenant } from './useCasasMultitenant'
import { tenantSessionService } from '../shared/container'

vi.mock('../shared/container', () => ({
  tenantSessionService: {
    isAuthenticated: () => true,
    getActiveTenantId: () => 'tenant-123',
    getCurrentUserId: () => 'user-abc',
    setActiveTenant: vi.fn(),
    logout: vi.fn()
  }
}))

// Mock do window.location.reload
const reloadMock = vi.fn()
Object.defineProperty(window, 'location', {
  value: {
    reload: reloadMock
  },
  configurable: true
})

// Mock do navigator.clipboard.writeText
const writeTextMock = vi.fn().mockResolvedValue(undefined)
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: writeTextMock
  },
  configurable: true
})

// Mock global do fetch
const fetchMock = vi.fn()
vi.stubGlobal('fetch', fetchMock)

function withSetup<T>(composable: () => T) {
  let result: T
  const app = createApp(defineComponent({
    setup() {
      result = composable()
      return () => {}
    }
  }))
  app.mount(document.createElement('div'))
  return [result!, app] as const
}

describe('useCasasMultitenant', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    reloadMock.mockClear()
    writeTextMock.mockClear()
    fetchMock.mockReset()
  })

  it('deve inicializar com o estado padrão', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ tenants: [] })
    })

    const [{ isAuthed, casas, showBottomSheetCasas }, app] = withSetup(() => useCasasMultitenant())
    expect(isAuthed.value).toBe(true)
    expect(casas.value).toEqual([])
    expect(showBottomSheetCasas.value).toBe(false)
    
    await nextTick()
    app.unmount()
  })

  it('deve carregar as casas e obter o objeto do tenant ativo', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        tenants: [{ id: 'tenant-123', name: 'Casa Feliz', invite_code: 'CODE123' }]
      })
    })

    const [vm, app] = withSetup(() => useCasasMultitenant())
    
    await vm.carregarCasas()

    expect(vm.casas.value.length).toBe(1)
    expect(vm.casas.value[0].name).toBe('Casa Feliz')
    expect(vm.activeTenantObj.value).toEqual({ id: 'tenant-123', name: 'Casa Feliz', invite_code: 'CODE123' })
    app.unmount()
  })

  it('deve criar uma nova casa com sucesso', async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.includes('/financeiro/tenants')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ id: 'new-tenant-id', name: 'República Central', inviteCode: 'CODE456' })
        })
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ tenants: [{ id: 'new-tenant-id', name: 'República Central', inviteCode: 'CODE456' }] })
      })
    })

    const [vm, app] = withSetup(() => useCasasMultitenant())
    await nextTick()
    
    vm.nomeNovaCasa.value = 'República Central'
    await vm.criarNovaCasa()

    expect(fetchMock).toHaveBeenCalled()
    expect(tenantSessionService.setActiveTenant).toHaveBeenCalledWith('new-tenant-id')
    expect(reloadMock).toHaveBeenCalled()
    app.unmount()
  })

  it('deve entrar em uma casa por código de convite com sucesso', async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.includes('/financeiro/tenants/entrar')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ id: 'tenant-convidado', name: 'Casa Convidada', inviteCode: 'CONVITE12' })
        })
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ tenants: [{ id: 'tenant-convidado', name: 'Casa Convidada', inviteCode: 'CONVITE12' }] })
      })
    })

    const [vm, app] = withSetup(() => useCasasMultitenant())
    await nextTick()
    
    vm.codigoConvite.value = 'CONVITE12'
    await vm.entrarPorCodigo()

    expect(fetchMock).toHaveBeenCalled()
    expect(tenantSessionService.setActiveTenant).toHaveBeenCalledWith('tenant-convidado')
    expect(reloadMock).toHaveBeenCalled()
    app.unmount()
  })

  it('deve copiar o código de convite e dar feedback visual', async () => {
    vi.useFakeTimers()
    try {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ tenants: [] })
      })

      const [vm, app] = withSetup(() => useCasasMultitenant())
      await nextTick()

      await vm.copyInviteCode('CONVITE12')

      expect(writeTextMock).toHaveBeenCalledWith('CONVITE12')
      expect(vm.copied.value).toBe(true)

      vi.advanceTimersByTime(2100)
      expect(vm.copied.value).toBe(false)
      app.unmount()
    } finally {
      vi.useRealTimers()
    }
  })

  it('deve deslogar e recarregar a tela', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ tenants: [] })
    })

    const [vm, app] = withSetup(() => useCasasMultitenant())
    await nextTick()

    await vm.handleLogoutClick()

    expect(tenantSessionService.logout).toHaveBeenCalled()
    expect(reloadMock).toHaveBeenCalled()
    app.unmount()
  })
})
