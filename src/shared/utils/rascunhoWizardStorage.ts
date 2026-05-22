const STORAGE_KEY = 'divi_rascunho_novo_lancamento_v18'

export function obterRascunhoWizard(): any | null {
  const data = sessionStorage.getItem(STORAGE_KEY)
  if (!data) return null
  try {
    return JSON.parse(data)
  } catch {
    return null
  }
}

export function salvarRascunhoWizard(state: any): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function limparRascunhoWizard(): void {
  sessionStorage.removeItem(STORAGE_KEY)
}
