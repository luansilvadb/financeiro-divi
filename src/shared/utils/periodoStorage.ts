const PERIODO_STORAGE_KEY = 'divi_periodo_selecionado'

export interface Periodo {
  mes: number
  ano: number
}

export function obterPeriodoSelecionado(fallbackPeriodo?: Periodo): Periodo {
  const salvo = localStorage.getItem(PERIODO_STORAGE_KEY)
  if (salvo) {
    try {
      const parsed = JSON.parse(salvo)
      if (parsed.mes && parsed.ano) {
        return { mes: Number(parsed.mes), ano: Number(parsed.ano) }
      }
    } catch (_) {}
  }
  if (fallbackPeriodo) return fallbackPeriodo
  return { mes: new Date().getMonth() + 1, ano: new Date().getFullYear() }
}

export function salvarPeriodoSelecionado(periodo: Periodo): void {
  localStorage.setItem(PERIODO_STORAGE_KEY, JSON.stringify(periodo))
}
