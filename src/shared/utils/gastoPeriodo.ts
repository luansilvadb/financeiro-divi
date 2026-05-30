import type { Fatura } from '../../models/entities/Fatura'

const extrairPeriodoDeFaturaId = (faturaId: string): { mes: number; ano: number } | null => {
  const match = faturaId.match(/(?:.*-)?(\d+)-(\d+)$/)
  if (match) {
    return {
      mes: parseInt(match[1], 10),
      ano: parseInt(match[2], 10)
    }
  }
  return null
}

export const gastoPertenceAoPeriodo = (g: any, mes: number, ano: number, faturas: Fatura[]) => {
  const fat = faturas.find(f => f.id === g.faturaId)
  if (fat) {
    return fat.periodo.mes === mes && fat.periodo.ano === ano
  }
  const periodoVirtual = extrairPeriodoDeFaturaId(g.faturaId)
  if (periodoVirtual) {
    return periodoVirtual.mes === mes && periodoVirtual.ano === ano
  }
  return false
}
