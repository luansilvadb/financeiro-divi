export class HttpBaseRepository {
  protected get baseUrl(): string {
    return (import.meta.env.VITE_API_URL as string) || 'http://localhost:3000'
  }

  protected get token(): string | null {
    return localStorage.getItem('divi_jwt_token')
  }

  protected get tenantId(): string | null {
    return localStorage.getItem('divi_active_tenant_id')
  }

  protected async request<T = any>(url: string, options: RequestInit = {}): Promise<T> {
    const headers = new Headers(options.headers)
    headers.set('Content-Type', 'application/json')

    if (this.token) {
      headers.set('Authorization', `Bearer ${this.token}`)
    }

    if (this.tenantId) {
      headers.set('X-Tenant-ID', this.tenantId)
    }

    let response: Response
    try {
      response = await fetch(`${this.baseUrl}${url}`, {
        ...options,
        headers,
      })
    } catch (err: any) {
      console.error(`Falha de conexão para ${url}:`, err)
      throw new Error('Não foi possível se conectar ao servidor do DIVI. Certifique-se de que a API está ativa e que há conexão com a internet.')
    }

    if (!response.ok) {
      if (response.status === 401) {
        // Se retornar 401, limpa a sessão para redirecionar para o login
        localStorage.removeItem('divi_jwt_token')
        localStorage.removeItem('divi_active_tenant_id')
        window.location.reload()
      }
      const errBody = await response.json().catch(() => ({}))
      throw new Error(errBody.message || `Erro HTTP: ${response.status} ${response.statusText}`)
    }

    if (response.status === 204) {
      return null as any
    }

    return response.json()
  }
}
