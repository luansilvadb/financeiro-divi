/**
 * Formata um valor em centavos (bigint ou number) para o padrão BRL com separadores de milhar.
 * Ex: 321312312313321300n → "R$ 3.213.123.123.133.213,00"
 */
export const formatarCentavosParaBRL = (centavos: bigint | number): string => {
  const valor = Number(centavos) / 100;
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};
