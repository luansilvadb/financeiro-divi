export interface WizardDraft {
  step: number
  wizFlow: 'expense' | 'loan' | null
  wizPayment: 'pix' | 'card' | null
  wizCardOwner: string | null
  valor: number
  descricao: string
  compradorSelecionadoId: string
  borrowerId: string | null
  installments: number
  participantesDivisao: string[]
  modoDivisaoWizard: 'IGUAL' | 'MANUAL'
  valoresDivisaoWizard: Record<string, number>
}
