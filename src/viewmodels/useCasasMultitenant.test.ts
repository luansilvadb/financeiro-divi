import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createApp, defineComponent, nextTick } from 'vue'
import { useCasasMultitenant } from './useCasasMultitenant'
import { tenantSessionService } from '../shared/container'
import { supabase } from '../shared/supabase'

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

vi.mock('../shared/supabase', () => {
  const fromMock = vi.fn().mockImplementation((table: string) => {
    if (table === 'membros_casa') {
      const queryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockReturnThis(),
        insert: vi.fn().mockResolvedValue({ error: null }),
        update: vi.fn().mockReturnThis(), // Permite encadeamento de .eq() após o update
        then: (onfulfilled: any) => onfulfilled({ data: [{ tenant_id: 'tenant-123' }], error: null })
      }
      return queryBuilder
    }
    if (table === 'tenants') {
      let isSingleCall = false
      const queryBuilder: any = {
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockImplementation(() => {
          isSingleCall = true
          return queryBuilder
        }),
        insert: vi.fn().mockResolvedValue({ error: null }),
        then: (onfulfilled: any) => {
          if (isSingleCall) {
            return onfulfilled({ data: { id: 'tenant-convidado', name: 'Casa Convidada', invite_code: 'CONVITE12' }, error: null })
          }
          return onfulfilled({ data: [{ id: 'tenant-123', name: 'Casa Feliz', invite_code: 'CODE123' }], error: null })
        }
      }
      return queryBuilder
    }
    return { select: vi.fn().mockReturnThis() }
  })
  return {
    supabase: {
      from: fromMock
    }
  }
})

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
  })

  it('deve inicializar com o estado padrão', async () => {
    const [{ isAuthed, casas, showBottomSheetCasas }, app] = withSetup(() => useCasasMultitenant())
    expect(isAuthed.value).toBe(true)
    expect(casas.value).toEqual([])
    expect(showBottomSheetCasas.value).toBe(false)
    
    await nextTick()
    app.unmount()
  })

  it('deve carregar as casas e obter o objeto do tenant ativo', async () => {
    const [vm, app] = withSetup(() => useCasasMultitenant())
    
    await vm.carregarCasas()

    expect(vm.casas.value.length).toBe(1)
    expect(vm.casas.value[0].name).toBe('Casa Feliz')
    expect(vm.activeTenantObj.value).toEqual({ id: 'tenant-123', name: 'Casa Feliz', invite_code: 'CODE123' })
    app.unmount()
  })

  it('deve criar uma nova casa com sucesso', async () => {
    const [vm, app] = withSetup(() => useCasasMultitenant())
    await nextTick()
    
    vm.nomeNovaCasa.value = 'República Central'
    await vm.criarNovaCasa()

    expect(supabase.from).toHaveBeenCalledWith('tenants')
    expect(tenantSessionService.setActiveTenant).toHaveBeenCalledWith(expect.any(String))
    expect(reloadMock).toHaveBeenCalled()
    app.unmount()
  })

  it('deve entrar em uma casa por código de convite com sucesso', async () => {
    const [vm, app] = withSetup(() => useCasasMultitenant())
    await nextTick()
    
    vm.codigoConvite.value = 'CONVITE12'
    await vm.entrarPorCodigo()

    expect(supabase.from).toHaveBeenCalledWith('tenants')
    expect(tenantSessionService.setActiveTenant).toHaveBeenCalledWith('tenant-convidado')
    expect(reloadMock).toHaveBeenCalled()
    app.unmount()
  })

  it('deve copiar o código de convite e dar feedback visual', async () => {
    vi.useFakeTimers()
    try {
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
    const [vm, app] = withSetup(() => useCasasMultitenant())
    await nextTick()

    await vm.handleLogoutClick()

    expect(tenantSessionService.logout).toHaveBeenCalled()
    expect(reloadMock).toHaveBeenCalled()
    app.unmount()
  })
})
