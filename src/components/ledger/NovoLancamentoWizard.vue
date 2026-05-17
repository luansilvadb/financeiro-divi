<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
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
  modoDivisaoWizard,
  valoresDivisaoWizard,
  canAdvance,
  next,
  prev,
  finalizarGastoOuEmprestimo,
  reset
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
  <div class="max-w-md mx-auto bg-white rounded-3xl border border-slate-100 shadow-xl p-6 text-slate-800 flex flex-col min-h-[500px]">
    
    <!-- Barra de Progresso Sênior Premium -->
    <div class="flex items-center justify-between mb-8">
      <div class="flex-1 flex gap-1.5 px-4">
        <div 
          v-for="s in totalSteps" 
          :key="s"
          :class="['h-2 flex-1 rounded-full transition-all duration-300', s <= step ? 'bg-indigo-600' : 'bg-slate-100']"
        ></div>
      </div>
      <span class="text-xs font-black text-indigo-600 px-3 tracking-widest uppercase">Passo {{ step }}/5</span>
    </div>

    <!-- Conteúdo do Passo Ativo -->
    <div class="flex-1 flex flex-col justify-center">
      
      <!-- Passo 1: Escolha do Fluxo/Canal de Pagamento -->
      <div v-if="step === 1" class="space-y-6">
        <h2 class="text-xl font-black text-slate-800 text-center tracking-tight leading-snug">Como você pagou ou fez o lançamento?</h2>
        <div class="flex flex-col gap-3.5">
          <!-- Pix / Dinheiro -->
          <button 
            @click="selecionarFluxo('expense', 'pix', null)"
            class="flex items-center gap-4 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 rounded-2xl p-4 text-left transition-all active:scale-[0.98]"
          >
            <span class="text-3xl">💵</span>
            <div>
              <strong class="block text-sm text-slate-800 font-extrabold">Fiz um PIX ou Dinheiro (Da Casa)</strong>
              <span class="text-xs text-slate-500 font-bold">Gasto imediato fora de faturas de cartões</span>
            </div>
          </button>

          <!-- Cartões Dinâmicos -->
          <button 
            v-for="c in cartoes" 
            :key="c.id"
            @click="selecionarFluxo('expense', 'card', c.responsavelPadraoId)"
            class="flex items-center gap-4 bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-100 rounded-2xl p-4 text-left transition-all active:scale-[0.98]"
          >
            <span class="text-3xl">💳</span>
            <div>
              <strong class="block text-sm text-slate-800 font-extrabold">Passei no {{ c.nome }}</strong>
              <span class="text-xs text-indigo-600 font-bold">Gasto registrado sob fatura de cartão</span>
            </div>
          </button>

          <!-- Empréstimo Pessoal -->
          <button 
            @click="selecionarFluxo('loan', 'pix', null)"
            class="flex items-center gap-4 bg-emerald-50/50 hover:bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-left transition-all active:scale-[0.98]"
          >
            <span class="text-3xl">🤝</span>
            <div>
              <strong class="block text-sm text-emerald-800 font-extrabold">Fiz um Empréstimo Pessoal</strong>
              <span class="text-xs text-emerald-600 font-bold">Dinheiro emprestado direto para outro morador</span>
            </div>
          </button>
        </div>
      </div>

      <!-- Passo 2: Quem pagou / Quem emprestou -->
      <div v-else-if="step === 2" class="space-y-6">
        <h2 class="text-xl font-black text-slate-800 text-center tracking-tight leading-snug">
          {{ wizFlow === 'loan' ? 'Quem está emprestando o dinheiro?' : 'Quem foi a pessoa que pagou?' }}
        </h2>
        <div class="grid grid-cols-3 gap-4">
          <button 
            v-for="m in props.membros" 
            :key="m.id" 
            @click="compradorSelecionadoId = m.id; next();"
            class="flex flex-col items-center gap-2 p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 rounded-2xl transition-all"
          >
            <div class="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center font-black text-lg">
              {{ m.nome[0] }}
            </div>
            <span class="text-xs font-extrabold text-slate-700">{{ m.nome }}</span>
          </button>
        </div>
      </div>

      <!-- Passo 3 (LOAN): Selecionar o Tomador (Borrower) -->
      <div v-else-if="step === 3 && wizFlow === 'loan'" class="space-y-6">
        <h2 class="text-xl font-black text-slate-800 text-center tracking-tight leading-snug">Quem pegou o dinheiro emprestado?</h2>
        <div class="grid grid-cols-3 gap-4">
          <!-- Exclui o Lender para evitar erros -->
          <button 
            v-for="m in props.membros.filter(m => m.id !== compradorSelecionadoId)" 
            :key="m.id" 
            @click="borrowerId = m.id; next();"
            class="flex flex-col items-center gap-2 p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 rounded-2xl transition-all"
          >
            <div class="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center font-black text-lg">
              {{ m.nome[0] }}
            </div>
            <span class="text-xs font-extrabold text-slate-700">{{ m.nome }}</span>
          </button>
        </div>
      </div>

      <!-- Passo 3 (EXPENSE) ou Passo 4 (LOAN): Valor + Parcelas -->
      <div v-else-if="(step === 3 && wizFlow === 'expense') || (step === 4 && wizFlow === 'loan')" class="space-y-8">
        <h2 class="text-xl font-black text-slate-800 text-center tracking-tight">
          {{ wizFlow === 'loan' ? 'Qual o valor total do empréstimo?' : 'Qual foi o valor total?' }}
        </h2>
        <div class="bg-slate-50 border-2 border-slate-200/60 rounded-3xl p-6 text-center shadow-inner">
          <div class="flex items-baseline justify-center gap-1.5 mb-5">
            <span class="text-slate-400 text-2xl font-black">R$</span>
            <input 
              v-model.number="valor"
              type="number"
              step="0.01"
              class="w-44 text-4xl font-black text-slate-800 bg-transparent text-center focus:outline-none focus:border-indigo-500 border-b-2 border-dashed border-slate-300"
              placeholder="0,00"
              autofocus
            />
          </div>

          <!-- Parcelamento Digitável -->
          <div v-if="wizFlow === 'loan' || wizPayment === 'card'" class="border-t border-slate-200 pt-5 mt-2">
            <span class="block text-xs font-black text-slate-500 uppercase tracking-wider mb-3">
              {{ wizFlow === 'loan' ? '🤝 Quer parcelar a devolução deste empréstimo?' : '📋 Quer parcelar esta compra no cartão?' }}
            </span>
            <div class="flex items-center justify-center gap-3.5">
              <button 
                type="button" 
                @click="ajustarParcelas(-1)" 
                class="w-10 h-10 rounded-full border border-slate-300 font-extrabold bg-white text-slate-700 hover:bg-slate-100 transition-colors shadow-sm"
              >-</button>
              <input 
                v-model.number="installments" 
                type="number"
                min="1"
                class="w-16 text-center font-black border-2 border-slate-300 rounded-xl py-1 text-base focus:outline-none focus:border-indigo-500"
              />
              <button 
                type="button" 
                @click="ajustarParcelas(1)" 
                class="w-10 h-10 rounded-full border border-slate-300 font-extrabold bg-white text-slate-700 hover:bg-slate-100 transition-colors shadow-sm"
              >+</button>
              <span class="text-xs text-slate-500 font-bold">meses / parcelas</span>
            </div>
            <!-- Feedback dinâmico das parcelas -->
            <span class="block text-xs text-indigo-600 mt-3.5 font-bold leading-normal">
              {{ infoParcelamento }}
            </span>
          </div>
        </div>
      </div>

      <!-- Passo 4 (EXPENSE) ou Passo 5 (LOAN): Nome da Despesa / Lembrete -->
      <div v-else-if="(step === 4 && wizFlow === 'expense') || (step === 5 && wizFlow === 'loan')" class="space-y-6">
        <h2 class="text-xl font-black text-slate-800 text-center tracking-tight leading-snug">
          {{ wizFlow === 'loan' ? 'Escreva um lembrete para este empréstimo' : 'Qual o nome/descrição desta despesa?' }}
        </h2>
        <div class="space-y-5">
          <input 
            v-model="descricao"
            type="text"
            :placeholder="wizFlow === 'loan' ? 'Ex: Pagar a conta de luz dele, Pix rápido...' : 'Ex: Supermercado, Almoço, Farmácia...'"
            class="w-full p-4 border-2 border-slate-200 rounded-2xl text-center text-base font-bold focus:outline-none focus:border-indigo-500 shadow-sm"
            autofocus
          />

          <!-- Quick Sugestions Chips -->
          <div class="flex justify-center gap-2 flex-wrap max-w-sm mx-auto">
            <button 
              v-for="chip in quickChips" 
              :key="chip"
              type="button"
              @click="selecionarChip(chip)"
              class="text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 px-3.5 rounded-full transition-colors active:scale-95"
            >
              {{ chip }}
            </button>
          </div>
        </div>
      </div>

      <!-- Passo 5 (EXPENSE): Divisão Rateio Coletivo -->
      <div v-else-if="step === 5 && wizFlow === 'expense'" class="space-y-6">
        <h2 class="text-xl font-black text-slate-800 text-center tracking-tight">Com quem quer dividir esta conta?</h2>
        
        <!-- Atalhos rápidos -->
        <div class="flex justify-center gap-5 mb-1.5">
          <button type="button" @click="dividirComTodos" class="text-xs font-black text-indigo-600 underline">👥 Dividir com Todos</button>
          <button type="button" @click="dividirApenasEu" class="text-xs font-black text-rose-600 underline">👤 Apenas Eu</button>
        </div>

        <div class="grid grid-cols-3 gap-3">
          <button 
            v-for="m in props.membros" 
            :key="m.id" 
            @click="toggleSplitMember(m.id)"
            class="relative flex flex-col items-center gap-2 p-3 border-2 rounded-2xl transition-all"
            :class="[participantesDivisao.includes(m.id) ? 'border-indigo-600 bg-indigo-50/10' : 'border-slate-200 bg-slate-50/50']"
          >
            <div class="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center font-black text-sm">
              {{ m.nome[0] }}
            </div>
            <span class="text-[10px] font-black text-slate-700">{{ m.nome }}</span>
            <span class="absolute top-1.5 right-1.5 text-xs">
              {{ participantesDivisao.includes(m.id) ? '✅' : '⬜' }}
            </span>
          </button>
        </div>

        <!-- Feedback cognitivo de segurança -->
        <div class="bg-indigo-50/40 border border-indigo-100 rounded-2xl p-4 text-[10px] font-medium text-indigo-700 leading-normal">
          {{ cognitiveSummary }}
        </div>

        <!-- Quadro final de rateio -->
        <div class="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex items-center gap-3.5 shadow-sm">
          <span class="text-3xl">📊</span>
          <div class="text-left leading-snug">
            <strong class="block text-emerald-800 text-xs font-black">{{ splitSummaryTitle }}</strong>
            <span class="text-[10px] text-emerald-600 font-extrabold">{{ splitSummaryDesc }}</span>
          </div>
        </div>
      </div>

    </div>

    <!-- Rodapé de Ações do Wizard (Navegação) -->
    <div class="border-t border-slate-100 pt-6 mt-6 flex justify-between gap-4">
      <button 
        type="button" 
        @click="step === 1 ? emit('cancelar') : prev()"
        class="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-sm py-4 rounded-2xl transition-all shadow-sm"
      >
        {{ step === 1 ? 'Cancelar' : 'Voltar' }}
      </button>

      <button 
        type="button" 
        :disabled="!canAdvance"
        @click="((wizFlow === 'loan' && step === 5) || (wizFlow === 'expense' && step === 5)) ? handleGravar() : next()"
        class="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm py-4 rounded-2xl transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-indigo-600/10"
      >
        {{ ((wizFlow === 'loan' && step === 5) || (wizFlow === 'expense' && step === 5)) ? 'Confirmar e Gravar' : 'Avançar' }}
      </button>
    </div>

  </div>
</template>
