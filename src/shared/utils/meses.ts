export const NOMES_MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
] as const

export function formatarMesAno(mes: number, ano: number): string {
  if (mes < 1 || mes > 12 || !Number.isFinite(mes)) return `${ano}`
  return `${NOMES_MESES[mes - 1]} ${ano}`
}
