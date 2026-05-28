import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createApp, defineComponent } from 'vue'
import { useCasasMultitenant } from './useCasasMultitenant'

vi.mock('../shared/container', () => ({
  tenantSessionService: {
    isAuthenticated: () => true,
    getActiveTenantId: () => 'tenant-123',
    getCurrentUserId: () => 'user-abc',
    setActiveTenant: vi.fn(),
    logout: vi.fn()
  }
}))

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
        update: vi.fn().mockResolvedValue({ error: null }),
        then: (onfulfilled: any) => onfulfilled({ data: [{ tenant_id: 'tenant-123' }], error: null })
      }
      return queryBuilder
    }
    if (table === 'tenants') {
      const queryBuilder = {
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockReturnThis(),
        insert: vi.fn().mockResolvedValue({ error: null }),
        then: (onfulfilled: any) => onfulfilled({ data: [{ id: 'tenant-123', name: 'Casa Feliz', invite_code: 'CODE123' }], error: null })
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
  })

  it('deve inicializar com o estado padrão', () => {
    const [{ isAuthed, casas, showBottomSheetCasas }] = withSetup(() => useCasasMultitenant())
    expect(isAuthed.value).toBe(true)
    expect(casas.value).toEqual([])
    expect(showBottomSheetCasas.value).toBe(false)
  })

  it('deve carregar as casas e obter o objeto do tenant ativo', async () => {
    const [{ casas, activeTenantObj }, app] = withSetup(() => useCasasMultitenant())
    
    // Aguardar o tick do onMounted e as resoluções de Promise
    await new Promise(resolve => setTimeout(resolve, 0))
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(casas.value.length).toBe(1)
    expect(casas.value[0].name).toBe('Casa Feliz')
    expect(activeTenantObj.value).toEqual({ id: 'tenant-123', name: 'Casa Feliz', invite_code: 'CODE123' })
    app.unmount()
  })
})
