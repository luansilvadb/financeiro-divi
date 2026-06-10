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
    vi.spyOn(console, 'error').mockImplementation(() => {})
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
    
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        tenants: [{ id: 'tenant-123', name: 'Casa Feliz' }]
      })
    })

    const success = await service.login('luan@divi.com', 'senha123')
    
    expect(fetchMock).toHaveBeenCalledWith('http://localhost:3000/auth/login', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ email: 'luan@divi.com', password: 'senha123' })
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

  it('deve limpar a sessão quando /auth/me retornar 401', async () => {
    localStorage.setItem('divi_jwt_token', 'token-expirado')
    service = new TenantSessionService()
    fetchMock.mockResolvedValueOnce({ ok: false, status: 401 })

    await service.inicializarSessao()

    expect(service.isAuthenticated()).toBe(false)
    expect(localStorage.getItem('divi_jwt_token')).toBeNull()
  })

  describe('Caminhos de Erro', () => {
    it('login deve retornar false se a API retornar erro', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ message: 'Credenciais inválidas' })
      })

      const success = await service.login('luan@divi.com', 'senha-errada')
      expect(success).toBe(false)
      expect(console.error).toHaveBeenCalledWith('Erro de login:', 'Credenciais inválidas')
    })

    it('login deve retornar false em caso de falha de conexão', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Network error'))

      const success = await service.login('luan@divi.com', 'senha123')
      expect(success).toBe(false)
      expect(console.error).toHaveBeenCalledWith('Falha de conexão ao fazer login:', expect.any(Error))
    })

    it('register deve retornar false se a API retornar erro', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({ message: 'E-mail já cadastrado' })
      })

      const success = await service.register('luan@divi.com', 'Luan', 'senha123')
      expect(success).toBe(false)
      expect(console.error).toHaveBeenCalledWith('Erro de cadastro:', 'E-mail já cadastrado')
    })

    it('register deve retornar false em caso de falha de conexão', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Network error'))

      const success = await service.register('luan@divi.com', 'Luan', 'senha123')
      expect(success).toBe(false)
      expect(console.error).toHaveBeenCalledWith('Falha de conexão ao registrar:', expect.any(Error))
    })

    it('getInvitePreview deve lançar erro se a API retornar erro', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ message: 'Convite não encontrado' })
      })

      await expect(service.getInvitePreview('invalid-code')).rejects.toThrow('Convite não encontrado')
    })

    it('forgotPassword deve retornar false se a API retornar erro', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ message: 'Erro interno' })
      })

      const success = await service.forgotPassword('luan@divi.com')
      expect(success).toBe(false)
      expect(console.error).toHaveBeenCalledWith('Erro forgotPassword:', 'Erro interno')
    })

    it('forgotPassword deve retornar false em caso de falha de conexão', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Network error'))

      const success = await service.forgotPassword('luan@divi.com')
      expect(success).toBe(false)
      expect(console.error).toHaveBeenCalledWith('Falha de conexão em forgotPassword:', expect.any(Error))
    })

    it('resetPassword deve retornar false se a API retornar erro', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({ message: 'Token inválido' })
      })

      const success = await service.resetPassword('token-invalido', 'nova-senha')
      expect(success).toBe(false)
      expect(console.error).toHaveBeenCalledWith('Erro resetPassword:', 'Token inválido')
    })

    it('resetPassword deve retornar false em caso de falha de conexão', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Network error'))

      const success = await service.resetPassword('token', 'senha')
      expect(success).toBe(false)
      expect(console.error).toHaveBeenCalledWith('Falha de conexão em resetPassword:', expect.any(Error))
    })

    it('criarCasa deve lançar erro se a API retornar erro', async () => {
      localStorage.setItem('divi_jwt_token', 'token-valido')
      service = new TenantSessionService()

      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({ message: 'Nome da casa é obrigatório' })
      })

      await expect(service.criarCasa('')).rejects.toThrow('Nome da casa é obrigatório')
    })

    it('entrarCasa deve lançar erro se a API retornar erro', async () => {
      localStorage.setItem('divi_jwt_token', 'token-valido')
      service = new TenantSessionService()

      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ message: 'Código inválido' })
      })

      await expect(service.entrarCasa('INVALID')).rejects.toThrow('Código inválido')
    })

    it('inicializarSessao deve lidar com erro 500 de /auth/me sem deslogar', async () => {
      localStorage.setItem('divi_jwt_token', 'token-valido')
      service = new TenantSessionService()
      fetchMock.mockResolvedValueOnce({ ok: false, status: 500 })

      await service.inicializarSessao()

      expect(service.isAuthenticated()).toBe(true)
      expect(localStorage.getItem('divi_jwt_token')).toBe('token-valido')
    })

    it('inicializarSessao deve lidar com falha de conexão em /auth/me', async () => {
      localStorage.setItem('divi_jwt_token', 'token-valido')
      service = new TenantSessionService()
      fetchMock.mockRejectedValueOnce(new Error('Network error'))

      await service.inicializarSessao()

      expect(service.isAuthenticated()).toBe(true)
      expect(console.error).toHaveBeenCalledWith('Falha ao carregar sessão do usuário:', expect.any(Error))
    })
  })
})
