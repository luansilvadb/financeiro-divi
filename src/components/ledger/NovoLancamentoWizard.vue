<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { Check, User, Save, ArrowLeft } from 'lucide-vue-next'
// Note: Dinheiro will be used later for validation/formatting
// import { Dinheiro } from '../../shared/primitives/Dinheiro'

const STORAGE_KEY = 'divi_rascunho_novo_lancamento'

const step = ref(1)
const valor = ref(0)
const descricao = ref('')

const fonte_id = ref('meu_cartao')
const pagador_id = ref('eu')
const pagueiPorOutro = ref(false)

const beneficiarios_selecionados = ref<string[]>(['eu'])
const membros = [
  { id: 'eu', nome: 'Eu' },
  { id: 'colega_x', nome: 'Colega X' },
  { id: 'colega_y', nome: 'Colega Y' }
]

onMounted(() => {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) {
    try {
      const data = JSON.parse(saved)
      if (data.step) step.value = data.step
      if (data.valor) valor.value = data.valor
      if (data.descricao) descricao.value = data.descricao
      if (data.fonte_id) fonte_id.value = data.fonte_id
      if (data.pagador_id) pagador_id.value = data.pagador_id
      if (data.pagueiPorOutro !== undefined) pagueiPorOutro.value = data.pagueiPorOutro
      if (data.beneficiarios_selecionados) beneficiarios_selecionados.value = data.beneficiarios_selecionados
    } catch (e) {
      console.error('Erro ao restaurar rascunho:', e)
    }
  }
})

watch(
  () => ({
    step: step.value,
    valor: valor.value,
    descricao: descricao.value,
    fonte_id: fonte_id.value,
    pagador_id: pagador_id.value,
    pagueiPorOutro: pagueiPorOutro.value,
    beneficiarios_selecionados: [...beneficiarios_selecionados.value]
  }),
  (newState) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState))
  },
  { deep: true }
)

const toggleBeneficiario = (id: string) => {
  if (beneficiarios_selecionados.value.includes(id)) {
    beneficiarios_selecionados.value = beneficiarios_selecionados.value.filter(b => b !== id)
  } else {
    beneficiarios_selecionados.value.push(id)
  }
}

const finalizar = () => {
  console.log('Transação Finalizada:', {
    valor: valor.value,
    descricao: descricao.value,
    fonte: fonte_id.value,
    pagador: pagueiPorOutro.value ? pagador_id.value : 'eu',
    beneficiarios: beneficiarios_selecionados.value
  })

  // Clear draft
  localStorage.removeItem(STORAGE_KEY)

  alert('Transação salva com sucesso! (Veja o console)')
  // Reset wizard
  step.value = 1
  valor.value = 0
  descricao.value = ''
  pagueiPorOutro.value = false
  beneficiarios_selecionados.value = ['eu']
}

const nextStep = () => step.value++
const prevStep = () => step.value--
</script>

<template>
  <div class="max-w-md mx-auto p-6 bg-white rounded-xl shadow-md">
    <div v-if="step === 1">
      <h2 class="text-xl font-bold mb-4">Quanto e O Quê?</h2>
      <div class="mb-4 text-center">
        <span class="text-gray-500 mr-2">R$</span>
        <input 
          v-model.number="valor" 
          type="number" 
          step="0.01"
          placeholder="0,00" 
          class="w-3/4 text-4xl font-mono text-center border-b-2 border-blue-500 focus:outline-none"
        />
      </div>
      <input 
        v-model="descricao" 
        type="text" 
        placeholder="Descrição (ex: Pizza)" 
        class="w-full p-2 mb-6 border rounded"
      />
      <button 
        @click="nextStep" 
        class="w-full bg-blue-600 text-white p-3 rounded-lg font-bold hover:bg-blue-700 transition"
      >
        Próximo
      </button>
    </div>

    <div v-else-if="step === 2">
      <h2 class="text-xl font-bold mb-4">Quem e Como?</h2>
      
      <label class="block text-sm font-medium text-gray-700 mb-2">De onde saiu o dinheiro?</label>
      <div class="grid grid-cols-2 gap-2 mb-6">
        <button 
          @click="fonte_id = 'meu_cartao'"
          :class="['p-2 border rounded transition', fonte_id === 'meu_cartao' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-gray-200']"
        >
          Meu Cartão
        </button>
        <button 
          @click="fonte_id = 'dinheiro'"
          :class="['p-2 border rounded transition', fonte_id === 'dinheiro' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-gray-200']"
        >
          Dinheiro Vivo
        </button>
      </div>

      <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-6 border border-gray-100">
        <span class="text-sm font-medium text-gray-700">Paguei por outra pessoa?</span>
        <button 
          @click="pagueiPorOutro = !pagueiPorOutro"
          :class="['relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2', pagueiPorOutro ? 'bg-blue-600' : 'bg-gray-200']"
        >
          <span :class="['pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out', pagueiPorOutro ? 'translate-x-5' : 'translate-x-0']"></span>
        </button>
      </div>

      <div v-if="pagueiPorOutro" class="mb-6 space-y-2">
        <label class="block text-sm font-medium text-gray-700">Quem é o dono da dívida?</label>
        <select v-model="pagador_id" class="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500 bg-white">
          <option value="colega_x">Colega X</option>
          <option value="grupo">O Grupo</option>
        </select>
      </div>

      <div class="flex gap-2">
        <button @click="prevStep" class="flex-1 border p-3 rounded-lg hover:bg-gray-50 transition">Voltar</button>
        <button @click="nextStep" class="flex-1 bg-blue-600 text-white p-3 rounded-lg font-bold hover:bg-blue-700 transition">Próximo</button>
      </div>
    </div>

    <div v-else-if="step === 3">
      <h2 class="text-xl font-bold mb-4">Para Quem?</h2>
      <p class="text-sm text-gray-500 mb-4">Selecione quem se beneficiou dessa despesa (Divisão Igual).</p>
      
      <div class="space-y-2 mb-6">
        <div 
          v-for="membro in membros" 
          :key="membro.id"
          @click="toggleBeneficiario(membro.id)"
          :class="['flex items-center justify-between p-3 border rounded-lg cursor-pointer transition', beneficiarios_selecionados.includes(membro.id) ? 'bg-blue-50 border-blue-500' : 'bg-white border-gray-200']"
        >
          <div class="flex items-center gap-3">
            <User class="w-5 h-5 text-gray-400" />
            <span :class="['font-medium', beneficiarios_selecionados.includes(membro.id) ? 'text-blue-700' : 'text-gray-700']">
              {{ membro.nome }}
            </span>
          </div>
          <Check v-if="beneficiarios_selecionados.includes(membro.id)" class="w-5 h-5 text-blue-600" />
        </div>
      </div>

      <div class="flex gap-2">
        <button @click="prevStep" class="flex-1 border p-3 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-50 transition">
          <ArrowLeft class="w-5 h-5" /> Voltar
        </button>
        <button 
          @click="finalizar" 
          :disabled="beneficiarios_selecionados.length === 0 || valor <= 0"
          class="flex-1 bg-green-600 text-white p-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save class="w-5 h-5" /> Salvar
        </button>
      </div>
    </div>
  </div>
</template>
