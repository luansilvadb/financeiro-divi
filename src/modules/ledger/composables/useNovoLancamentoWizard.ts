import { ref, watch, onMounted, onUnmounted } from 'vue'

const STORAGE_KEY = 'divi_rascunho_novo_lancamento'

export function useNovoLancamentoWizard(_membros: { id: string; nome: string }[]) {
  const step = ref(1)
  const tipo = ref<'gasto' | 'ganho' | null>(null)
  const valor = ref(0)
  const descricao = ref('')
  const beneficiarios_selecionados = ref<string[]>([])
  const pagamentos = ref<Record<string, number>>({})

  const next = () => step.value++
  const prev = () => step.value--

  let transitionTimeout: ReturnType<typeof setTimeout>
  const selecionarTipo = (t: 'gasto' | 'ganho') => {
    tipo.value = t
    clearTimeout(transitionTimeout)
    transitionTimeout = setTimeout(() => next(), 50)
  }

  // Carregar do localStorage
  onMounted(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const data = JSON.parse(saved)
        if (data.tipo !== undefined) tipo.value = data.tipo
        if (data.step !== undefined) step.value = data.step
        if (data.valor !== undefined) valor.value = data.valor
        if (data.descricao !== undefined) descricao.value = data.descricao
        if (data.beneficiarios_selecionados !== undefined) beneficiarios_selecionados.value = data.beneficiarios_selecionados
        if (data.pagamentos !== undefined) pagamentos.value = data.pagamentos
      } catch (e) {
        console.error('Erro ao carregar rascunho:', e)
      }
    }
  })

  // Watcher para salvar
  let saveTimeout: ReturnType<typeof setTimeout>
  watch(
    () => ({
      tipo: tipo.value,
      step: step.value,
      valor: valor.value,
      descricao: descricao.value,
      beneficiarios_selecionados: beneficiarios_selecionados.value,
      pagamentos: pagamentos.value
    }),
    (state) => {
      clearTimeout(saveTimeout)
      saveTimeout = setTimeout(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
      }, 500)
    },
    { deep: true }
  )

  onUnmounted(() => {
    clearTimeout(saveTimeout)
    clearTimeout(transitionTimeout)
  })

  return {
    step,
    tipo,
    valor,
    descricao,
    beneficiarios_selecionados,
    pagamentos,
    next,
    prev,
    selecionarTipo
  }
}
