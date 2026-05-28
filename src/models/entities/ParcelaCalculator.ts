import { Dinheiro } from './Dinheiro'

/**
 * Calcula o divisor e o índice da parcela atual para um gasto parcelado.
 * Encapsula a lógica: divisor = totalInstallments || installments || 1,
 * index = Math.max(0, divisor - installments).
 *
 * Função pura, sem efeitos colaterais.
 */
export function calcularContextoParcela(
  installments: number,
  totalInstallments: number
): { divisor: number; index: number } {
  const divisor = totalInstallments || installments || 1
  const index = Math.max(0, divisor - installments)
  return { divisor, index }
}

/**
 * Distribui um valor monetário em parcelas e retorna o valor da parcela no índice atual.
 * Retorna 0 centavos se o índice estiver fora do range de parcelas.
 */
export function valorParcelaAtual(
  valor: Dinheiro,
  installments: number,
  totalInstallments: number
): Dinheiro {
  const { divisor, index } = calcularContextoParcela(installments, totalInstallments)
  const parcelas = valor.distribuir(divisor)
  if (index < parcelas.length) {
    return parcelas[index]
  }
  return Dinheiro.deCentavos(0)
}
