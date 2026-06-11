import { logger } from '../../shared/utils/logger'

export interface TenantSummary {
  id: string
  name: string
  inviteCode: string
}

export interface InvitePreview {
  id: string
  name: string
  membrosDisponiveis: { id: string; nome: string; avatar: string }[]
}

interface LoginResponse {
  access_token: string
  userId: string
  email: string
  nome: string
}

interface SessionResponse {
  tenants?: TenantSummary[]
}

const lerMensagemErro = async (response: Response, fallback: string): Promise<string> => {
  const body = await response.json().catch(() => null) as { message?: string } | null
  return body?.message || fallback
}

export class TenantSessionService {
  private activeTenantId: string | null = null
  private jwtToken: string | null = null
  private currentUserId: string | null = null

  private tenants: TenantSummary[] = []

  constructor() {
    this.activeTenantId = localStorage.getItem('divi_active_tenant_id')
    this.jwtToken = localStorage.getItem('divi_jwt_token')
    this.currentUserId = localStorage.getItem('divi_current_user_id')
  }

  private get baseUrl(): string {
    const url = (import.meta.env.VITE_API_URL as string) || 'http://localhost:3000'
    const normalized = url.replace(/\/+$/, '')
    return normalized.endsWith('/api') ? normalized : `${normalized}/api`
  }

  async login(email: string, passwordSecret: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: passwordSecret })
      })

      if (!response.ok) {
        logger.error('Erro de login:', await lerMensagemErro(response, response.statusText))
        return false
      }

      const data = await response.json() as LoginResponse
      this.jwtToken = data.access_token
      this.currentUserId = data.userId

      localStorage.setItem('divi_jwt_token', data.access_token)
      localStorage.setItem('divi_current_user_id', data.userId)
      localStorage.setItem('divi_user_email', data.email)
      localStorage.setItem('divi_username', data.nome)

      await this.carregarSessaoUsuario()

      return true
    } catch (err) {
      logger.error('Falha de conexão ao fazer login:', err)
      return false
    }
  }

  async register(email: string, nome: string, passwordSecret: string, inviteCode?: string, membroId?: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          nome,
          password: passwordSecret,
          inviteCode,
          membroId
        })
      })

      if (!response.ok) {
        logger.error('Erro de cadastro:', await lerMensagemErro(response, response.statusText))
        return false
      }

      return this.login(email, passwordSecret)
    } catch (err) {
      logger.error('Falha de conexão ao registrar:', err)
      return false
    }
  }

  async getInvitePreview(code: string): Promise<InvitePreview> {
    const response = await fetch(`${this.baseUrl}/financeiro/tenants/invite/${code}`)
    if (!response.ok) {
      throw new Error(await lerMensagemErro(response, 'Convite inválido'))
    }
    return response.json() as Promise<InvitePreview>
  }

  async forgotPassword(email: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      if (!response.ok) {
        logger.error('Erro forgotPassword:', await lerMensagemErro(response, response.statusText))
        return false
      }
      return true
    } catch (err) {
      logger.error('Falha de conexão em forgotPassword:', err)
      return false
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword })
      })
      if (!response.ok) {
        logger.error('Erro resetPassword:', await lerMensagemErro(response, response.statusText))
        return false
      }
      return true
    } catch (err) {
      logger.error('Falha de conexão em resetPassword:', err)
      return false
    }
  }

  async logout(): Promise<void> {
    this.jwtToken = null
    this.currentUserId = null
    this.activeTenantId = null
    this.tenants = []
    localStorage.removeItem('divi_jwt_token')
    localStorage.removeItem('divi_current_user_id')
    localStorage.removeItem('divi_active_tenant_id')
    localStorage.removeItem('divi_username')
  }

  isAuthenticated(): boolean {
    return !!this.jwtToken
  }

  /** Carrega a sessão do usuário (tenants) ao inicializar o app. Deve ser chamado antes de qualquer fetch de dados. */
  async inicializarSessao(): Promise<void> {
    if (this.jwtToken) {
      await this.carregarSessaoUsuario()
    }
  }

  getActiveTenantId(): string | null {
    return this.activeTenantId
  }

  setActiveTenant(tenantId: string): void {
    this.activeTenantId = tenantId || null
    if (tenantId) {
      localStorage.setItem('divi_active_tenant_id', tenantId)
    } else {
      localStorage.removeItem('divi_active_tenant_id')
    }
  }

  getCurrentUserId(): string | null {
    return this.currentUserId
  }

  getTenants(): TenantSummary[] {
    return [...this.tenants]
  }

  /** Cria uma nova casa e seleciona ela automaticamente */
  async criarCasa(nome: string): Promise<TenantSummary> {
    const response = await fetch(`${this.baseUrl}/financeiro/tenants`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.jwtToken}`
      },
      body: JSON.stringify({ name: nome })
    })

    if (!response.ok) {
      throw new Error(await lerMensagemErro(response, 'Erro ao criar a casa'))
    }

    const tenant = await response.json() as TenantSummary
    this.setActiveTenant(tenant.id)
    this.tenants = [...this.tenants, tenant]
    return tenant
  }

  /** Entra em uma casa existente pelo código de convite */
  async entrarCasa(inviteCode: string): Promise<TenantSummary> {
    const response = await fetch(`${this.baseUrl}/financeiro/tenants/entrar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.jwtToken}`
      },
      body: JSON.stringify({ inviteCode })
    })

    if (!response.ok) {
      throw new Error(await lerMensagemErro(response, 'Código de convite inválido ou casa não encontrada.'))
    }

    const tenant = await response.json() as TenantSummary
    this.setActiveTenant(tenant.id)
    if (!this.tenants.find(t => t.id === tenant.id)) {
      this.tenants = [...this.tenants, tenant]
    }
    return tenant
  }

  private async carregarSessaoUsuario(): Promise<void> {
    if (!this.jwtToken) return
    try {
      const response = await fetch(`${this.baseUrl}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${this.jwtToken}`
        }
      })

      if (response.status === 401) {
        await this.logout()
        return
      }
      if (!response.ok) return

      const data = await response.json() as SessionResponse
      this.tenants = data.tenants || []
      if (this.tenants.length === 0) {
        this.setActiveTenant('')
        return
      }
      if (!this.activeTenantId || !this.tenants.some(t => t.id === this.activeTenantId)) {
        this.setActiveTenant(this.tenants[0].id)
      }
    } catch (err) {
      logger.error('Falha ao carregar sessão do usuário:', err)
    }
  }
}
