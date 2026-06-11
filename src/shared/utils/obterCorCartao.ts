/**
 * Retorna uma cor institucional em formato Hexadecimal baseada no nome do cartão.
 * @param nome Nome do cartão (ex: Nubank, C6 Carbon, Inter, etc.)
 */
export function obterCorCartao(nome: string): string {
  if (!nome) return '#848281' // Cinza/Ash default

  const nomeLimpo = nome.trim().toLowerCase()

  if (nomeLimpo.includes('nubank') || nomeLimpo.includes('nu ')) {
    return '#a855f7' // Roxo Nubank
  }
  if (nomeLimpo.includes('c6') || nomeLimpo.includes('carbon') || nomeLimpo.includes('black')) {
    return '#1e1b18' // Preto C6 Carbon / Black
  }
  if (nomeLimpo.includes('inter') || nomeLimpo.includes('laranja')) {
    return '#f97316' // Laranja Banco Inter
  }
  if (nomeLimpo.includes('itau') || nomeLimpo.includes('itaú') || nomeLimpo.includes('azul')) {
    return '#3b82f6' // Azul Itaú
  }
  if (nomeLimpo.includes('bradesco') || nomeLimpo.includes('vermelho') || nomeLimpo.includes('santander')) {
    return '#ef4444' // Vermelho Bradesco / Santander
  }
  if (nomeLimpo.includes('neon') || nomeLimpo.includes('verde')) {
    return '#10b981' // Verde Neon / Sicredi
  }

  // Gera uma cor consistente baseada no hash do nome do cartão para outras marcas
  let hash = 0
  for (let i = 0; i < nomeLimpo.length; i++) {
    hash = nomeLimpo.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  const coresConsistentes = [
    '#a855f7', // Roxo
    '#3b82f6', // Azul
    '#f97316', // Laranja
    '#10b981', // Verde
    '#ef4444', // Vermelho
    '#474645'  // Grafite
  ]
  
  const index = Math.abs(hash) % coresConsistentes.length
  return coresConsistentes[index]
}
