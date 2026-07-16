const CORES_POR_MARCA: Array<{ padrao: string; cor: string }> = [
  { padrao: 'nubank', cor: '#a855f7' },
  { padrao: 'nu ',    cor: '#a855f7' },
  { padrao: 'c6',     cor: '#1e1b18' },
  { padrao: 'carbon', cor: '#1e1b18' },
  { padrao: 'black',  cor: '#1e1b18' },
  { padrao: 'inter',  cor: '#f97316' },
  { padrao: 'laranja',cor: '#f97316' },
  { padrao: 'itau',   cor: '#3b82f6' },
  { padrao: 'itaú',   cor: '#3b82f6' },
  { padrao: 'azul',   cor: '#3b82f6' },
  { padrao: 'bradesco',  cor: '#ef4444' },
  { padrao: 'vermelho',  cor: '#ef4444' },
  { padrao: 'santander', cor: '#ef4444' },
  { padrao: 'neon',   cor: '#10b981' },
  { padrao: 'verde',  cor: '#10b981' },
]

// Cores de fallback usadas para gerar uma cor consistente via hash do nome.
const CORES_FALLBACK = ['#a855f7', '#3b82f6', '#f97316', '#10b981', '#ef4444', '#474645']

/**
 * Retorna uma cor institucional em formato Hexadecimal baseada no nome do cartão.
 * @param nome Nome do cartão (ex: Nubank, C6 Carbon, Inter, etc.)
 */
export function obterCorCartao(nome: string): string {
  if (!nome) return '#848281' // Cinza/Ash default

  const nomeLimpo = nome.trim().toLowerCase()

  for (const { padrao, cor } of CORES_POR_MARCA) {
    if (nomeLimpo.includes(padrao)) return cor
  }

  // Gera uma cor consistente baseada no hash do nome para outras marcas.
  let hash = 0
  for (let i = 0; i < nomeLimpo.length; i++) {
    hash = nomeLimpo.charCodeAt(i) + ((hash << 5) - hash)
  }
  return CORES_FALLBACK[Math.abs(hash) % CORES_FALLBACK.length]
}
