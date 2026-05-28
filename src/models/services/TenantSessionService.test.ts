import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TenantSessionService } from './TenantSessionService'

const fetchMock = vi.fn()
vi.stubGlobal('fetch', fetchMock)

describe('TenantSessionService', () => {
  let service: TenantSessionService

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    fetchMock.mockReset()
    service = new TenantSessionService()
  })

  it('deve realizar login chamando a rota de autenticação', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        access_token: 'jwt-token-123',
        userId: 'usr-123',
        username: 'luansilva'
      })
    })
    
    // Segunda chamada para /auth/me na inicialização do login
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        tenants: [{ id: 'tenant-123', name: 'Casa Feliz' }]
      })
    })

    const success = await service.login('Luan Silva', 'senha123')
    
    expect(fetchMock).toHaveBeenCalledWith('http://localhost:3000/auth/login', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ username: 'Luan Silva', password: 'senha123' })
    }))
    expect(success).toBe(true)
    expect(localStorage.getItem('divi_jwt_token')).toBe('jwt-token-123')
    expect(localStorage.getItem('divi_current_user_id')).toBe('usr-123')
  })

  it('deve permitir definir e recuperar o active tenant id do localstorage', () => {
    service.setActiveTenant('tenant-456')
    expect(service.getActiveTenantId()).toBe('tenant-456')
    expect(localStorage.getItem('divi_active_tenant_id')).toBe('tenant-456')
  })
})
