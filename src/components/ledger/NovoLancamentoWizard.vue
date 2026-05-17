<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useNovoLancamentoWizard } from '../../modules/ledger/composables/useNovoLancamentoWizard'
import { useCartoesEFaturas } from '../../modules/ledger/composables/useCartoesEFaturas'
import WizardProgressBar from './WizardProgressBar.vue'
import WizardFooter from './WizardFooter.vue'

interface Props {
  membros: { id: string; nome: string }[]
}

const props = defineProps<Props>()
const emit = defineEmits(['salvar', 'cancelar'])

const { cartoes } = useCartoesEFaturas()

const {
  step,
  totalSteps,
  tipo,
  valor,
  descricao,
  compradorSelecionadoId, // <- NOVO
  beneficiarios_selecionados,
  cartaoSelecionadoId,
  adiantamentoRemetenteId,
  adiantamentoCartaoId,
  canAdvance,
  next,
  prev,
  toggleBeneficiario,
  finalizarComoGastoCartao,
  finalizarComoAdiantamento
} = useNovoLancamentoWizard(props.membros)

const valorInput = ref<HTMLInputElement | null>(null)

const focarValorInput = () => {
  if ((tipo.value === 'GASTO' && step.value === 4) || (tipo.value === 'ADIANTAMENTO' && step.value === 4)) {
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

const selecionarAdiantamentoCartao = (id: string) => {
  adiantamentoCartaoId.value = id
  next()
  focarValorInput()
}

const selecionarRemetente = (id: string) => {
  adiantamentoRemetenteId.value = id
  next()
}

const finalizar = async () => {
  if (tipo.value === 'GASTO') {
    await finalizarComoGastoCartao()
  } else {
    await finalizarComoAdiantamento()
  }
  emit('salvar')
}
</script>

<template>
  <div class="max-w-md mx-auto p-6 bg-white rounded-xl shadow-md pb-24 md:pb-6">
    <WizardProgressBar :current-step="step" :total-steps="totalSteps" />

    <!-- Passo 1: O que você quer fazer? -->
    <div v-if="step === 1" key="step1" class="space-y-6">
      <h2 class="text-xl font-bold mb-6 text-gray-800 text-center">O que você quer fazer?</h2>
      
      <div class="flex flex-col gap-4">
        <button 
          @click="tipo = 'GASTO'; next();"
          class="flex items-center gap-4 p-5 border-2 rounded-2xl border-blue-50 bg-blue-50/20 hover:border-blue-500 hover:bg-blue-50/50 shadow-sm transition-all text-left w-full group"
        >
          <span class="text-3xl">🛍️</span>
          <div>
            <strong class="block text-gray-800 text-base">Novo Gasto no Cartão</strong>
            <span class="text-xs text-gray-500">Registrar uma compra (divisão detalhada posterior)</span>
          </div>
        </button>

        <button 
          @click="tipo = 'ADIANTAMENTO'; next();"
          class="flex items-center gap-4 p-5 border-2 rounded-2xl border-emerald-50 bg-emerald-50/20 hover:border-emerald-500 hover:bg-emerald-50/50 shadow-sm transition-all text-left w-full group"
        >
          <span class="text-3xl">💸</span>
          <div>
            <strong class="block text-gray-800 text-base">Registrar Adiantamento</strong>
            <span class="text-xs text-gray-500">Registrar transferência de dinheiro para o dono do cartão</span>
          </div>
        </button>
      </div>
    </div>

    <!-- FLUXO GASTO -->
    <div v-else-if="tipo === 'GASTO'">
      <!-- Passo 2: Escolha do Cartão -->
      <div v-if="step === 2" key="gasto-step2">
        <h2 class="text-xl font-bold mb-8 text-gray-800 text-center">Escolha o cartão para o gasto</h2>
        <div class="grid grid-cols-1 gap-4">
          <button 
            v-for="c in cartoes"
            :key="c.id"
            @click="selecionarCartao(c.id)"
            :class="[
              'flex items-center justify-between p-6 border-2 rounded-2xl group shadow-sm transition-all text-left w-full',
              cartaoSelecionadoId === c.id ? 'border-blue-600 bg-blue-50/50' : 'border-slate-100 hover:border-blue-600 hover:bg-blue-50/50'
            ]"
          >
            <div class="flex items-center gap-5">
              <div class="bg-blue-900 text-white p-3 rounded-xl text-lg font-black shadow-md tracking-wider">
                {{ c.nome.substring(0, 2).toUpperCase() }}
              </div>
              <div>
                <span class="block font-bold text-gray-800 text-lg">{{ c.nome }}</span>
                <span class="text-xs text-gray-500">
                  Fechamento todo dia {{ c.diaFechamento }} • Dono: {{ props.membros.find(m => m.id === c.responsavelPadraoId)?.nome || 'Outro' }}
                </span>
              </div>
            </div>
          </button>
        </div>
      </div>

      <!-- Passo 3: Quem passou o cartão? -->
      <div v-else-if="step === 3" key="gasto-step3">
        <h2 class="text-xl font-bold mb-6 text-gray-800 text-center">Quem passou o cartão?</h2>
        
        <div class="grid grid-cols-2 gap-4 mb-8">
          <button 
            v-for="membro in props.membros" 
            :key="membro.id"
            @click="compradorSelecionadoId = membro.id; next(); focarValorInput();"
            :class="[
              'p-4 border-2 rounded-2xl flex flex-col items-center gap-3 transition-all',
              compradorSelecionadoId === membro.id 
                ? 'border-blue-600 bg-blue-50/50 shadow-sm' 
                : 'border-slate-50 hover:border-blue-600/30'
            ]"
          >
            <div class="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-lg font-bold text-blue-700">
              {{ membro.nome[0].toUpperCase() }}
            </div>
            <span class="font-bold text-sm text-gray-800">{{ membro.nome }}</span>
          </button>
        </div>
      </div>

      <!-- Passo 4: Dados do Gasto -->
      <div v-else-if="step === 4" key="gasto-step4">
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
    </div>

    <!-- FLUXO ADIANTAMENTO -->
    <div v-else-if="tipo === 'ADIANTAMENTO'">
      <!-- Passo 2: Quem enviou? -->
      <div v-if="step === 2" key="ant-step2">
        <h2 class="text-xl font-bold mb-6 text-gray-800 text-center">Quem está adiantando o dinheiro?</h2>
        <div class="grid grid-cols-2 gap-4">
          <button 
            v-for="m in props.membros" 
            :key="m.id"
            @click="selecionarRemetente(m.id)"
            :class="[
              'p-5 border-2 rounded-2xl flex flex-col items-center gap-3 transition-all',
              adiantamentoRemetenteId === m.id 
                ? 'border-emerald-600 bg-emerald-50/30' 
                : 'border-slate-50 hover:border-emerald-600/30'
            ]"
          >
            <div class="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center text-xl font-bold text-emerald-700">
              {{ m.nome[0].toUpperCase() }}
            </div>
            <span class="font-bold text-sm text-gray-800">{{ m.nome }}</span>
          </button>
        </div>
      </div>

      <!-- Passo 3: Para qual cartão? -->
      <div v-else-if="step === 3" key="ant-step3">
        <h2 class="text-xl font-bold mb-8 text-gray-800 text-center">Para qual cartão/fatura?</h2>
        <div class="grid grid-cols-1 gap-4">
          <button 
            v-for="c in cartoes"
            :key="c.id"
            @click="selecionarAdiantamentoCartao(c.id)"
            :class="[
              'flex items-center justify-between p-6 border-2 rounded-2xl group shadow-sm transition-all text-left w-full',
              adiantamentoCartaoId === c.id ? 'border-emerald-600 bg-emerald-50/30' : 'border-slate-100 hover:border-emerald-600 hover:bg-emerald-50/30'
            ]"
          >
            <div class="flex items-center gap-5">
              <div class="bg-emerald-700 text-white p-3 rounded-xl text-lg font-black shadow-md tracking-wider">
                {{ c.nome.substring(0, 2).toUpperCase() }}
              </div>
              <div>
                <span class="block font-bold text-gray-800 text-lg">{{ c.nome }}</span>
                <span class="text-xs text-gray-500 text-emerald-700 font-bold">
                  Destinatário: {{ props.membros.find(m => m.id === c.responsavelPadraoId)?.nome || 'Dono do Cartão' }}
                </span>
              </div>
            </div>
          </button>
        </div>
      </div>

      <!-- Passo 4: Qual o valor do Pix? -->
      <div v-else-if="step === 4" key="ant-step4">
        <h2 class="text-xl font-bold mb-8 text-gray-800 text-center">Qual o valor do adiantamento?</h2>
        
        <div class="mb-10 text-center bg-emerald-50/30 p-10 rounded-[2.5rem] border-2 border-emerald-100 group">
          <div class="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-4">Valor Adiantado (Pix)</div>
          <div class="flex items-baseline justify-center gap-2">
            <span class="text-emerald-500 text-2xl font-bold">R$</span>
            <input 
              ref="valorInput"
              v-model.number="valor"
              type="number" 
              step="0.01"
              class="w-48 text-6xl font-black text-emerald-600 bg-transparent border-none focus:outline-none mono tracking-tighter text-center"
              placeholder="0,00"
            />
          </div>
        </div>
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
