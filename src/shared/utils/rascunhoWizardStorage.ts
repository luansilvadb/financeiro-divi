import type { WizardDraft } from '../models/entities/WizardDraft'

const STORAGE_KEY = 'divi_wizard_draft_senior'

export function obterRascunhoWizard(): WizardDraft | null {
  const data = sessionStorage.getItem(STORAGE_KEY)
  if (!data) return null
  try {
    return JSON.parse(data) as WizardDraft
  } catch (e) {
    return null
  }
}

export function salvarRascunhoWizard(state: WizardDraft): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function limparRascunhoWizard(): void {
  sessionStorage.removeItem(STORAGE_KEY)
}
