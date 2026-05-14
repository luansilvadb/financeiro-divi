<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { Check, User, Save, ArrowLeft, ArrowRight } from 'lucide-vue-next'
import { Dinheiro } from '../../shared/primitives/Dinheiro'
import { Transacao } from '../../modules/ledger/core/domain/Transacao'
import { Divisao } from '../../modules/ledger/core/domain/Divisao'

const STORAGE_KEY = 'divi_rascunho_novo_lancamento'

const step = ref(1)
const tipo = ref<'gasto' | 'ganho'>('gasto')
const valor = ref(0)
const descricao = ref('')

const intencao = ref<'solo' | 'split'>('solo')
const fonte_id = ref('eu')

const beneficiarios_selecionados = ref<string[]>(['eu'])
const membros = [
  { id: 'eu', nome: 'Luan (Você)' },
  { id: 'maria', nome: 'Maria' },
  { id: 'joao', nome: 'João' },
  { id: 'paula', nome: 'Paula' }
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
      if (data.intencao) intencao.value = data.intencao
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
    intencao: intencao.value,
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
  const totalRaw = Dinheiro.deReais(valor.value)
  // Invert total if it's a "ganho" (income) for the system's ledger logic
  // Note: Standard DIVI ledger treats everything as expense units. 
  // We'll treat Ganho as a negative expense for now or a reverse credit.
  const total = tipo.value === 'ganho' ? Dinheiro.deCentavos(-totalRaw.centavos) : totalRaw

  // Determine beneficiaries based on intent
  const finalBeneficiarios = intencao.value === 'solo' ? ['eu'] : [...beneficiarios_selecionados.value]

  const partes = total.distribuir(finalBeneficiarios.length)
  
  const divisoes = finalBeneficiarios.map((id, index) => {
    return new Divisao(id, partes[index])
  })

  // Mapping:
  // origem_id is who swiped (fonte_id)
  // pagador_id is 'eu' by default for simple ledger entries, 
  // or can be the same as origem if it's a direct debt.
  
  const transacao = new Transacao({
    id: crypto.randomUUID(),
    descricao: descricao.value,
    total,
    origem_id: fonte_id.value,
    pagador_id: 'eu', 
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
  tipo.value = 'gasto'
  intencao.value = 'solo'
  fonte_id.value = 'eu'
  beneficiarios_selecionados.value = ['eu']
}

const nextStep = () => step.value++
const prevStep = () => step.value--
</script>

<template>
  <div class="max-w-md mx-auto p-6 bg-white rounded-xl shadow-md">
    <div v-if="step === 1">
      <h2 class="text-xl font-bold mb-8 text-gray-800 text-center">O que você deseja registrar?</h2>
      <div class="grid grid-cols-1 gap-4">
        <button 
          @click="tipo = 'gasto'; nextStep()"
          class="flex items-center justify-between p-6 border-2 border-red-50 rounded-2xl hover:border-red-500 hover:bg-red-50 transition-all group shadow-sm hover:shadow-md"
        >
          <div class="flex items-center gap-5">
            <div class="bg-red-100 p-3 rounded-xl text-3xl">💸</div>
            <div class="text-left">
              <span class="block font-bold text-gray-800 text-lg">Um gasto</span>
              <span class="text-sm text-gray-500">Dinheiro que saiu da conta</span>
            </div>
          </div>
          <ArrowRight class="w-6 h-6 text-gray-300 group-hover:text-red-500 transform group-hover:translate-x-1 transition-transform" />
        </button>
        <button 
          @click="tipo = 'ganho'; nextStep()"
          class="flex items-center justify-between p-6 border-2 border-green-50 rounded-2xl hover:border-green-500 hover:bg-green-50 transition-all group shadow-sm hover:shadow-md"
        >
          <div class="flex items-center gap-5">
            <div class="bg-green-100 p-3 rounded-xl text-3xl">💰</div>
            <div class="text-left">
              <span class="block font-bold text-gray-800 text-lg">Um ganho</span>
              <span class="text-sm text-gray-500">Dinheiro que entrou na conta</span>
            </div>
          </div>
          <ArrowRight class="w-6 h-6 text-gray-300 group-hover:text-green-500 transform group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>

    <div v-else-if="step === 2">
      <h2 class="text-xl font-bold mb-8 text-gray-800 text-center">
        {{ tipo === 'gasto' ? 'Quanto você gastou?' : 'Quanto você recebeu?' }}
      </h2>
      <div class="mb-10 text-center bg-gray-50 p-8 rounded-3xl border-2 border-dashed border-gray-200">
        <div class="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Valor Total</div>
        <div class="flex items-center justify-center">
          <span class="text-gray-400 text-3xl font-mono mr-2">R$</span>
          <input 
            v-model.number="valor" 
            type="number" 
            step="0.01"
            placeholder="0,00" 
            autofocus
            class="w-3/4 text-6xl font-mono text-center bg-transparent border-none focus:outline-none text-blue-600 font-bold"
          />
        </div>
      </div>
      <div class="flex gap-4">
        <button @click="prevStep" class="flex-1 bg-white border-2 border-gray-100 p-5 rounded-2xl font-bold text-gray-400 hover:bg-gray-50 transition">Voltar</button>
        <button 
          @click="nextStep" 
          :disabled="valor <= 0"
          class="flex-1 bg-blue-600 text-white p-5 rounded-2xl font-bold hover:bg-blue-700 transition shadow-xl shadow-blue-100 disabled:opacity-50 disabled:shadow-none"
        >
          Próximo ➔
        </button>
      </div>
    </div>

    <div v-else-if="step === 3">
      <h2 class="text-xl font-bold mb-8 text-gray-800 text-center">
        {{ tipo === 'gasto' ? 'Com o que você gastou?' : 'De onde veio esse dinheiro?' }}
      </h2>
      <div class="mb-10">
        <input 
          v-model="descricao" 
          type="text" 
          :placeholder="tipo === 'gasto' ? 'Ex: Pizza, Aluguel, Sorvete...' : 'Ex: Salário, Venda do sofá...'" 
          class="w-full p-5 text-xl border-2 border-gray-100 rounded-2xl focus:border-blue-500 focus:outline-none bg-gray-50 transition-colors"
        />
      </div>
      <div class="flex gap-4">
        <button @click="prevStep" class="flex-1 bg-white border-2 border-gray-100 p-5 rounded-2xl font-bold text-gray-400 hover:bg-gray-50 transition">Voltar</button>
        <button 
          @click="nextStep" 
          :disabled="!descricao"
          class="flex-1 bg-blue-600 text-white p-5 rounded-2xl font-bold hover:bg-blue-700 transition shadow-xl shadow-blue-100 disabled:opacity-50 disabled:shadow-none"
        >
          Próximo ➔
        </button>
      </div>
    </div>

    <div v-else-if="step === 4">
      <div v-if="intencao === 'solo'" class="space-y-6">
        <h2 class="text-xl font-bold mb-2 text-gray-800 text-center">Isso é só seu, Luan?</h2>
        <p class="text-sm text-gray-400 text-center mb-8">Escolha como quer registrar esse gasto.</p>
        
        <div class="space-y-4">
          <button 
            @click="intencao = 'solo'; finalizar()"
            class="w-full flex items-center gap-5 p-6 bg-white border-2 border-gray-100 rounded-3xl hover:border-blue-500 transition-all text-left group"
          >
            <div class="bg-blue-50 p-4 rounded-2xl text-3xl group-hover:bg-blue-100 transition-colors">🙋‍♂️</div>
            <div class="flex-1">
              <span class="block font-bold text-gray-800 text-lg">Pagar sozinho</span>
              <span class="text-sm text-gray-500">Registrar 100% no meu nome</span>
            </div>
            <ArrowRight class="w-6 h-6 text-gray-300 group-hover:text-blue-500" />
          </button>

          <button 
            @click="intencao = 'split'"
            class="w-full flex items-center gap-5 p-6 bg-green-50 border-2 border-green-100 rounded-3xl hover:border-green-500 transition-all text-left group"
          >
            <div class="bg-white p-4 rounded-2xl text-3xl group-hover:bg-green-100 transition-colors">👥</div>
            <div class="flex-1">
              <span class="block font-bold text-gray-800 text-lg">Dividir com a galera</span>
              <span class="text-sm text-gray-500">Repartir com os amigos</span>
            </div>
            <ArrowRight class="w-6 h-6 text-gray-400 group-hover:text-green-500 transform rotate-90" />
          </button>
        </div>
        
        <button @click="prevStep" class="w-full mt-4 text-sm text-gray-400 font-bold">Voltar</button>
      </div>

      <div v-else class="space-y-6">
        <div class="flex justify-between items-center mb-4">
          <p class="font-bold text-gray-800">Com quem vamos dividir?</p>
          <button @click="beneficiarios_selecionados.length === membros.length ? beneficiarios_selecionados = ['eu'] : beneficiarios_selecionados = membros.map(m => m.id)" class="text-xs font-bold text-green-600 uppercase tracking-tighter">
            {{ beneficiarios_selecionados.length === membros.length ? 'Limpar' : 'Marcar todos' }}
          </button>
        </div>

        <div class="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2 no-scrollbar">
          <div 
            v-for="membro in membros" 
            :key="membro.id"
            @click="toggleBeneficiario(membro.id)"
            class="flex flex-col items-center gap-2 cursor-pointer min-w-[70px]"
          >
            <div :class="['w-16 h-16 rounded-full flex items-center justify-center font-bold text-xl transition-all border-4', beneficiarios_selecionados.includes(membro.id) ? 'bg-green-500 border-green-100 text-white scale-105' : 'bg-gray-100 border-transparent text-gray-400']">
              {{ membro.nome.charAt(0) }}
            </div>
            <span :class="['text-xs font-bold transition-colors', beneficiarios_selecionados.includes(membro.id) ? 'text-green-600' : 'text-gray-400']">
              {{ membro.nome.split(' ')[0] }}
            </span>
          </div>
        </div>

        <div :class="['p-5 rounded-3xl border-2 transition-all', beneficiarios_selecionados.length > 1 ? 'bg-green-50 border-green-100' : 'bg-amber-50 border-amber-100']">
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

        <p v-if="beneficiarios_selecionados.length === 1" class="text-center text-xs font-bold text-amber-500">
          ⚠️ Só você? Toque nos amigos para dividir!
        </p>

        <div class="flex gap-4 mt-6">
          <button @click="intencao = 'solo'" class="flex-1 bg-white border-2 border-gray-100 p-5 rounded-2xl font-bold text-gray-400">Voltar</button>
          <button 
            @click="nextStep" 
            :disabled="beneficiarios_selecionados.length === 0"
            class="flex-1 bg-green-600 text-white p-5 rounded-2xl font-bold shadow-xl shadow-green-100"
          >
            Próximo ➔
          </button>
        </div>
      </div>
    </div>

    <div v-else-if="step === 5">
      <h2 class="text-xl font-bold mb-2 text-gray-800 text-center">Quem passou o cartão?</h2>
      <p class="text-sm text-gray-400 text-center mb-8">Selecione quem tirou o dinheiro do bolso agora.</p>
      
      <div class="space-y-3 mb-8">
        <div 
          v-for="membroId in beneficiarios_selecionados" 
          :key="membroId"
          @click="fonte_id = membroId"
          :class="['flex items-center justify-between p-5 border-2 rounded-2xl cursor-pointer transition-all', fonte_id === membroId ? 'bg-blue-50 border-blue-500' : 'bg-white border-gray-100 hover:border-blue-200']"
        >
          <div class="flex items-center gap-4">
            <div :class="['w-12 h-12 rounded-full flex items-center justify-center font-bold transition-colors', fonte_id === membroId ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-400']">
              {{ membros.find(m => m.id === membroId)?.nome.charAt(0) }}
            </div>
            <span :class="['font-bold', fonte_id === membroId ? 'text-blue-700' : 'text-gray-700']">
              {{ membros.find(m => m.id === membroId)?.nome }}
            </span>
          </div>
          <div :class="['w-6 h-6 rounded-full border-2 flex items-center justify-center', fonte_id === membroId ? 'border-blue-500 bg-blue-500 text-white' : 'border-gray-200']">
            <Check v-if="fonte_id === membroId" class="w-4 h-4" />
          </div>
        </div>
      </div>

      <div class="flex gap-4">
        <button @click="prevStep" class="flex-1 bg-white border-2 border-gray-100 p-5 rounded-2xl font-bold text-gray-400 hover:bg-gray-50 transition">Voltar</button>
        <button 
          @click="finalizar" 
          class="flex-1 bg-green-600 text-white p-5 rounded-2xl font-bold hover:bg-green-700 transition shadow-xl shadow-green-100 flex items-center justify-center gap-2"
        >
          <Save class="w-5 h-5" /> Salvar
        </button>
      </div>
    </div>
  </div>
</template>
