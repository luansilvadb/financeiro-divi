import type { SupabaseClient } from '@supabase/supabase-js'

export class TenantSessionService {
  private activeTenantId: string | null = null
  private authenticatedUser: any | null = null

  constructor(private supabase: SupabaseClient) {
    this.activeTenantId = localStorage.getItem('divi_active_tenant_id')
    
    // Escuta mudanças de autenticação para atualizar o cache síncrono
    this.supabase.auth.onAuthStateChange((_event, session) => {
      this.authenticatedUser = session?.user || null
    })

    // Recupera a sessão inicial de forma assíncrona (geralmente resolve síncrono do storage interno)
    this.supabase.auth.getSession().then(({ data }) => {
      this.authenticatedUser = data.session?.user || null
    })
  }

  private cleanUsername(username: string): string {
    return username
      .toLowerCase()
      .replace(/\s+/g, '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
  }

  private getEmailFromUsername(username: string): string {
    return `${this.cleanUsername(username)}@divi.app`
  }

  async login(username: string, password: string): Promise<boolean> {
    const email = this.getEmailFromUsername(username)
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      console.error('Erro de login:', error.message)
      return false
    }

    this.authenticatedUser = data.user
    return !!data.user
  }

  async register(username: string, password: string): Promise<boolean> {
    const email = this.getEmailFromUsername(username)
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password
    })

    if (error) {
      console.error('Erro de cadastro:', error.message)
      return false
    }

    this.authenticatedUser = data.user
    return !!data.user
  }

  async logout(): Promise<void> {
    await this.supabase.auth.signOut()
    this.authenticatedUser = null
    this.activeTenantId = null
    localStorage.removeItem('divi_active_tenant_id')
  }

  isAuthenticated(): boolean {
    return !!this.authenticatedUser
  }

  getActiveTenantId(): string | null {
    return this.activeTenantId
  }

  setActiveTenant(tenantId: string): void {
    this.activeTenantId = tenantId
    localStorage.setItem('divi_active_tenant_id', tenantId)
  }

  getCurrentUserId(): string | null {
    return this.authenticatedUser?.id || null
  }
}
