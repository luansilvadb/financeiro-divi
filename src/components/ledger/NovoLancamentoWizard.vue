<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { Dinheiro } from '../../shared/primitives/Dinheiro'
import { Transacao } from '../../modules/ledger/core/domain/Transacao'
import { Divisao } from '../../modules/ledger/core/domain/Divisao'
import WizardProgressBar from './WizardProgressBar.vue'
import WizardFooter from './WizardFooter.vue'
import WizardStep1Tipo from './wizard/WizardStep1Tipo.vue'
import WizardStep2Dados from './wizard/WizardStep2Dados.vue'
import WizardStep3Divisao from './wizard/WizardStep3Divisao.vue'

const STORAGE_KEY = 'divi_rascunho_novo_lancamento'

interface Props {
  membros: { id: string; nome: string }[]
}

const props = defineProps<Props>()

const emit = defineEmits(['salvar', 'cancelar'])

const step = ref(1)
const totalSteps = 3
const tipo = ref<'gasto' | 'ganho' | null>(null)
const valor = ref(0)
const descricao = ref('')

const pagamentos = ref<Record<string, number>>({})

// Inicializar pagamentos com 0 para todos os membros
watch(() => props.membros, (novos) => {
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
  // Usar pequena margem para evitar erros de ponto flutuante no input manual
  return Math.abs(restantePagamento.value) < 0.001
})

const canAdvance = computed(() => {
  if (step.value === 1) return tipo.value !== null
  if (step.value === 2) return valor.value > 0 && descricao.value.length > 0
  if (step.value === 3) return beneficiarios_selecionados.value.length > 0 && pagamentosEquilibrados.value
  return false
})

const intencao = ref<'solo' | 'split'>('solo')

const beneficiarios_selecionados = ref<string[]>([])

onMounted(() => {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) {
    try {
      const data = JSON.parse(saved)
      if (data.tipo) tipo.value = data.tipo
      if (data.step) step.value = data.step
      if (data.valor) valor.value = data.valor
      if (data.descricao) descricao.value = data.descricao
      if (data.intencao) intencao.value = data.intencao
      if (data.beneficiarios_selecionados) beneficiarios_selecionados.value = data.beneficiarios_selecionados
      if (data.pagamentos) pagamentos.value = data.pagamentos
    } catch (e) {
      console.error('Erro ao restaurar rascunho:', e)
    }
  }
})

// Debounced save to localStorage
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
  (newState) => {
    clearTimeout(saveTimeout)
    saveTimeout = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState))
    }, 500) // Only save after 500ms of inactivity
  },
  { deep: true }
)

watch(beneficiarios_selecionados, (newList) => {
  intencao.value = newList.length > 1 ? 'split' : 'solo'
}, { deep: true })

const toggleBeneficiario = (id: string) => {
  if (beneficiarios_selecionados.value.includes(id)) {
    beneficiarios_selecionados.value = beneficiarios_selecionados.value.filter(b => b !== id)
  } else {
    beneficiarios_selecionados.value.push(id)
  }
  
  // Atualiza intenção baseado na seleção
  intencao.value = beneficiarios_selecionados.value.length > 1 ? 'split' : 'solo'
}

const finalizar = () => {
  const totalRaw = Dinheiro.deReais(valor.value)
  // Invert total if it's a "ganho" (income) for the system's ledger logic
  const total = tipo.value === 'ganho' ? Dinheiro.deCentavos(-totalRaw.centavos) : totalRaw

  // Determine beneficiaries based on selection
  const finalBeneficiarios = [...beneficiarios_selecionados.value]
  const partes = total.distribuir(finalBeneficiarios.length)
  
  const divisoes = finalBeneficiarios.map((id, index) => {
    return new Divisao(id, partes[index])
  })

  // Gerar lista de pagamentos
  const listaPagamentos = Object.entries(pagamentos.value)
    .filter(([_, val]) => (val || 0) > 0)
    .map(([membro_id, val]) => ({
      membro_id,
      valor: Dinheiro.deReais(val)
    }))

  const transacao = new Transacao({
    id: crypto.randomUUID(),
    descricao: descricao.value,
    total,
    pagamentos: listaPagamentos,
    divisoes,
    status: 'pendente',
    data: new Date()
  })

  emit('salvar', transacao)

  // Clear draft
  localStorage.removeItem(STORAGE_KEY)

  // Reset wizard
  step.value = 1
  valor.value = 0
  descricao.value = ''
  tipo.value = null
  intencao.value = 'solo'
  beneficiarios_selecionados.value = []
  Object.keys(pagamentos.value).forEach(id => {
    pagamentos.value[id] = 0
  })
}

const nextStep = () => step.value++
const prevStep = () => step.value--

const selecionarTipo = (novoTipo: 'gasto' | 'ganho') => {
  tipo.value = novoTipo
  // Reduced delay from 200ms to 50ms for snappier feel
  setTimeout(() => {
    nextStep()
  }, 50)
}
</script>

<template>
  <div class="max-w-md mx-auto p-6 bg-white rounded-xl shadow-md pb-24 md:pb-6">
    <WizardProgressBar :current-step="step" :total-steps="totalSteps" />

    <WizardStep1Tipo 
      v-if="step === 1" 
      :tipo="tipo" 
      @selecionar="selecionarTipo" 
    />

    <WizardStep2Dados
      v-else-if="step === 2"
      v-model:valor="valor"
      v-model:descricao="descricao"
      :tipo="tipo"
    />

    <WizardStep3Divisao
      v-else-if="step === 3"
      :membros="props.membros"
      :beneficiarios_selecionados="beneficiarios_selecionados"
      v-model:pagamentos="pagamentos"
      :valor="valor"
      :pagamentos-equilibrados="pagamentosEquilibrados"
      :restante-pagamento="restantePagamento"
      @toggle-beneficiario="toggleBeneficiario"
      @marcar-todos="beneficiarios_selecionados = props.membros.map(m => m.id)"
      @limpar="beneficiarios_selecionados = []"
    />

    <WizardFooter 
      :step="step" 
      :total-steps="totalSteps" 
      :can-advance="canAdvance"
      @next="nextStep"
      @prev="prevStep"
      @finish="finalizar"
    />
  </div>
</template>

