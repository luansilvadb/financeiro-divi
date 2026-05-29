export class TenantSessionService {
  private activeTenantId: string | null = null
  private jwtToken: string | null = null
  private currentUserId: string | null = null

  // Lista de casas do usuário (carregada após login/inicializarSessao)
  tenants: { id: string; name: string; inviteCode: string }[] = []

  constructor() {
    this.activeTenantId = localStorage.getItem('divi_active_tenant_id')
    this.jwtToken = localStorage.getItem('divi_jwt_token')
    this.currentUserId = localStorage.getItem('divi_current_user_id')
  }

  private get baseUrl(): string {
    return (import.meta.env.VITE_API_URL as string) || 'http://localhost:3000'
  }

  async login(username: string, passwordSecret: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password: passwordSecret })
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        console.error('Erro de login:', err.message || response.statusText)
        return false
      }

      const data = await response.json()
      this.jwtToken = data.access_token
      this.currentUserId = data.userId

      localStorage.setItem('divi_jwt_token', data.access_token)
      localStorage.setItem('divi_current_user_id', data.userId)
      localStorage.setItem('divi_username', data.username)

      // Ao logar, vamos carregar os tenants associados a este usuário
      await this.carregarSessaoUsuario()

      return true
    } catch (err) {
      console.error('Falha de conexão ao fazer login:', err)
      return false
    }
  }

  async register(username: string, passwordSecret: string, inviteCode?: string, membroId?: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username, 
          password: passwordSecret,
          inviteCode,
          membroId
        })
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        console.error('Erro de cadastro:', err.message || response.statusText)
        return false
      }

      // Após registrar, executa o login automático
      return this.login(username, passwordSecret)
    } catch (err) {
      console.error('Falha de conexão ao registrar:', err)
      return false
    }
  }

  async getInvitePreview(code: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/financeiro/tenants/invite/${code}`)
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.message || 'Convite inválido')
    }
    return response.json()
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

  /** Cria uma nova casa e seleciona ela automaticamente */
  async criarCasa(nome: string): Promise<{ id: string; name: string; inviteCode: string }> {
    const response = await fetch(`${this.baseUrl}/financeiro/tenants`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.jwtToken}`
      },
      body: JSON.stringify({ name: nome })
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.message || 'Erro ao criar a casa')
    }

    const tenant = await response.json()
    this.setActiveTenant(tenant.id)
    this.tenants = [...this.tenants, { id: tenant.id, name: tenant.name, inviteCode: tenant.inviteCode }]
    return tenant
  }

  /** Entra em uma casa existente pelo código de convite */
  async entrarCasa(inviteCode: string): Promise<{ id: string; name: string; inviteCode: string }> {
    const response = await fetch(`${this.baseUrl}/financeiro/tenants/entrar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.jwtToken}`
      },
      body: JSON.stringify({ inviteCode })
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.message || 'Código de convite inválido ou casa não encontrada.')
    }

    const tenant = await response.json()
    this.setActiveTenant(tenant.id)
    if (!this.tenants.find(t => t.id === tenant.id)) {
      this.tenants = [...this.tenants, { id: tenant.id, name: tenant.name, inviteCode: tenant.inviteCode }]
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

      if (response.ok) {
        const data = await response.json()
        this.tenants = data.tenants || []
        if (data.tenants && data.tenants.length > 0) {
          // Se o usuário já participa de tenants mas não tem activeTenantId ativo, seleciona o primeiro
          if (!this.activeTenantId || !data.tenants.some((t: any) => t.id === this.activeTenantId)) {
            this.setActiveTenant(data.tenants[0].id)
          }
        } else {
          this.setActiveTenant('')
        }
      }
    } catch (err) {
      console.error('Falha ao carregar sessão do usuário:', err)
    }
  }
}
