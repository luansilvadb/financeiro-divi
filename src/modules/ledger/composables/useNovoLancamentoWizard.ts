import { ref, watch, onMounted, onUnmounted, computed } from 'vue'
import { Dinheiro } from '../../../shared/primitives/Dinheiro'
import { Transacao } from '../core/domain/Transacao'
import { Divisao } from '../core/domain/Divisao'

const STORAGE_KEY = 'divi_rascunho_novo_lancamento'

export function useNovoLancamentoWizard(membros: { id: string; nome: string }[]) {
  const step = ref(1)
  const totalSteps = 3
  const tipo = ref<'gasto' | 'ganho' | null>(null)
  const valor = ref(0)
  const descricao = ref('')
  const beneficiarios_selecionados = ref<string[]>([])
  const pagamentos = ref<Record<string, number>>({})
  const intencao = ref<'solo' | 'split'>('solo')

  // Inicializar pagamentos
  watch(() => membros, (novos) => {
    novos.forEach(m => {
      if (pagamentos.value[m.id] === undefined) {
        pagamentos.value[m.id] = 0
      }
    })
  }, { immediate: true })

  const somaPagamentos = computed(() => {
    return Object.values(pagamentos.value).reduce((acc, val) => acc + (val || 0), 0)
  })

  const restantePagamento = computed(() => {
    return valor.value - somaPagamentos.value
  })

  const pagamentosEquilibrados = computed(() => {
    return Math.abs(restantePagamento.value) < 0.001
  })

  watch(beneficiarios_selecionados, (newList) => {
    intencao.value = newList.length > 1 ? 'split' : 'solo'
  }, { deep: true })

  const next = () => step.value++
  const prev = () => step.value--

  const canAdvance = computed(() => {
    if (step.value === 1) return tipo.value !== null
    if (step.value === 2) return valor.value > 0 && descricao.value.length > 0
    if (step.value === 3) return beneficiarios_selecionados.value.length > 0 && pagamentosEquilibrados.value
    return false
  })

  const toggleBeneficiario = (id: string) => {
    if (beneficiarios_selecionados.value.includes(id)) {
      beneficiarios_selecionados.value = beneficiarios_selecionados.value.filter(b => b !== id)
    } else {
      beneficiarios_selecionados.value.push(id)
    }
  }

  const reset = () => {
    step.value = 1
    valor.value = 0
    descricao.value = ''
    tipo.value = null
    intencao.value = 'solo'
    beneficiarios_selecionados.value = []
    Object.keys(pagamentos.value).forEach(id => {
      pagamentos.value[id] = 0
    })
    localStorage.removeItem(STORAGE_KEY)
  }

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
        if (data.intencao !== undefined) intencao.value = data.intencao
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
      intencao: intencao.value,
      beneficiarios_selecionados: [...beneficiarios_selecionados.value],
      pagamentos: { ...pagamentos.value }
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

  const finalizar = () => {
    const totalRaw = Dinheiro.deReais(valor.value)
    const total = tipo.value === 'ganho' ? Dinheiro.deCentavos(-totalRaw.centavos) : totalRaw

    const partes = total.distribuir(beneficiarios_selecionados.value.length)
    const divisoes = beneficiarios_selecionados.value.map((id, index) => new Divisao(id, partes[index]))

    const listaPagamentos = Object.entries(pagamentos.value)
      .filter(([_, val]) => (val || 0) > 0)
      .map(([membro_id, val]) => {
        const v = Dinheiro.deReais(val)
        return {
          membro_id,
          valor: tipo.value === 'ganho' ? Dinheiro.deCentavos(-v.centavos) : v
        }
      })

    const transacao = new Transacao({
      id: crypto.randomUUID(),
      descricao: descricao.value,
      total,
      pagamentos: listaPagamentos,
      divisoes,
      status: 'pendente',
      data: new Date()
    })

    reset()
    return transacao
  }

  return {
    step,
    totalSteps,
    tipo,
    valor,
    descricao,
    beneficiarios_selecionados,
    pagamentos,
    intencao,
    restantePagamento,
    pagamentosEquilibrados,
    canAdvance,
    next,
    prev,
    selecionarTipo,
    toggleBeneficiario,
    reset,
    finalizar
  }
}
