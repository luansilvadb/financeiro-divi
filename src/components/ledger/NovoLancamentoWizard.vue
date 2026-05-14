<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { Check, User, Save, ArrowLeft } from 'lucide-vue-next'
import { Dinheiro } from '../../shared/primitives/Dinheiro'
import { Transacao } from '../../modules/ledger/core/domain/Transacao'
import { Divisao } from '../../modules/ledger/core/domain/Divisao'

const STORAGE_KEY = 'divi_rascunho_novo_lancamento'

const step = ref(1)
const tipo = ref<'gasto' | 'ganho'>('gasto')
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

const emit = defineEmits(['salvar', 'cancelar'])

onMounted(() => {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) {
    try {
      const data = JSON.parse(saved)
      if (data.tipo) tipo.value = data.tipo
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
    tipo: tipo.value,
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
  const total = Dinheiro.deReais(valor.value)
  const partes = total.distribuir(beneficiarios_selecionados.value.length)
  
  const divisoes = beneficiarios_selecionados.value.map((id, index) => {
    return new Divisao(id, partes[index])
  })

  const transacao = new Transacao({
    id: crypto.randomUUID(),
    descricao: descricao.value,
    total,
    origem_id: fonte_id.value,
    pagador_id: pagueiPorOutro.value ? pagador_id.value : 'eu',
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
  pagueiPorOutro.value = false
  beneficiarios_selecionados.value = ['eu']
}

const nextStep = () => step.value++
const prevStep = () => step.value--
</script>

<template>
  <div class="max-w-md mx-auto p-6 bg-white rounded-xl shadow-md">
    <div v-if="step === 1">
      <h2 class="text-xl font-bold mb-6 text-gray-800 text-center italic font-serif">"Você quer anotar um gasto ou um ganho?"</h2>
      <div class="grid grid-cols-1 gap-4">
        <button 
          @click="tipo = 'gasto'; nextStep()"
          class="flex items-center justify-between p-5 border-2 border-red-50 rounded-2xl hover:border-red-500 hover:bg-red-50 transition-all group shadow-sm hover:shadow-md"
        >
          <div class="flex items-center gap-4">
            <span class="text-4xl">💸</span>
            <div class="text-left">
              <span class="block font-bold text-gray-800 text-lg">Um gasto</span>
              <span class="text-sm text-gray-500">Ex: Pizza, Aluguel, Uber</span>
            </div>
          </div>
          <ArrowRight class="w-6 h-6 text-gray-300 group-hover:text-red-500 transform group-hover:translate-x-1 transition-transform" />
        </button>
        <button 
          @click="tipo = 'ganho'; nextStep()"
          class="flex items-center justify-between p-5 border-2 border-green-50 rounded-2xl hover:border-green-500 hover:bg-green-50 transition-all group shadow-sm hover:shadow-md"
        >
          <div class="flex items-center gap-4">
            <span class="text-4xl">💰</span>
            <div class="text-left">
              <span class="block font-bold text-gray-800 text-lg">Um ganho</span>
              <span class="text-sm text-gray-500">Ex: Salário, Reembolso</span>
            </div>
          </div>
          <ArrowRight class="w-6 h-6 text-gray-300 group-hover:text-green-500 transform group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>

    <div v-else-if="step === 2">
      <h2 class="text-xl font-bold mb-6 text-gray-800 text-center italic font-serif">
        {{ tipo === 'gasto' ? '"Qual é o valor desse gasto?"' : '"Qual o valor que você recebeu?"' }}
      </h2>
      <div class="mb-8 text-center bg-gray-50 p-6 rounded-2xl border-2 border-dashed border-gray-200">
        <span class="text-gray-400 text-2xl mr-2">R$</span>
        <input 
          v-model.number="valor" 
          type="number" 
          step="0.01"
          placeholder="0,00" 
          autofocus
          class="w-3/4 text-5xl font-mono text-center bg-transparent border-b-4 border-blue-500 focus:outline-none text-blue-600"
        />
      </div>
      <div class="flex gap-3">
        <button @click="prevStep" class="flex-1 border-2 border-gray-100 p-4 rounded-xl font-bold text-gray-400 hover:bg-gray-50 transition">Voltar</button>
        <button 
          @click="nextStep" 
          :disabled="valor <= 0"
          class="flex-1 bg-blue-600 text-white p-4 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200 disabled:opacity-50 disabled:shadow-none"
        >
          Próximo
        </button>
      </div>
    </div>

    <div v-else-if="step === 3">
      <h2 class="text-xl font-bold mb-6 text-gray-800 text-center italic font-serif">
        {{ tipo === 'gasto' ? '"Me conta, o que você pagou?"' : '"Me conta, de onde veio esse dinheiro?"' }}
      </h2>
      <div class="mb-8">
        <input 
          v-model="descricao" 
          type="text" 
          :placeholder="tipo === 'gasto' ? 'Ex: Pizza, Aluguel, Sorvete...' : 'Ex: Salário, Venda do sofá...'" 
          class="w-full p-4 text-lg border-2 border-gray-100 rounded-xl focus:border-blue-500 focus:outline-none bg-gray-50"
        />
      </div>
      <div class="flex gap-3">
        <button @click="prevStep" class="flex-1 border-2 border-gray-100 p-4 rounded-xl font-bold text-gray-400 hover:bg-gray-50 transition">Voltar</button>
        <button 
          @click="nextStep" 
          :disabled="!descricao"
          class="flex-1 bg-blue-600 text-white p-4 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200 disabled:opacity-50 disabled:shadow-none"
        >
          Próximo
        </button>
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
