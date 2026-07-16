/**
 * Utilitário para leitura do token CSRF definido pelo backend.
 *
 * O middleware CSRF do backend define um cookie `csrf_token` com httpOnly=false,
 * permitindo que o JavaScript o leia para o padrão double-submit cookie.
 *
 * Também expõe o token via header X-CSRF-Token nas respostas GET, que é a fonte
 * primária usada pelo HttpBaseRepository. Este módulo oferece um fallback via
 * cookie para serviços que fazem fetch direto (ex: TenantSessionService).
 */

/** Cache em memória do token CSRF (mesmo padrão do HttpBaseRepository). */
let csrfTokenCache: string | null = null

/**
 * Extrai o valor de um cookie pelo nome.
 */
function lerCookie(nome: string): string {
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${nome}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : ''
}

/**
 * Retorna o token CSRF atual, consultando primeiro o cache em memória
 * e depois o cookie como fallback.
 */
export function lerCsrfToken(): string {
  if (csrfTokenCache) return csrfTokenCache

  const doCookie = lerCookie('csrf_token')
  if (doCookie) {
    csrfTokenCache = doCookie
    return doCookie
  }

  return ''
}

/**
 * Atualiza o cache em memória com um novo token.
 * Chamado quando recebemos um header X-CSRF-Token em respostas GET,
 * ou após ler do cookie com sucesso.
 */
export function definirCsrfToken(token: string): void {
  if (token) {
    csrfTokenCache = token
  }
}

/**
 * Limpa o cache (usado após 403 por token inválido, antes de renovar).
 */
export function limparCsrfToken(): void {
  csrfTokenCache = null
}

/**
 * Retorna os headers HTTP necessários para incluir o token CSRF em requisições
 * com estado mutável (POST, PUT, DELETE, PATCH).
 * Retorna um objeto vazio se não houver token disponível.
 */
export function obterHeadersCsrf(): Record<string, string> {
  const token = lerCsrfToken()
  if (!token) return {}
  return { 'X-CSRF-Token': token }
}
