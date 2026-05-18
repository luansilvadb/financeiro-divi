<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useNovoLancamentoWizard } from '../../modules/ledger/composables/useNovoLancamentoWizard'
import { useCartoesEFaturas } from '../../modules/ledger/composables/useCartoesEFaturas'
import {
  Wallet,
  CreditCard,
  Handshake,
  Plus,
  Minus,
  Check,
  Zap
} from 'lucide-vue-next'

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
  if (installments.value <= 1) return 'À vista'
  const valReais = Number(valor.value) || 0
  const parcela = (valReais / installments.value).toFixed(2).replace('.', ',')
  return `${installments.value}x de R$ ${parcela}`
})

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

const splitSummaryTitle = computed(() => {
  const count = participantesDivisao.value.length
  return `Rateio entre ${count} ${count === 1 ? 'pessoa' : 'pessoas'}`
})

const splitSummaryDesc = computed(() => {
  const count = participantesDivisao.value.length
  if (count === 0) return 'Selecione quem vai dividir'
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
  <div
    data-testid="novo-lancamento-wizard"
    class="wizard-family min-h-[600px] flex flex-col overflow-hidden bg-white rounded-[10px] shadow-[inset_0_0_0_1px_#f2f0ed] text-[#474645]"
  >
    <header class="p-5 sm:p-6 border-b border-[#f2f0ed] bg-white">
      <div class="flex items-start justify-between gap-4 mb-4">
        <div class="min-w-0">
          <p class="inline-flex text-xs font-semibold text-[#848281] bg-[#f6f4ef] rounded-full px-2.5 py-1">
            Passo {{ step }} de {{ totalSteps }}
          </p>
          <h2 class="mt-3 text-[23px] leading-[1.2] font-semibold text-[#343433] tracking-[-0.44px]">
            <template v-if="step === 1">Como você pagou?</template>
            <template v-else-if="step === 2">{{ wizFlow === 'loan' ? 'Quem está emprestando?' : 'Quem foi que pagou?' }}</template>
            <template v-else-if="step === 3 && wizFlow === 'loan'">Quem pegou emprestado?</template>
            <template v-else-if="isValorStep">Qual foi o valor total?</template>
            <template v-else-if="(step === 4 && wizFlow === 'expense') || (step === 5 && wizFlow === 'loan')">Qual a descrição?</template>
            <template v-else-if="step === 5 && wizFlow === 'expense'">Com quem dividir?</template>
          </h2>
        </div>
        <div class="w-10 h-10 rounded-full bg-[#f8f7f4] shadow-[inset_0_0_0_1px_#f2f0ed] flex items-center justify-center shrink-0">
          <Zap class="w-4 h-4 text-[#474645]" />
        </div>
      </div>

      <div class="h-1.5 rounded-full bg-[#f2f0ed] overflow-hidden">
        <div
          class="h-full rounded-full bg-[#121212] transition-all duration-300"
          :style="{ width: `${(step / totalSteps) * 100}%` }"
        />
      </div>
    </header>

    <div class="flex-1 p-5 sm:p-6 bg-white overflow-y-auto custom-scrollbar">
      <div :key="step" class="w-full">
          <div v-if="step === 1" class="grid gap-3">
            <button
              @click="selecionarFluxo('expense', 'pix', null)"
              class="group w-full flex items-center gap-3 p-4 rounded-[10px] bg-[#f8f7f4] hover:bg-[#f2f0ed] transition-colors text-left"
            >
              <div class="w-10 h-10 rounded-full bg-white shadow-[inset_0_0_0_1px_#f2f0ed] text-[#474645] flex items-center justify-center shrink-0">
                <Wallet class="w-5 h-5" />
              </div>
              <div class="min-w-0">
                <strong class="block text-[15px] font-semibold text-[#343433] tracking-[-0.2px]">PIX ou Dinheiro</strong>
                <span class="text-xs text-[#848281]">Gasto à vista do caixa</span>
              </div>
            </button>

            <button
              v-for="c in cartoes"
              :key="c.id"
              @click="selecionarFluxo('expense', 'card', c.responsavelPadraoId)"
              class="group w-full flex items-center gap-3 p-4 rounded-[10px] bg-[#f8f7f4] hover:bg-[#f2f0ed] transition-colors text-left"
            >
              <div class="w-10 h-10 rounded-full bg-white shadow-[inset_0_0_0_1px_#f2f0ed] text-[#474645] flex items-center justify-center shrink-0">
                <CreditCard class="w-5 h-5" />
              </div>
              <div class="min-w-0">
                <strong class="block text-[15px] font-semibold text-[#343433] tracking-[-0.2px]">Cartão {{ c.nome }}</strong>
                <span class="text-xs text-[#848281]">Despesa sob fatura</span>
              </div>
            </button>

            <button
              @click="selecionarFluxo('loan', 'pix', null)"
              class="group w-full flex items-center gap-3 p-4 rounded-[10px] bg-[#f8f7f4] hover:bg-[#f2f0ed] transition-colors text-left"
            >
              <div class="w-10 h-10 rounded-full bg-white shadow-[inset_0_0_0_1px_#f2f0ed] text-[#474645] flex items-center justify-center shrink-0">
                <Handshake class="w-5 h-5" />
              </div>
              <div class="min-w-0">
                <strong class="block text-[15px] font-semibold text-[#343433] tracking-[-0.2px]">Empréstimo pessoal</strong>
                <span class="text-xs text-[#848281]">Direto entre moradores</span>
              </div>
            </button>
          </div>

          <div v-else-if="step === 2 || (step === 3 && wizFlow === 'loan')" class="grid grid-cols-2 gap-3">
            <button
              v-for="m in (step === 3 ? props.membros.filter(m => m.id !== compradorSelecionadoId) : props.membros)"
              :key="m.id"
              @click="step === 2 ? (compradorSelecionadoId = m.id, next()) : (borrowerId = m.id, next())"
              class="flex flex-col items-center gap-3 p-4 rounded-[10px] bg-[#f8f7f4] hover:bg-[#f2f0ed] transition-colors"
            >
              <div class="w-12 h-12 rounded-full bg-white shadow-[inset_0_0_0_1px_#f2f0ed] flex items-center justify-center font-semibold text-[#343433]">
                {{ m.nome[0] }}
              </div>
              <span class="font-semibold text-xs text-[#343433]">{{ m.nome }}</span>
            </button>
          </div>

          <div v-else-if="isValorStep" class="space-y-5">
            <div
              class="rounded-[10px] bg-[#f8f7f4] p-5 shadow-[inset_0_0_0_1px_#f2f0ed] transition-all duration-300"
              :class="[inputShake && 'animate-shake']"
            >
              <label class="block text-xs font-semibold text-[#848281] mb-2">Valor total</label>
              <div class="flex items-center gap-2">
                <span class="text-[23px] font-semibold text-[#343433] tracking-[-0.44px]">R$</span>
                <input
                  v-model.number="valor"
                  type="number"
                  step="0.01"
                  class="w-full bg-transparent outline-none text-[40px] leading-none font-semibold text-[#121212] tracking-[-1px] placeholder:text-[#a7a7a7]"
                  placeholder="0,00"
                  autofocus
                />
              </div>
              <p v-if="showInputWarning && hasValorError" class="text-xs text-[#ff2b3a] font-semibold mt-3">
                Valor inválido
              </p>
            </div>

            <div v-if="wizFlow === 'loan' || wizPayment === 'card'" class="rounded-[10px] bg-white shadow-[inset_0_0_0_1px_#f2f0ed] p-4 space-y-3">
              <label class="block text-xs font-semibold text-[#848281]">Parcelamento</label>
              <div class="flex items-center justify-between gap-3">
                <button type="button" @click="ajustarParcelas(-1)" class="w-10 h-10 rounded-full bg-[#f6f4ef] hover:bg-[#f2f0ed] flex items-center justify-center">
                  <Minus class="w-4 h-4" />
                </button>
                <div class="text-center">
                  <span class="text-[23px] font-semibold text-[#343433] tracking-[-0.44px]">{{ installments }}x</span>
                  <p class="text-xs text-[#848281]">{{ infoParcelamento }}</p>
                </div>
                <button type="button" @click="ajustarParcelas(1)" class="w-10 h-10 rounded-full bg-[#f6f4ef] hover:bg-[#f2f0ed] flex items-center justify-center">
                  <Plus class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div v-else-if="(step === 4 && wizFlow === 'expense') || (step === 5 && wizFlow === 'loan')" class="space-y-5">
            <div class="rounded-[10px] bg-[#f8f7f4] p-4 shadow-[inset_0_0_0_1px_#f2f0ed]">
              <label class="block text-xs font-semibold text-[#848281] mb-2">Descrição</label>
              <input
                v-model="descricao"
                type="text"
                class="w-full bg-transparent outline-none text-[23px] font-semibold text-[#343433] tracking-[-0.44px] placeholder:text-[#a7a7a7]"
                placeholder="Descreva aqui..."
                autofocus
              />
            </div>
            <div class="flex gap-2 flex-wrap">
              <button
                v-for="chip in quickChips"
                :key="chip"
                @click="selecionarChip(chip)"
                class="px-3.5 py-2 rounded-full bg-[#f6f4ef] hover:bg-[#f2f0ed] text-xs font-semibold text-[#474645] transition-colors"
              >
                {{ chip }}
              </button>
            </div>
          </div>

          <div v-else-if="step === 5 && wizFlow === 'expense'" class="space-y-4">
            <div class="flex gap-2">
              <button @click="dividirComTodos" class="px-3.5 py-2 rounded-full bg-[#121212] text-white text-xs font-semibold">Todos</button>
              <button @click="dividirApenasEu" class="px-3.5 py-2 rounded-full bg-[#f6f4ef] text-[#121212] text-xs font-semibold">Apenas eu</button>
            </div>

            <div class="grid grid-cols-3 gap-2">
              <button
                v-for="m in props.membros"
                :key="m.id"
                @click="toggleSplitMember(m.id)"
                class="relative flex flex-col items-center gap-2 p-3 rounded-[10px] transition-colors"
                :class="[participantesDivisao.includes(m.id) ? 'bg-white shadow-[inset_0_0_0_1px_#f2f0ed]' : 'bg-[#f8f7f4]']"
              >
                <div class="w-10 h-10 rounded-full flex items-center justify-center font-semibold" :class="[participantesDivisao.includes(m.id) ? 'bg-[#121212] text-white' : 'bg-white text-[#343433] shadow-[inset_0_0_0_1px_#f2f0ed]']">
                  {{ m.nome[0] }}
                </div>
                <span class="text-[11px] font-semibold text-[#474645] truncate max-w-full">{{ m.nome }}</span>
                <Check v-if="participantesDivisao.includes(m.id)" class="absolute top-2 right-2 w-3.5 h-3.5 text-[#00ca48]" />
              </button>
            </div>

            <div class="p-5 rounded-xl bg-meadow/5 border border-meadow/20 flex gap-4 items-center">
              <!-- Mascote Ilustrado: Moedinha Feliz Meadow Green -->
              <svg viewBox="0 0 100 100" class="w-14 h-14 shrink-0 animate-bounce" style="animation-duration: 5s;">
                <circle cx="50" cy="50" r="40" fill="var(--color-meadow-green)" />
                <circle cx="50" cy="50" r="34" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="3" />
                <!-- Olhinhos Felizes -->
                <circle cx="40" cy="45" r="4.5" fill="#000" />
                <circle cx="60" cy="45" r="4.5" fill="#000" />
                <!-- Sorriso -->
                <path d="M42,56 Q50,64 58,56" stroke="#000" stroke-width="3.5" stroke-linecap="round" fill="none" />
                <!-- Brilho Estrela -->
                <path d="M78,22 L80,26 L85,27 L81,31 L82,36 L78,33 L74,36 L75,31 L71,27 L76,26 Z" fill="var(--color-sunburst-yellow)" />
              </svg>
              <div class="space-y-1 min-w-0">
                <p class="text-[10px] font-bold text-meadow uppercase tracking-widest">{{ splitSummaryTitle }}</p>
                <p class="text-xs font-semibold text-meadow leading-relaxed">{{ splitSummaryDesc }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

    <footer class="p-5 sm:p-6 border-t border-[#f2f0ed] bg-white flex gap-3">
      <button
        class="flex-1 h-12 rounded-full bg-[#f6f4ef] hover:bg-[#f2f0ed] text-[#121212] text-sm font-semibold transition-colors"
        @click="step === 1 ? emit('cancelar') : prev()"
      >
        {{ step === 1 ? 'Cancelar' : 'Voltar' }}
      </button>
      <button
        class="flex-[2] h-12 rounded-full bg-[#121212] hover:bg-[#343433] text-white text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        :disabled="!canAdvance && !isValorStep"
        @click="((wizFlow === 'loan' && step === 5) || (wizFlow === 'expense' && step === 5)) ? handleGravar() : handleNext()"
      >
        <template v-if="((wizFlow === 'loan' && step === 5) || (wizFlow === 'expense' && step === 5))">
          Confirmar
        </template>
        <template v-else>
          Avançar
        </template>
      </button>
    </footer>
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

.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #f2f0ed;
  border-radius: 9999px;
}
</style>
