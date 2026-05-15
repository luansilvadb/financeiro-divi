<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { ArrowRight } from 'lucide-vue-next'
import { Dinheiro } from '../../shared/primitives/Dinheiro'
import { Transacao } from '../../modules/ledger/core/domain/Transacao'
import { Divisao } from '../../modules/ledger/core/domain/Divisao'
import WizardProgressBar from './WizardProgressBar.vue'
import WizardFooter from './WizardFooter.vue'

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

const valorInput = ref<HTMLInputElement | null>(null)

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

// Focus input in step 2
watch(step, (newStep) => {
  if (newStep === 2) {
    setTimeout(() => {
      valorInput.value?.focus()
    }, 150) // Reduced from 400ms
  }
})

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

    <div v-if="step === 1" key="step1">
        <h2 class="text-xl font-bold mb-8 text-gray-800 text-center">O que você deseja registrar?</h2>
        <div class="grid grid-cols-1 gap-4">
          <button 
            @click="selecionarTipo('gasto')"
            :class="[
              'flex items-center justify-between p-6 border-2 rounded-2xl group shadow-sm',
              tipo === 'gasto' ? 'border-red-500 bg-red-50' : 'border-red-50 hover:border-red-500 hover:bg-red-50'
            ]"
          >
            <div class="flex items-center gap-5">
              <div class="bg-red-100 p-3 rounded-xl text-3xl">💸</div>
              <div class="text-left">
                <span class="block font-bold text-gray-800 text-lg">Um gasto</span>
                <span class="text-sm text-gray-500">Dinheiro que saiu da conta</span>
              </div>
            </div>
            <ArrowRight :class="['w-6 h-6 transform', tipo === 'gasto' ? 'text-red-500' : 'text-gray-300 group-hover:text-red-500']" />
          </button>
          <button 
            @click="selecionarTipo('ganho')"
            :class="[
              'flex items-center justify-between p-6 border-2 rounded-2xl group shadow-sm',
              tipo === 'ganho' ? 'border-green-500 bg-green-50' : 'border-green-50 hover:border-green-500 hover:bg-green-50'
            ]"
          >
            <div class="flex items-center gap-5">
              <div class="bg-green-100 p-3 rounded-xl text-3xl">💰</div>
              <div class="text-left">
                <span class="block font-bold text-gray-800 text-lg">Um ganho</span>
                <span class="text-sm text-gray-500">Dinheiro que entrou na conta</span>
              </div>
            </div>
            <ArrowRight :class="['w-6 h-6 transform', tipo === 'ganho' ? 'text-green-500' : 'text-gray-300 group-hover:text-green-500']" />
          </button>
        </div>
      </div>

      <div v-else-if="step === 2" key="step2">
        <h2 class="text-xl font-bold mb-8 text-gray-800 text-center">
          Quais os dados do lançamento?
        </h2>
        
        <div class="mb-10 text-center bg-blue-50/50 p-10 rounded-[2.5rem] border-2 border-blue-100 group">
          <div class="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-4">Valor Total</div>
          <div class="flex items-baseline justify-center gap-2 mb-8">
            <span class="text-blue-300 text-2xl font-bold">R$</span>
            <input 
              ref="valorInput"
              v-model.number="valor" 
              type="number" 
              step="0.01"
              class="w-48 text-6xl font-black text-blue-600 bg-transparent border-none focus:outline-none mono tracking-tighter text-center"
              placeholder="0,00"
            />
          </div>
          
          <input 
            v-model="descricao" 
            type="text" 
            :placeholder="tipo === 'gasto' ? 'O que você comprou?' : 'De onde veio?'" 
            class="w-full p-5 text-lg border-2 border-blue-100/50 rounded-2xl focus:border-blue-200 focus:outline-none bg-white/50 text-center placeholder:text-blue-300 text-blue-600"
          />
        </div>
      </div>

      <div v-else-if="step === 3" key="step3">
        <div class="space-y-6">
          <div class="flex justify-between items-center mb-4">
            <p class="font-bold text-gray-800">Com quem vamos dividir?</p>
            <button @click="beneficiarios_selecionados.length === props.membros.length ? beneficiarios_selecionados = [] : beneficiarios_selecionados = props.membros.map(m => m.id)" class="text-xs font-bold text-green-600 uppercase tracking-tighter">
              {{ beneficiarios_selecionados.length === props.membros.length ? 'Limpar' : 'Marcar todos' }}
            </button>
          </div>

          <div class="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2 no-scrollbar">
            <div 
              v-for="membro in props.membros" 
              :key="membro.id"
              @click="toggleBeneficiario(membro.id)"
              class="flex flex-col items-center gap-2 cursor-pointer min-w-[70px]"
            >
              <div :class="['w-16 h-16 rounded-full flex items-center justify-center font-bold text-xl border-4', beneficiarios_selecionados.includes(membro.id) ? 'bg-green-500 border-green-100 text-white' : 'bg-gray-100 border-transparent text-gray-400']">
                {{ membro.nome.charAt(0) }}
              </div>
              <span :class="['text-xs font-bold', beneficiarios_selecionados.includes(membro.id) ? 'text-green-600' : 'text-gray-400']">
                {{ membro.nome.split(' ')[0] }}
              </span>
            </div>
          </div>

          <div class="space-y-4 border-t pt-6">
            <div class="flex justify-between items-center">
              <p class="font-bold text-gray-800">Quem abriu a carteira?</p>
              <div :class="['text-[10px] font-black px-2 py-1 rounded-full', pagamentosEquilibrados ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700']">
                {{ pagamentosEquilibrados ? '✅ Equilibrado' : `Faltam R$ ${restantePagamento.toFixed(2)}` }}
              </div>
            </div>

            <div class="space-y-3">
              <div v-for="membro in props.membros" :key="membro.id" class="flex items-center gap-4 bg-gray-50/50 p-3 rounded-2xl border border-transparent hover:border-blue-100">
                <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600 text-sm shadow-sm">
                  {{ membro.nome.charAt(0) }}
                </div>
                <div class="flex-1">
                  <span class="block text-sm font-bold text-gray-700">{{ membro.nome }}</span>
                </div>
                <div class="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-gray-200 focus-within:border-blue-500 shadow-sm">
                  <span class="text-[10px] font-bold text-gray-400">R$</span>
                  <input 
                    v-model.number="pagamentos[membro.id]" 
                    type="number" 
                    step="0.01"
                    class="w-20 text-right font-bold text-gray-800 focus:outline-none bg-transparent text-sm"
                    placeholder="0,00"
                  />
                </div>
              </div>
            </div>
          </div>

          <div :class="['p-5 rounded-3xl border-2', beneficiarios_selecionados.length > 1 ? 'bg-green-50 border-green-100' : 'bg-amber-50 border-amber-100']">
            <div class="flex justify-between items-center mb-3">
              <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total</span>
              <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Para cada um</span>
            </div>
            <div class="flex justify-between items-baseline">
              <span class="text-lg font-bold text-gray-700">R$ {{ valor.toFixed(2).replace('.', ',') }}</span>
              <span :class="['text-2xl font-black', beneficiarios_selecionados.length > 1 ? 'text-green-600' : 'text-amber-600']">
                R$ {{ (valor / (beneficiarios_selecionados.length || 1)).toFixed(2).replace('.', ',') }}
              </span>
            </div>
          </div>
        </div>
      </div>

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

