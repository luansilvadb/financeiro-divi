/**
 * Formata centavos para string em reais no padrão brasileiro (ex: "1.234,56").
 */
export function formatarReais(centavos: number): string {
  const reais = centavos / 100
  return reais.toFixed(2).replace('.', ',')
}

/**
 * Formata um valor já em reais para string no padrão brasileiro.
 */
export function formatarReaisDeValor(valor: number): string {
  return valor.toFixed(2).replace('.', ',')
}
