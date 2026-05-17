import { ref } from 'vue'

export function useNovoLancamentoWizard(membros: { id: string; nome: string }[]) {
  const step = ref(1)
  const tipo = ref<'gasto' | 'ganho' | null>(null)
  const valor = ref(0)
  const descricao = ref('')

  return {
    step,
    tipo,
    valor,
    descricao
  }
}
