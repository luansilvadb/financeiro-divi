import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TenantSessionService } from './TenantSessionService'

const mockSupabase = {
  auth: {
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    getUser: vi.fn(),
    onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null })
  },
  from: vi.fn()
}

describe('TenantSessionService', () => {
  let service: TenantSessionService

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    service = new TenantSessionService(mockSupabase as any)
  })

  it('deve converter nome de usuário para e-mail fictício no login', async () => {
    mockSupabase.auth.signInWithPassword.mockResolvedValue({ data: { user: { id: 'usr-123' } }, error: null })
    
    const success = await service.login('Luan Silva', 'senha123')
    
    expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'luansilva@divi.app',
      password: 'senha123'
    })
    expect(success).toBe(true)
  })

  it('deve permitir definir e recuperar o active tenant id do localstorage', () => {
    service.setActiveTenant('tenant-456')
    expect(service.getActiveTenantId()).toBe('tenant-456')
    expect(localStorage.getItem('divi_active_tenant_id')).toBe('tenant-456')
  })
})
