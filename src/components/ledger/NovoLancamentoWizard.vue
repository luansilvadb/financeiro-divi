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
const pagueiPorOutro = ref(false)
const responsabilidade = ref<'eu' | 'por_amigo' | 'pelo_amigo'>('eu')
const amigo_id = ref('')

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
      if (data.responsabilidade) responsabilidade.value = data.responsabilidade
      if (data.amigo_id) amigo_id.value = data.amigo_id
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
    responsabilidade: responsabilidade.value,
    amigo_id: amigo_id.value,
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
  const totalRaw = Dinheiro.deReais(valor.value)
  // Invert total if it's a "ganho" (income) for the system's ledger logic
  // Note: Standard DIVI ledger treats everything as expense units. 
  // We'll treat Ganho as a negative expense for now or a reverse credit.
  const total = tipo.value === 'ganho' ? Dinheiro.deCentavos(-totalRaw.centavos) : totalRaw

  // Determine beneficiaries based on responsibility
  let finalBeneficiarios = [...beneficiarios_selecionados.value]
  if (responsabilidade.value === 'por_amigo' && amigo_id.value) {
    finalBeneficiarios = [amigo_id.value]
  }

  const partes = total.distribuir(finalBeneficiarios.length)
  
  const divisoes = finalBeneficiarios.map((id, index) => {
    return new Divisao(id, partes[index])
  })

  // Mapping based on spec:
  // Eu mesmo: origem=eu, pagador=eu
  // Eu paguei para amigo: origem=eu, pagador=amigo
  // Amigo pagou para mim: origem=amigo, pagador=eu
  
  const transacao = new Transacao({
    id: crypto.randomUUID(),
    descricao: descricao.value,
    total,
    origem_id: responsabilidade.value === 'pelo_amigo' ? amigo_id.value : 'eu',
    pagador_id: responsabilidade.value === 'por_amigo' ? amigo_id.value : 'eu',
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
  responsabilidade.value = 'eu'
  amigo_id.value = ''
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

    <div v-else-if="step === 5">
      <h2 class="text-xl font-bold mb-2 text-gray-800 text-center italic font-serif">"Além de você, quem mais aproveitou isso?"</h2>
      <p class="text-xs text-gray-400 text-center mb-6">(Isso ajuda a dividir o valor entre os amigos)</p>
      
      <div class="space-y-2 mb-8">
        <div 
          v-for="membro in membros" 
          :key="membro.id"
          @click="toggleBeneficiario(membro.id)"
          :class="['flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition', beneficiarios_selecionados.includes(membro.id) ? 'bg-blue-50 border-blue-500' : 'bg-white border-gray-50']"
        >
          <div class="flex items-center gap-3">
            <div :class="['p-2 rounded-full', beneficiarios_selecionados.includes(membro.id) ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400']">
              <User class="w-5 h-5" />
            </div>
            <span :class="['font-bold', beneficiarios_selecionados.includes(membro.id) ? 'text-blue-700' : 'text-gray-700']">
              {{ membro.nome }}
            </span>
          </div>
          <Check v-if="beneficiarios_selecionados.includes(membro.id)" class="w-6 h-6 text-blue-600" />
        </div>
      </div>

      <div class="flex gap-3">
        <button @click="prevStep" class="flex-1 border-2 border-gray-100 p-4 rounded-xl font-bold text-gray-400 hover:bg-gray-50 transition">Voltar</button>
        <button 
          @click="finalizar" 
          :disabled="beneficiarios_selecionados.length === 0 || valor <= 0"
          class="flex-1 bg-green-600 text-white p-4 rounded-xl font-bold hover:bg-green-700 transition shadow-lg shadow-green-100 flex items-center justify-center gap-2"
        >
          <Save class="w-5 h-5" /> Salvar
        </button>
      </div>
    </div>

    <div v-else-if="step === 4">
      <h2 class="text-xl font-bold mb-6 text-gray-800 text-center italic font-serif">"Quem vai pagar esse gasto?"</h2>
      
      <div v-if="!amigo_id && (responsabilidade === 'por_amigo' || responsabilidade === 'pelo_amigo')" class="space-y-4 mb-6">
        <p class="text-sm text-gray-500 text-center">Selecione o amigo envolvido:</p>
        <div class="grid grid-cols-1 gap-2">
          <button 
            v-for="membro in membros.filter(m => m.id !== 'eu')" 
            :key="membro.id"
            @click="amigo_id = membro.id"
            class="flex items-center gap-3 p-4 border-2 border-gray-100 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition"
          >
            <User class="w-5 h-5 text-gray-400" />
            <span class="font-bold text-gray-700">{{ membro.nome }}</span>
          </button>
        </div>
        <button @click="responsabilidade = 'eu'" class="w-full text-sm text-blue-600 font-bold">Voltar para as opções</button>
      </div>

      <div v-else class="grid grid-cols-1 gap-4 mb-8">
        <button 
          @click="responsabilidade = 'eu'; amigo_id = ''; nextStep()"
          :class="['flex items-center justify-between p-4 border-2 rounded-2xl transition group', responsabilidade === 'eu' && !amigo_id ? 'border-blue-500 bg-blue-50' : 'border-gray-50 bg-white hover:border-blue-200']"
        >
          <div class="flex items-center gap-4">
            <span class="text-3xl">🙋‍♂️</span>
            <div class="text-left">
              <span class="block font-bold text-gray-800">Eu mesmo!</span>
              <span class="text-xs text-gray-500">Eu passei o meu cartão ou dinheiro.</span>
            </div>
          </div>
        </button>

        <button 
          @click="responsabilidade = 'por_amigo'; amigo_id = ''"
          :class="['flex items-center justify-between p-4 border-2 rounded-2xl transition group', responsabilidade === 'por_amigo' ? 'border-blue-500 bg-blue-50' : 'border-gray-50 bg-white hover:border-blue-200']"
        >
          <div class="flex items-center gap-4">
            <span class="text-3xl">🤝</span>
            <div class="text-left">
              <span class="block font-bold text-gray-800">Eu paguei para um amigo</span>
              <span class="text-xs text-gray-500">{{ amigo_id ? `Pago para ${membros.find(m => m.id === amigo_id)?.nome}` : 'Passei meu cartão para outra pessoa.' }}</span>
            </div>
          </div>
          <Check v-if="amigo_id && responsabilidade === 'por_amigo'" class="w-5 h-5 text-blue-600" />
        </button>

        <button 
          @click="responsabilidade = 'pelo_amigo'; amigo_id = ''"
          :class="['flex items-center justify-between p-4 border-2 rounded-2xl transition group', responsabilidade === 'pelo_amigo' ? 'border-blue-500 bg-blue-50' : 'border-gray-50 bg-white hover:border-blue-200']"
        >
          <div class="flex items-center gap-4">
            <span class="text-3xl">👤</span>
            <div class="text-left">
              <span class="block font-bold text-gray-800">Um amigo pagou para mim</span>
              <span class="text-xs text-gray-500">{{ amigo_id ? `Pago por ${membros.find(m => m.id === amigo_id)?.nome}` : 'Meu amigo passou o cartão dele.' }}</span>
            </div>
          </div>
          <Check v-if="amigo_id && responsabilidade === 'pelo_amigo'" class="w-5 h-5 text-blue-600" />
        </button>
      </div>

      <div class="flex gap-3">
        <button @click="prevStep" class="flex-1 border-2 border-gray-100 p-4 rounded-xl font-bold text-gray-400 hover:bg-gray-50 transition">Voltar</button>
        <button 
          v-if="responsabilidade !== 'eu'"
          @click="nextStep" 
          :disabled="!amigo_id"
          class="flex-1 bg-blue-600 text-white p-4 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200 disabled:opacity-50 disabled:shadow-none"
        >
          Próximo
        </button>
      </div>
    </div>
  </div>
</template>
