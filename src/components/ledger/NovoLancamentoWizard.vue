<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useNovoLancamentoWizard } from '../../modules/ledger/composables/useNovoLancamentoWizard'
import { useCartoesEFaturas } from '../../modules/ledger/composables/useCartoesEFaturas'

interface Props {
  membros: { id: string; nome: string }[]
}

const props = defineProps<Props>()
const emit = defineEmits(['salvar', 'cancelar'])

const { cartoes, inicializar: inicializarCartoes } = useCartoesEFaturas()

onMounted(async () => {
  await inicializarCartoes()
})

const {
  step,
  totalSteps,
  wizFlow,
  wizPayment,
  wizCardOwner,
  valor,
  descricao,
  compradorSelecionadoId,
  borrowerId,
  installments,
  participantesDivisao,
  canAdvance,
  next,
  prev,
  finalizarGastoOuEmprestimo
} = useNovoLancamentoWizard(props.membros)

// Chips de sugestão inteligentes
const quickChips = computed(() => {
  if (wizFlow.value === 'loan') {
    return ['Empréstimo', 'Luz dele', 'Uber compartilhado', 'Supermercado']
  }
  return ['Mercado', 'Ifood', 'Luz', 'Internet', 'Água', 'Limpeza']
})

const selecionarChip = (chip: string) => {
  descricao.value = chip
}

const selecionarFluxo = (flow: 'expense' | 'loan', payment: 'pix' | 'card', cardOwner: string | null) => {
  wizFlow.value = flow
  wizPayment.value = payment
  wizCardOwner.value = cardOwner
  next()
}

const ajustarParcelas = (delta: number) => {
  installments.value = Math.max(1, installments.value + delta)
}

const isValorStep = computed(() => (step.value === 3 && wizFlow.value === 'expense') || (step.value === 4 && wizFlow.value === 'loan'))
const hasValorError = computed(() => isValorStep.value && (valor.value === undefined || valor.value === null || Number(valor.value) <= 0))
const showInputWarning = ref(false)
const inputShake = ref(false)

const triggerShake = () => {
  inputShake.value = true
  showInputWarning.value = true
  setTimeout(() => {
    inputShake.value = false
  }, 500)
}

const handleNext = () => {
  if (isValorStep.value && hasValorError.value) {
    triggerShake()
    return
  }
  next()
}

const infoParcelamento = computed(() => {
  if (installments.value <= 1) return 'À vista (Sem parcelamento)'
  const valReais = Number(valor.value) || 0
  const parcela = (valReais / installments.value).toFixed(2).replace('.', ',')
  return `Serão ${installments.value}x de R$ ${parcela}. (Apenas a 1ª parcela de R$ ${parcela} entra nos acertos de hoje)`
})

const getMembroNome = (id: string | null) => {
  if (!id) return ''
  return props.membros.find(m => m.id === id)?.nome || id
}

// Atalhos de divisão rápida
const dividirComTodos = () => {
  participantesDivisao.value = props.membros.map(m => m.id)
}
const dividirApenasEu = () => {
  if (compradorSelecionadoId.value) {
    participantesDivisao.value = [compradorSelecionadoId.value]
  }
}

const toggleSplitMember = (id: string) => {
  const idx = participantesDivisao.value.indexOf(id)
  if (idx >= 0) {
    participantesDivisao.value.splice(idx, 1)
  } else {
    participantesDivisao.value.push(id)
  }
}

// Resumo cognitivo para segurança do morador
const cognitiveSummary = computed(() => {
  const mPago = getMembroNome(compradorSelecionadoId.value)
  const mMetodo = wizPayment.value === 'pix' ? 'Pix/Dinheiro' : `Cartão (${getMembroNome(wizCardOwner.value)})`
  const parts = participantesDivisao.value.map(id => getMembroNome(id)).join(', ')
  return `Você está salvando: R$ ${(valor.value || 0).toFixed(2).replace('.', ',')} de "${descricao.value || 'gasto'}" pago por ${mPago} no ${mMetodo}, dividido com: ${parts || 'ninguém'}.`
})

const splitSummaryTitle = computed(() => {
  const count = participantesDivisao.value.length
  return `Dividido igualmente entre ${count} ${count === 1 ? 'pessoa' : 'pessoas'}`
})

const splitSummaryDesc = computed(() => {
  const count = participantesDivisao.value.length
  if (count === 0) return 'Selecione quem dividirá'
  const valReais = Number(valor.value) || 0
  const cadaUm = (valReais / count).toFixed(2).replace('.', ',')
  return `Cada um paga R$ ${cadaUm}`
})

const handleGravar = async () => {
  await finalizarGastoOuEmprestimo()
  emit('salvar')
}
</script>

<template>
  <div class="acrylic-card rounded-f-md p-6 text-fluent-text-p1 flex flex-col min-h-[500px] relative">
    
    <!-- Barra de Progresso Slim (Step Dots do Windows 11) -->
    <div class="flex items-center justify-between mb-6 px-1">
      <div class="flex-1 flex gap-1">
        <div 
          v-for="s in totalSteps" 
          :key="s"
          :class="[
            'h-1 rounded-full transition-all duration-350 ease-fluent-ease',
            s <= step 
              ? 'w-5 bg-fluent-accent' 
              : 'w-1 bg-black/10'
          ]"
        ></div>
      </div>
      <span class="text-[9px] font-bold text-fluent-accent px-2 tracking-wider uppercase">Passo {{ step }}/5</span>
    </div>

    <!-- Conteúdo do Passo Ativo -->
    <div class="flex-1 flex flex-col justify-center">
      
      <!-- Passo 1: Escolha do Fluxo/Canal de Pagamento -->
      <div v-if="step === 1" class="space-y-4">
        <h2 class="text-base font-bold text-fluent-text-p1 text-center tracking-tight leading-snug">Como você pagou ou fez o lançamento?</h2>
        <div class="flex flex-col gap-2">
          <!-- Pix / Dinheiro -->
          <button 
            @click="selecionarFluxo('expense', 'pix', null)"
            class="flex items-center gap-3 bg-white/40 hover:bg-white/80 border border-black/5 hover:border-fluent-accent/25 rounded-f-md p-3 text-left transition-all active:scale-[0.98] duration-200"
          >
            <span class="text-2xl">💵</span>
            <div>
              <strong class="block text-xs text-fluent-text-p1 font-bold">Fiz um PIX ou Dinheiro</strong>
              <span class="text-[9px] text-fluent-text-p2 block mt-0.5">Gasto à vista do caixa da casa</span>
            </div>
          </button>

          <!-- Cartões Dinâmicos -->
          <button 
            v-for="c in cartoes" 
            :key="c.id"
            @click="selecionarFluxo('expense', 'card', c.responsavelPadraoId)"
            class="flex items-center gap-3 bg-white/40 hover:bg-white/80 border border-black/5 hover:border-fluent-accent/25 rounded-f-md p-3 text-left transition-all active:scale-[0.98] duration-200"
          >
            <span class="text-2xl">💳</span>
            <div>
              <strong class="block text-xs text-fluent-text-p1 font-bold">Passei no {{ c.nome }}</strong>
              <span class="text-[9px] text-fluent-accent block mt-0.5 font-semibold">Despesa sob fatura de cartão</span>
            </div>
          </button>

          <!-- Empréstimo Pessoal -->
          <button 
            @click="selecionarFluxo('loan', 'pix', null)"
            class="flex items-center gap-3 bg-fluent-emerald-dim/40 hover:bg-fluent-emerald-dim/60 border border-fluent-emerald/10 hover:border-fluent-emerald/30 rounded-f-md p-3 text-left transition-all active:scale-[0.98] duration-200"
          >
            <span class="text-2xl">🤝</span>
            <div>
              <strong class="block text-xs text-fluent-text-p1 font-bold">Fiz um Empréstimo Pessoal</strong>
              <span class="text-[9px] text-fluent-emerald block mt-0.5 font-semibold">Dinheiro direto para outro morador</span>
            </div>
          </button>
        </div>
      </div>

      <!-- Passo 2: Quem pagou / Quem emprestou -->
      <div v-else-if="step === 2" class="space-y-5">
        <h2 class="text-base font-bold text-fluent-text-p1 text-center tracking-tight leading-snug">
          {{ wizFlow === 'loan' ? 'Quem está emprestando o dinheiro?' : 'Quem foi a pessoa que pagou?' }}
        </h2>
        <div class="grid grid-cols-3 gap-3">
          <button 
            v-for="m in props.membros" 
            :key="m.id" 
            @click="compradorSelecionadoId = m.id; next();"
            class="flex flex-col items-center gap-2 p-3 bg-white/40 hover:bg-white/80 border border-black/5 rounded-f-md transition-all duration-200"
          >
            <div class="w-10 h-10 bg-fluent-accent text-white rounded-full flex items-center justify-center font-bold text-base uppercase">
              {{ m.nome[0] }}
            </div>
            <span class="text-[10px] font-bold text-fluent-text-p2">{{ m.nome }}</span>
          </button>
        </div>
      </div>

      <!-- Passo 3 (LOAN): Selecionar o Tomador (Borrower) -->
      <div v-else-if="step === 3 && wizFlow === 'loan'" class="space-y-5">
        <h2 class="text-base font-bold text-fluent-text-p1 text-center tracking-tight leading-snug">Quem pegou o dinheiro emprestado?</h2>
        <div class="grid grid-cols-3 gap-3">
          <button 
            v-for="m in props.membros.filter(m => m.id !== compradorSelecionadoId)" 
            :key="m.id" 
            @click="borrowerId = m.id; next();"
            class="flex flex-col items-center gap-2 p-3 bg-white/40 hover:bg-white/80 border border-black/5 rounded-f-md transition-all duration-200"
          >
            <div class="w-10 h-10 bg-fluent-emerald text-white rounded-full flex items-center justify-center font-bold text-base uppercase">
              {{ m.nome[0] }}
            </div>
            <span class="text-[10px] font-bold text-fluent-text-p2">{{ m.nome }}</span>
          </button>
        </div>
      </div>

      <!-- Passo 3 (EXPENSE) ou Passo 4 (LOAN): Valor + Parcelas -->
      <div v-else-if="(step === 3 && wizFlow === 'expense') || (step === 4 && wizFlow === 'loan')" class="space-y-6">
        <h2 class="text-base font-bold text-fluent-text-p1 text-center tracking-tight">
          {{ wizFlow === 'loan' ? 'Qual o valor do empréstimo?' : 'Qual foi o valor total?' }}
        </h2>
        <div 
          class="bg-white/40 border rounded-f-md p-5 text-center transition-all duration-300"
          :class="[
            inputShake ? 'animate-shake' : '',
            showInputWarning && hasValorError ? 'border-fluent-rose/30 bg-fluent-rose-dim/20' : 'border-black/5'
          ]"
        >
          <div class="flex items-baseline justify-center gap-1.5 mb-4">
            <span class="text-fluent-text-p3 text-xl font-bold">R$</span>
            <input 
              v-model.number="valor"
              type="number"
              step="0.01"
              class="w-32 text-3xl font-bold text-fluent-text-p1 bg-transparent text-center focus:outline-none border-b-2 border-dashed border-black/10"
              :class="showInputWarning && hasValorError ? 'border-fluent-rose/30 text-fluent-rose' : 'focus:border-fluent-accent'"
              placeholder="0,00"
              autofocus
            />
          </div>
          
          <div v-if="showInputWarning && hasValorError" class="text-[10px] text-fluent-rose font-bold mb-3 flex items-center justify-center gap-1">
            ⚠️ Informe um valor maior que zero
          </div>

          <!-- Parcelamento -->
          <div v-if="wizFlow === 'loan' || wizPayment === 'card'" class="border-t border-black/5 pt-4 mt-1">
            <span class="block text-[10px] font-bold text-fluent-text-p3 uppercase tracking-wider mb-2.5">
              {{ wizFlow === 'loan' ? '🤝 Parcelar devolução?' : '📋 Parcelar no cartão?' }}
            </span>
            <div class="flex items-center justify-center gap-3">
              <button 
                type="button" 
                @click="ajustarParcelas(-1)" 
                class="w-8 h-8 rounded-f-sm border border-black/10 font-bold bg-white text-fluent-text-p1 hover:bg-gray-50 transition-colors"
              >-</button>
              <input 
                v-model.number="installments" 
                type="number"
                min="1"
                class="w-12 text-center font-bold border border-black/10 rounded-f-sm py-1 text-sm bg-white text-fluent-text-p1 focus:outline-none focus:border-fluent-accent"
              />
              <button 
                type="button" 
                @click="ajustarParcelas(1)" 
                class="w-8 h-8 rounded-f-sm border border-black/10 font-bold bg-white text-fluent-text-p1 hover:bg-gray-50 transition-colors"
              >+</button>
            </div>
            <span class="block text-[10px] text-fluent-accent mt-3 font-bold">
              {{ infoParcelamento }}
            </span>
          </div>
        </div>
      </div>

      <!-- Passo 4 (EXPENSE) ou Passo 5 (LOAN): Nome da Despesa -->
      <div v-else-if="(step === 4 && wizFlow === 'expense') || (step === 5 && wizFlow === 'loan')" class="space-y-5">
        <h2 class="text-base font-bold text-fluent-text-p1 text-center tracking-tight leading-snug">
          {{ wizFlow === 'loan' ? 'Escreva um lembrete' : 'Qual a descrição da despesa?' }}
        </h2>
        <div class="space-y-4">
          <input 
            v-model="descricao"
            type="text"
            :placeholder="wizFlow === 'loan' ? 'Ex: Pagar luz dele...' : 'Ex: Supermercado...'"
            class="w-full p-3 fluent-input text-center text-sm font-bold"
            autofocus
          />

          <!-- Quick Sugestions -->
          <div class="flex justify-center gap-1.5 flex-wrap max-w-xs mx-auto">
            <button 
              v-for="chip in quickChips" 
              :key="chip"
              type="button"
              @click="selecionarChip(chip)"
              class="text-[10px] font-bold bg-white/40 hover:bg-white/80 text-fluent-text-p2 py-1.5 px-3 rounded-f-sm transition-all border border-black/5"
            >
              {{ chip }}
            </button>
          </div>
        </div>
      </div>

      <!-- Passo 5 (EXPENSE): Divisão Rateio -->
      <div v-else-if="step === 5 && wizFlow === 'expense'" class="space-y-5">
        <h2 class="text-base font-bold text-fluent-text-p1 text-center tracking-tight">Com quem dividir?</h2>
        
        <div class="flex justify-center gap-4 mb-1">
          <button type="button" @click="dividirComTodos" class="text-[10px] font-bold text-fluent-accent underline">👥 Todos</button>
          <button type="button" @click="dividirApenasEu" class="text-[10px] font-bold text-fluent-rose underline">👤 Apenas Eu</button>
        </div>

        <div class="grid grid-cols-3 gap-2">
          <button 
            v-for="m in props.membros" 
            :key="m.id" 
            @click="toggleSplitMember(m.id)"
            class="relative flex flex-col items-center gap-2 p-3 border rounded-f-md transition-all"
            :class="[participantesDivisao.includes(m.id) ? 'border-fluent-accent/40 bg-fluent-tint-blue' : 'border-black/5 bg-white/20']"
          >
            <div class="w-8 h-8 bg-fluent-accent text-white rounded-full flex items-center justify-center font-bold text-xs">
              {{ m.nome[0] }}
            </div>
            <span class="text-[9px] font-bold text-fluent-text-p2">{{ m.nome }}</span>
            <span class="absolute top-1 right-1 text-[10px]">
              {{ participantesDivisao.includes(m.id) ? '✓' : '' }}
            </span>
          </button>
        </div>

        <div class="bg-fluent-tint-blue border border-fluent-accent/10 rounded-f-sm p-3 text-[9px] font-medium text-fluent-text-p2 leading-normal">
          {{ cognitiveSummary }}
        </div>

        <div class="bg-fluent-emerald-dim/40 border border-fluent-emerald/15 rounded-f-sm p-3 flex items-center gap-3 shadow-sm">
          <span class="text-2xl">📊</span>
          <div class="text-left leading-snug">
            <strong class="block text-fluent-emerald text-[11px] font-bold">{{ splitSummaryTitle }}</strong>
            <span class="text-[10px] text-fluent-emerald font-semibold">{{ splitSummaryDesc }}</span>
          </div>
        </div>
      </div>

    </div>

    <!-- Rodapé de Ações Clássico do Windows (Botão Primário no Lado Direito) -->
    <div class="border-t border-black/5 pt-4 mt-6 flex justify-end gap-2.5">
      <button 
        type="button" 
        @click="step === 1 ? emit('cancelar') : prev()"
        class="px-4 py-2 bg-white/60 hover:bg-white text-fluent-text-p1 border border-black/10 text-xs font-semibold rounded-f-sm transition-all shadow-sm flex-1"
      >
        {{ step === 1 ? 'Cancelar' : 'Voltar' }}
      </button>

      <button 
        type="button" 
        :disabled="!canAdvance && !isValorStep"
        @click="((wizFlow === 'loan' && step === 5) || (wizFlow === 'expense' && step === 5)) ? handleGravar() : handleNext()"
        class="px-4 py-2 bg-fluent-accent hover:bg-fluent-accent-hover text-white text-xs font-semibold rounded-f-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm flex-1"
      >
        {{ ((wizFlow === 'loan' && step === 5) || (wizFlow === 'expense' && step === 5)) ? 'Confirmar' : 'Avançar' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.animate-shake {
  animation: shake 0.5s ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-6px); }
  20%, 40%, 60%, 80% { transform: translateX(6px); }
}
</style>
