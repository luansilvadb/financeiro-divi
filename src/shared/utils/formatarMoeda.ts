/**
 * Formata um valor numérico em Reais (float) para o padrão BRL (ex: R$ 1.250,00 ou 1.250,00).
 */
export const formatarBRL = (valor: number, incluirSimbolo: boolean = true): string => {
  if (incluirSimbolo) {
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }
  return valor.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

/**
 * Formata um valor em centavos (número ou bigint) para o padrão BRL (ex: R$ 1.250,00 ou 1.250,00).
 */
export const formatarCentavosParaBRL = (centavos: number | bigint, incluirSimbolo: boolean = true): string => {
  return formatarBRL(Number(centavos) / 100, incluirSimbolo)
}

/**
 * Aplica a máscara de moeda brasileira em uma string de dígitos.
 * Retorna a string formatada sem o símbolo R$ (ex: "1.250,00"), ou vazia se não houver dígitos.
 * Limita o número de dígitos para evitar estouro numérico.
 */
export const aplicarMascaraBRLText = (texto: string, maxDigitos: number = 10): string => {
  let apenasDigitos = texto.replace(/\D/g, '')
  if (apenasDigitos === '') return ''
  
  if (apenasDigitos.length > maxDigitos) {
    apenasDigitos = apenasDigitos.slice(0, maxDigitos)
  }
  
  const val = parseInt(apenasDigitos, 10) / 100
  return formatarBRL(val, false)
}
