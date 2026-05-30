<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useCartoesEFaturas } from '../../viewmodels/useCartoesEFaturas'
import { obterPeriodoSelecionado } from '../../shared/utils/periodoStorage'
import { DivisaoDeGasto } from '../../models/entities/DivisaoDeGasto'
import { Dinheiro } from '../../models/entities/Dinheiro'
import { gastoService } from '../../shared/container'
import {
  Wallet,
  CreditCard,
  Handshake,
  Plus,
  Minus,
  Check
} from 'lucide-vue-next'

interface Props {
  membros: { id: string; nome: string }[]
}

const props = defineProps<Props>()
const emit = defineEmits(['salvar', 'cancelar'])

const { cartoes, faturasFechadas, inicializar: inicializarCartoes } = useCartoesEFaturas()

onMounted(async () => {
  await inicializarCartoes()
})

const isCartaoTrancado = (cartaoId: string) => {
  const p = obterPeriodoSelecionado()
  return faturasFechadas.value.some(f =>
    f.cartaoId === cartaoId &&
    f.periodo.mes === p.mes &&
    f.periodo.ano === p.ano
  )
}

type WizardState = 'FLOW_SELECTION' | 'LENDER_SELECTION' | 'BORROWER_SELECTION' | 'BUYER_SELECTION' | 'VALUE' | 'DESCRIPTION' | 'SPLIT'

const wizFlow = ref<'expense' | 'loan' | null>(null)
const wizPayment = ref<'pix' | 'card' | null>(null)
const wizCardOwner = ref<string | null>(null)

const steps = computed<WizardState[]>(() => {
  if (!wizFlow.value) return ['FLOW_SELECTION']
  if (wizFlow.value === 'loan') return ['FLOW_SELECTION', 'LENDER_SELECTION', 'BORROWER_SELECTION', 'VALUE', 'DESCRIPTION']
  return ['FLOW_SELECTION', 'BUYER_SELECTION', 'VALUE', 'DESCRIPTION', 'SPLIT']
})

const stepIndex = ref(0)
const currentState = computed(() => steps.value[stepIndex.value])
const progress = computed(() => ((stepIndex.value + 1) / steps.value.length) * 100)

const next = () => stepIndex.value++
const prev = () => stepIndex.value--

const valor = ref(0)
const descricao = ref('')
const compradorSelecionadoId = ref('')
const borrowerId = ref<string | null>(null)
const installments = ref(1)
const participantesDivisao = ref<string[]>(props.membros.map(m => m.id))

const canAdvance = computed(() => {
  switch (currentState.value) {
    case 'BUYER_SELECTION':
    case 'LENDER_SELECTION': return !!compradorSelecionadoId.value
    case 'BORROWER_SELECTION': return !!borrowerId.value
    case 'VALUE': return valor.value > 0
    case 'DESCRIPTION': return descricao.value.trim().length > 0
    case 'SPLIT': return participantesDivisao.value.length > 0
    default: return true
  }
})

const quickChips = computed(() => wizFlow.value === 'loan' 
  ? ['Empréstimo', 'Luz dele', 'Uber compartilhado', 'Supermercado']
  : ['Mercado', 'Ifood', 'Luz', 'Internet', 'Água', 'Limpeza']
)

const selecionarFluxo = (flow: 'expense' | 'loan', payment: 'pix' | 'card', cardOwner: string | null) => {
  wizFlow.value = flow
  wizPayment.value = payment
  wizCardOwner.value = cardOwner
  next()
}

const infoParcelamento = computed(() => {
  if (installments.value <= 1) return 'À vista'
  const parcela = (Number(valor.value) / installments.value).toFixed(2).replace('.', ',')
  return `${installments.value}x de R$ ${parcela}`
})

const toggleSplitMember = (id: string) => {
  const idx = participantesDivisao.value.indexOf(id)
  if (idx >= 0) participantesDivisao.value.splice(idx, 1)
  else participantesDivisao.value.push(id)
}

const handleGravar = async () => {
  const dValor = Dinheiro.deReais(Number(valor.value))
  const divisoes = wizFlow.value === 'loan' 
    ? [new DivisaoDeGasto(borrowerId.value!, dValor)]
    : participantesDivisao.value.map((id, i) => new DivisaoDeGasto(id, dValor.distribuir(participantesDivisao.value.length)[i]))

  await gastoService.lancarGastoOuEmprestimo({
    flow: wizFlow.value!,
    paymentMethod: wizPayment.value!,
    compradorId: compradorSelecionadoId.value,
    valor: Number(valor.value),
    descricao: descricao.value,
    divisoes,
    installments: installments.value,
    cardOwnerId: wizCardOwner.value,
    borrowerId: borrowerId.value,
    periodo: obterPeriodoSelecionado()
  })
  emit('salvar')
}
</script>

<template>
  <div
    data-testid="novo-lancamento-wizard"
    class="wizard-family flex flex-col overflow-hidden h-full text-graphite"
  >
    <header class="p-5 sm:p-6 border-b border-stone flex-shrink-0">
      <div class="flex items-start justify-between gap-4 mb-4">
        <div class="min-w-0">
          <p class="inline-flex text-xs font-semibold text-ash bg-stone rounded-full px-2.5 py-1">
            Passo {{ stepIndex + 1 }} de {{ steps.length }}
          </p>
          <h2 class="mt-3 text-[23px] leading-[1.2] font-semibold text-charcoal tracking-[-0.44px]">
            <template v-if="currentState === 'FLOW_SELECTION'">Como você pagou?</template>
            <template v-else-if="currentState === 'LENDER_SELECTION'">Quem está emprestando?</template>
            <template v-else-if="currentState === 'BUYER_SELECTION'">{{ wizPayment === 'card' ? 'Quem usou o cartão?' : 'Quem foi que pagou?' }}</template>
            <template v-else-if="currentState === 'BORROWER_SELECTION'">Quem pegou emprestado?</template>
            <template v-else-if="currentState === 'VALUE'">Qual foi o valor total?</template>
            <template v-else-if="currentState === 'DESCRIPTION'">Qual a descrição?</template>
            <template v-else-if="currentState === 'SPLIT'">Com quem dividir?</template>
          </h2>
        </div>
      </div>

      <div v-if="currentState === 'BUYER_SELECTION' && wizPayment === 'card'" class="mt-4 p-3 rounded-xl bg-sky-500/5 border border-sky-500/10 flex gap-3 items-center animate-in fade-in slide-in-from-top-1">
        <CreditCard class="w-4 h-4 text-sky-600 shrink-0" />
        <p class="text-[11px] font-medium text-sky-700 leading-tight">
          O crédito de reembolso será atribuído ao dono do cartão: 
          <strong>
            {{ props.membros.find(m => m.id === cartoes.find(c => c.id === wizCardOwner)!.responsavelPadraoId)!.nome }}
          </strong>
        </p>
      </div>

      <div class="mt-4 h-1.5 rounded-full bg-stone overflow-hidden">
        <div
          class="h-full rounded-full bg-midnight transition-all duration-300"
          :style="{ width: `${progress}%` }"
        />
      </div>
    </header>

    <div class="flex-1 p-5 sm:p-6 bg-white overflow-y-auto custom-scrollbar">
      <div :key="currentState" class="w-full">
          <div v-if="currentState === 'FLOW_SELECTION'" class="grid gap-3">
            <button
              @click="selecionarFluxo('expense', 'pix', null)"
              class="group w-full flex items-center gap-3 p-4 rounded-card bg-parchment hover:bg-stone transition-colors text-left"
            >
              <div class="w-10 h-10 rounded-full bg-white shadow-subtle text-graphite flex items-center justify-center shrink-0">
                <Wallet class="w-5 h-5" />
              </div>
              <div class="min-w-0">
                <strong class="block text-[15px] font-semibold text-charcoal tracking-[-0.2px]">PIX ou Dinheiro</strong>
                <span class="text-xs text-ash">Gasto à vista do caixa</span>
              </div>
            </button>

            <button
              v-for="c in cartoes"
              :key="c.id"
              :disabled="isCartaoTrancado(c.id)"
              @click="selecionarFluxo('expense', 'card', c.id)"
              class="group w-full flex items-center gap-3 p-4 rounded-card bg-parchment hover:bg-stone transition-colors text-left disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <div class="w-10 h-10 rounded-full bg-white shadow-subtle text-graphite flex items-center justify-center shrink-0">
                <CreditCard class="w-5 h-5" />
              </div>
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2">
                  <strong class="text-[15px] font-semibold text-charcoal tracking-[-0.2px]">Cartão {{ c.nome }}</strong>
                  <span v-if="isCartaoTrancado(c.id)" class="text-[9px] font-bold text-coral bg-coral/10 px-2 py-0.5 rounded border border-coral/20 shrink-0">FATURA FECHADA</span>
                </div>
                <span class="text-xs text-ash">Despesa sob fatura</span>
              </div>
            </button>

            <button
              @click="selecionarFluxo('loan', 'pix', null)"
              class="group w-full flex items-center gap-3 p-4 rounded-card bg-parchment hover:bg-stone transition-colors text-left"
            >
              <div class="w-10 h-10 rounded-full bg-white shadow-subtle text-graphite flex items-center justify-center shrink-0">
                <Handshake class="w-5 h-5" />
              </div>
              <div class="min-w-0">
                <strong class="block text-[15px] font-semibold text-charcoal tracking-[-0.2px]">Empréstimo pessoal</strong>
                <span class="text-xs text-ash">Direto entre moradores</span>
              </div>
            </button>
          </div>

          <div v-else-if="currentState === 'BUYER_SELECTION' || currentState === 'LENDER_SELECTION' || currentState === 'BORROWER_SELECTION'" class="grid grid-cols-2 gap-3">
            <button
              v-for="m in (currentState === 'BORROWER_SELECTION' ? props.membros.filter(m => m.id !== compradorSelecionadoId) : props.membros)"
              :key="m.id"
              @click="currentState === 'BORROWER_SELECTION' ? (borrowerId = m.id, next()) : (compradorSelecionadoId = m.id, next())"
              class="flex flex-col items-center gap-3 p-4 rounded-card bg-parchment hover:bg-stone transition-colors"
            >
              <div class="w-12 h-12 rounded-full bg-white shadow-subtle flex items-center justify-center font-semibold text-charcoal">
                {{ m.nome[0] }}
              </div>
              <span class="font-semibold text-xs text-charcoal">{{ m.nome }}</span>
            </button>
          </div>

          <div v-else-if="currentState === 'VALUE'" class="space-y-5">
            <div class="rounded-card bg-parchment p-5 shadow-subtle transition-all duration-300">
              <label class="block text-xs font-semibold text-ash mb-2">Valor total</label>
              <div class="flex items-center gap-2">
                <span class="text-[23px] font-semibold text-charcoal tracking-[-0.44px]">R$</span>
                <input
                  v-model.number="valor"
                  type="number"
                  step="0.01"
                  min="0"
                  class="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none w-full bg-transparent outline-none text-[40px] leading-none font-semibold text-midnight tracking-[-1px] placeholder:text-smoke"
                  placeholder="0,00"
                  autofocus
                />
              </div>
            </div>

            <div v-if="wizFlow === 'loan' || wizPayment === 'card'" class="rounded-card bg-white shadow-subtle p-4 space-y-3">
              <label class="block text-xs font-semibold text-ash">Parcelamento</label>
              <div class="flex items-center justify-between gap-3">
                <button type="button" @click="installments = Math.max(1, installments - 1)" class="w-10 h-10 rounded-full bg-stone hover:bg-stone flex items-center justify-center">
                  <Minus class="w-4 h-4" />
                </button>
                <div class="text-center">
                  <span class="text-[23px] font-semibold text-charcoal tracking-[-0.44px]">{{ installments }}x</span>
                  <p class="text-xs text-ash">{{ infoParcelamento }}</p>
                </div>
                <button type="button" @click="installments = Math.max(1, installments + 1)" class="w-10 h-10 rounded-full bg-stone hover:bg-stone flex items-center justify-center">
                  <Plus class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div v-else-if="currentState === 'DESCRIPTION'" class="space-y-5">
            <div class="rounded-card bg-parchment p-4 shadow-subtle">
              <label class="block text-xs font-semibold text-ash mb-2">Descrição</label>
              <input
                v-model="descricao"
                type="text"
                class="w-full bg-transparent outline-none text-[23px] font-semibold text-charcoal tracking-[-0.44px] placeholder:text-smoke"
                placeholder="Descreva aqui..."
                autofocus
              />
            </div>
            <div class="flex gap-2 flex-wrap">
              <button
                v-for="chip in quickChips"
                :key="chip"
                @click="descricao = chip"
                class="px-3.5 py-2 rounded-full bg-stone hover:bg-stone text-xs font-semibold text-graphite transition-colors"
              >
                {{ chip }}
              </button>
            </div>
          </div>

          <div v-else-if="currentState === 'SPLIT'" class="space-y-4">
            <div class="flex gap-2">
              <button @click="participantesDivisao = props.membros.map(m => m.id)" class="px-3.5 py-2 rounded-full bg-midnight text-white text-xs font-semibold">Todos</button>
              <button @click="participantesDivisao = [compradorSelecionadoId]" class="px-3.5 py-2 rounded-full bg-stone text-midnight text-xs font-semibold">Apenas eu</button>
            </div>

            <div class="grid grid-cols-3 gap-2">
              <button
                v-for="m in props.membros"
                :key="m.id"
                @click="toggleSplitMember(m.id)"
                class="relative flex flex-col items-center gap-2 p-3 rounded-card transition-colors"
                :class="[participantesDivisao.includes(m.id) ? 'bg-white shadow-subtle' : 'bg-parchment']"
              >
                <div class="w-10 h-10 rounded-full flex items-center justify-center font-semibold" :class="[participantesDivisao.includes(m.id) ? 'bg-midnight text-white' : 'bg-white text-charcoal shadow-subtle']">
                  {{ m.nome[0] }}
                </div>
                <span class="text-[11px] font-semibold text-graphite truncate max-w-full">{{ m.nome }}</span>
                <Check v-if="participantesDivisao.includes(m.id)" class="absolute top-2 right-2 w-3.5 h-3.5 text-meadow" />
              </button>
            </div>
          </div>
        </div>
      </div>

    <footer class="p-5 sm:p-6 border-t border-stone bg-white flex gap-3">
      <button
        class="flex-1 h-12 rounded-full bg-stone hover:bg-stone text-midnight text-sm font-semibold transition-colors"
        @click="stepIndex === 0 ? emit('cancelar') : prev()"
      >
        {{ stepIndex === 0 ? 'Cancelar' : 'Voltar' }}
      </button>
      <button
        class="flex-[2] h-12 rounded-full bg-midnight hover:bg-charcoal text-white text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        :disabled="!canAdvance"
        @click="stepIndex === steps.length - 1 ? handleGravar() : next()"
      >
        {{ stepIndex === steps.length - 1 ? 'Confirmar' : 'Avançar' }}
      </button>
    </footer>
  </div>
</template>

<style scoped>

.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: var(--color-stone);
  border-radius: 9999px;
}
</style>
