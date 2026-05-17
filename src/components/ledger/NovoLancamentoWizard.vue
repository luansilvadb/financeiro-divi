<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useNovoLancamentoWizard } from '../../modules/ledger/composables/useNovoLancamentoWizard'
import WizardProgressBar from './WizardProgressBar.vue'
import WizardFooter from './WizardFooter.vue'

interface Props {
  membros: { id: string; nome: string }[]
}

const props = defineProps<Props>()
const emit = defineEmits(['salvar', 'cancelar'])

const {
  step,
  totalSteps,
  tipo,
  valor,
  descricao,
  beneficiarios_selecionados,
  cartaoSelecionadoId,
  canAdvance,
  next,
  prev,
  toggleBeneficiario,
  finalizarComoGastoCartao
} = useNovoLancamentoWizard(props.membros)

const valorInput = ref<HTMLInputElement | null>(null)

const focarValorInput = () => {
  if (step.value === 2) {
    setTimeout(() => {
      valorInput.value?.focus()
    }, 150)
  }
}

onMounted(() => {
  focarValorInput()
})

const selecionarCartao = (id: string) => {
  cartaoSelecionadoId.value = id
  next()
  focarValorInput()
}

const marcarTodos = () => {
  beneficiarios_selecionados.value = props.membros.map(m => m.id)
}

const limparTodos = () => {
  beneficiarios_selecionados.value = []
}

const finalizar = async () => {
  await finalizarComoGastoCartao()
  emit('salvar')
}
</script>

<template>
  <div class="max-w-md mx-auto p-6 bg-white rounded-xl shadow-md pb-24 md:pb-6">
    <WizardProgressBar :current-step="step" :total-steps="totalSteps" />

    <!-- Passo 1: Escolha do Cartão -->
    <div v-if="step === 1" key="step1">
      <h2 class="text-xl font-bold mb-8 text-gray-800 text-center">Escolha o cartão para o gasto</h2>
      <div class="grid grid-cols-1 gap-4">
        <button 
          @click="selecionarCartao('c1')"
          :class="[
            'flex items-center justify-between p-6 border-2 rounded-2xl group shadow-sm transition-all text-left w-full',
            cartaoSelecionadoId === 'c1' ? 'border-purple-500 bg-purple-50/50' : 'border-purple-50 hover:border-purple-500 hover:bg-purple-50/50'
          ]"
        >
          <div class="flex items-center gap-5">
            <div class="bg-purple-600 text-white p-3 rounded-xl text-2xl font-black shadow-md tracking-wider">NU</div>
            <div>
              <span class="block font-bold text-gray-800 text-lg">Nubank</span>
              <span class="text-xs text-gray-500">Fechamento todo dia 10</span>
            </div>
          </div>
        </button>

        <button 
          @click="selecionarCartao('c2')"
          :class="[
            'flex items-center justify-between p-6 border-2 rounded-2xl group shadow-sm transition-all text-left w-full',
            cartaoSelecionadoId === 'c2' ? 'border-amber-500 bg-amber-50/50' : 'border-amber-50 hover:border-amber-500 hover:bg-amber-50/50'
          ]"
        >
          <div class="flex items-center gap-5">
            <div class="bg-neutral-900 text-amber-500 p-3 rounded-xl text-2xl font-black shadow-md tracking-wider">XP</div>
            <div>
              <span class="block font-bold text-gray-800 text-lg">XP Visa</span>
              <span class="text-xs text-gray-500">Fechamento todo dia 25</span>
            </div>
          </div>
        </button>
      </div>
    </div>

    <!-- Passo 2: Dados do Gasto -->
    <div v-else-if="step === 2" key="step2">
      <h2 class="text-xl font-bold mb-8 text-gray-800 text-center">Qual o valor e descrição?</h2>
      
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
          placeholder="O que você comprou?" 
          class="w-full p-5 text-lg border-2 border-blue-100/50 rounded-2xl focus:border-blue-200 focus:outline-none bg-white/50 text-center placeholder:text-blue-300 text-blue-600"
        />
      </div>
    </div>

    <!-- Passo 3: Quem Consumiu -->
    <div v-else-if="step === 3" key="step3">
      <h2 class="text-xl font-bold mb-6 text-gray-800 text-center">Quem consumiu esse gasto?</h2>
      
      <div class="flex justify-center gap-4 mb-8">
        <button 
          @click="marcarTodos" 
          class="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors"
        >
          Selecionar Todos
        </button>
        <button 
          @click="limparTodos" 
          class="text-xs font-bold text-gray-600 hover:text-gray-800 bg-gray-50 px-3 py-1.5 rounded-lg transition-colors"
        >
          Limpar Todos
        </button>
      </div>

      <div class="grid grid-cols-2 gap-4 mb-8">
        <button 
          v-for="membro in props.membros" 
          :key="membro.id"
          @click="toggleBeneficiario(membro.id)"
          :class="[
            'p-4 border-2 rounded-2xl flex flex-col items-center gap-3 transition-all',
            beneficiarios_selecionados.includes(membro.id) 
              ? 'border-indigo-600 bg-indigo-50/50 shadow-sm' 
              : 'border-slate-50 hover:border-indigo-600/30'
          ]"
        >
          <div class="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-lg font-bold text-indigo-700">
            {{ membro.nome[0].toUpperCase() }}
          </div>
          <span class="font-bold text-sm text-gray-800">{{ membro.nome }}</span>
        </button>
      </div>
    </div>

    <WizardFooter 
      :step="step" 
      :total-steps="totalSteps" 
      :can-advance="canAdvance"
      @next="next(); focarValorInput();"
      @prev="prev"
      @finish="finalizar"
    />
  </div>
</template>
