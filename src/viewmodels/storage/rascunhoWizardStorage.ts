const STORAGE_KEY = 'divi_rascunho_novo_lancamento_v18'

export function obterRascunhoWizard(): any | null {
  const data = localStorage.getItem(STORAGE_KEY)
  if (!data) return null
  try {
    return JSON.parse(data)
  } catch {
    return null
  }
}

export function salvarRascunhoWizard(state: any): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function limparRascunhoWizard(): void {
  localStorage.removeItem(STORAGE_KEY)
}
