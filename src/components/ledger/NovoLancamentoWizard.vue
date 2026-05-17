<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useNovoLancamentoWizard } from '../../modules/ledger/composables/useNovoLancamentoWizard'
import { useCartoesEFaturas } from '../../modules/ledger/composables/useCartoesEFaturas'
import Card from '../ui/Card.vue'
import Button from '../ui/Button.vue'
import SectionLabel from '../ui/SectionLabel.vue'
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
  if (installments.value <= 1) return 'À vista'
  const valReais = Number(valor.value) || 0
  const parcela = (valReais / installments.value).toFixed(2).replace('.', ',')
  return `${installments.value}x de R$ ${parcela}`
})

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

const splitSummaryTitle = computed(() => {
  const count = participantesDivisao.value.length
  return `Rateio entre ${count} ${count === 1 ? 'pessoa' : 'pessoas'}`
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
  <Card class="p-0 overflow-hidden relative min-h-[600px] flex flex-col bg-card shadow-subtle rounded-cards">
    <!-- Header / Progress -->
    <header class="p-8 border-b border-stone-surface bg-[#fbfaf9] relative z-10">
      <div class="flex justify-between items-center mb-6">
        <SectionLabel>Lançamento</SectionLabel>
        <div class="flex gap-1.5">
          <div 
            v-for="s in totalSteps" 
            :key="s"
            class="h-1 rounded-full transition-all duration-500"
            :class="[
              s === step ? 'w-8 bg-ember' : s < step ? 'w-4 bg-ember/40' : 'w-2 bg-stone-surface'
            ]"
          />
        </div>
      </div>
      
      <transition 
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="opacity-0 -translate-y-2"
        enter-to-class="opacity-100 translate-y-0"
        mode="out-in"
      >
        <h2 :key="step" class="text-3xl font-display text-charcoal leading-tight">
          <template v-if="step === 1">Como você <span class="text-ember">pagou?</span></template>
          <template v-else-if="step === 2">{{ wizFlow === 'loan' ? 'Quem está' : 'Quem foi que' }} <span class="text-ember">{{ wizFlow === 'loan' ? 'emprestando?' : 'pagou?' }}</span></template>
          <template v-else-if="step === 3 && wizFlow === 'loan'">Quem pegou <span class="text-ember">emprestado?</span></template>
          <template v-else-if="(step === 3 && wizFlow === 'expense') || (step === 4 && wizFlow === 'loan')">Qual foi o <span class="text-ember">valor total?</span></template>
          <template v-else-if="(step === 4 && wizFlow === 'expense') || (step === 5 && wizFlow === 'loan')">Qual a <span class="text-ember">descrição?</span></template>
          <template v-else-if="step === 5 && wizFlow === 'expense'">Com quem <span class="text-ember">dividir?</span></template>
        </h2>
      </transition>
    </header>

    <!-- Content -->
    <div class="flex-1 p-8 relative z-10 flex flex-col justify-center bg-card">
      <transition 
        enter-active-class="transition duration-500 delay-100 ease-out"
        enter-from-class="opacity-0 translate-y-4"
        enter-to-class="opacity-100 translate-y-0"
        mode="out-in"
      >
        <div :key="step" class="w-full">
          <!-- Passo 1: Escolha do Fluxo -->
          <div v-if="step === 1" class="space-y-3">
            <button 
              @click="selecionarFluxo('expense', 'pix', null)"
              class="group w-full flex items-center gap-4 p-5 rounded-xl border border-stone-surface bg-[#fbfaf9] hover:border-ember/30 hover:bg-white transition-all duration-300 text-left"
            >
              <div class="w-12 h-12 rounded-xl bg-ember/5 text-ember flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Wallet class="w-6 h-6" />
              </div>
              <div>
                <strong class="block text-base font-bold text-charcoal">PIX ou Dinheiro</strong>
                <span class="text-xs text-ash uppercase tracking-wider font-semibold">Gasto à vista do caixa</span>
              </div>
            </button>

            <button 
              v-for="c in cartoes" 
              :key="c.id"
              @click="selecionarFluxo('expense', 'card', c.responsavelPadraoId)"
              class="group w-full flex items-center gap-4 p-5 rounded-xl border border-stone-surface bg-[#fbfaf9] hover:border-ember/30 hover:bg-white transition-all duration-300 text-left"
            >
              <div class="w-12 h-12 rounded-xl bg-sky/5 text-sky flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <CreditCard class="w-6 h-6" />
              </div>
              <div>
                <strong class="block text-base font-bold text-charcoal">Cartão {{ c.nome }}</strong>
                <span class="text-xs text-sky uppercase tracking-wider font-bold">Despesa sob fatura</span>
              </div>
            </button>

            <button 
              @click="selecionarFluxo('loan', 'pix', null)"
              class="group w-full flex items-center gap-4 p-5 rounded-xl border border-stone-surface bg-[#fbfaf9] hover:border-ember/30 hover:bg-white transition-all duration-300 text-left"
            >
              <div class="w-12 h-12 rounded-xl bg-meadow/5 text-meadow flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Handshake class="w-6 h-6" />
              </div>
              <div>
                <strong class="block text-base font-bold text-charcoal">Empréstimo Pessoal</strong>
                <span class="text-xs text-ash uppercase tracking-wider font-semibold">Direto entre moradores</span>
              </div>
            </button>
          </div>

          <!-- Passo 2 & 3 (Membros) -->
          <div v-else-if="step === 2 || (step === 3 && wizFlow === 'loan')" class="grid grid-cols-2 gap-4">
            <button 
              v-for="m in (step === 3 ? props.membros.filter(m => m.id !== compradorSelecionadoId) : props.membros)" 
              :key="m.id" 
              @click="step === 2 ? (compradorSelecionadoId = m.id, next()) : (borrowerId = m.id, next())"
              class="group relative flex flex-col items-center gap-4 p-8 rounded-xl border border-stone-surface bg-[#fbfaf9] hover:border-ember/30 hover:bg-white transition-all duration-300"
            >
              <div class="w-16 h-16 rounded-full bg-stone flex items-center justify-center font-display text-2xl text-charcoal group-hover:bg-ember group-hover:text-white transition-all duration-300">
                {{ m.nome[0] }}
              </div>
              <span class="font-bold text-xs tracking-widest uppercase text-charcoal">{{ m.nome }}</span>
            </button>
          </div>

          <!-- Passo Valor -->
          <div v-else-if="isValorStep" class="space-y-10">
            <div 
              class="relative transition-all duration-300"
              :class="[inputShake && 'animate-shake']"
            >
              <div class="flex items-center justify-center gap-4">
                <span class="text-4xl font-display text-ash opacity-30">R$</span>
                <input 
                  v-model.number="valor"
                  type="number"
                  step="0.01"
                  class="w-full max-w-[200px] text-6xl font-display text-center bg-transparent outline-none text-charcoal border-b-4 border-stone focus:border-ember transition-colors"
                  placeholder="0,00"
                  autofocus
                />
              </div>
              <p v-if="showInputWarning && hasValorError" class="text-center text-coral-red font-bold text-xs mt-4 uppercase tracking-widest">
                ⚠️ Valor inválido
              </p>
            </div>

            <!-- Parcelamento -->
            <div v-if="wizFlow === 'loan' || wizPayment === 'card'" class="max-w-xs mx-auto p-6 rounded-xl bg-stone-surface/50 border border-stone-surface space-y-4">
              <label class="block text-[10px] font-bold uppercase text-ash tracking-widest text-center">Parcelamento</label>
              <div class="flex items-center justify-between">
                <Button variant="secondary" size="icon" @click="ajustarParcelas(-1)" class="rounded-full h-10 w-10 border border-stone-surface">
                  <Minus class="w-4 h-4 text-graphite" />
                </Button>
                <div class="text-center">
                  <span class="text-2xl font-display text-charcoal">{{ installments }}x</span>
                </div>
                <Button variant="secondary" size="icon" @click="ajustarParcelas(1)" class="rounded-full h-10 w-10 border border-stone-surface">
                  <Plus class="w-4 h-4 text-graphite" />
                </Button>
              </div>
              <p class="text-center text-[10px] text-ember font-bold uppercase tracking-widest">
                {{ infoParcelamento }}
              </p>
            </div>
          </div>

          <!-- Passo Descrição -->
          <div v-else-if="(step === 4 && wizFlow === 'expense') || (step === 5 && wizFlow === 'loan')" class="space-y-8">
            <input 
              v-model="descricao"
              type="text"
              class="w-full text-3xl font-display text-center bg-transparent border-b-2 border-stone focus:border-ember outline-none py-4 text-charcoal"
              placeholder="Descreva aqui..."
              autofocus
            />
            <div class="flex justify-center gap-2 flex-wrap">
              <button 
                v-for="chip in quickChips" 
                :key="chip"
                @click="selecionarChip(chip)"
                class="px-4 py-2 rounded-full border border-stone-surface bg-[#fbfaf9] hover:border-ember/30 hover:text-ember text-xs font-bold transition-all duration-200 text-charcoal"
              >
                {{ chip }}
              </button>
            </div>
          </div>

          <!-- Passo Divisão -->
          <div v-else-if="step === 5 && wizFlow === 'expense'" class="space-y-6">
            <div class="flex justify-center gap-6">
              <button @click="dividirComTodos" class="text-[10px] font-bold uppercase tracking-widest text-ember hover:underline">Todos</button>
              <button @click="dividirApenasEu" class="text-[10px] font-bold uppercase tracking-widest text-coral-red hover:underline">Apenas Eu</button>
            </div>

            <div class="grid grid-cols-3 gap-3">
              <button 
                v-for="m in props.membros" 
                :key="m.id" 
                @click="toggleSplitMember(m.id)"
                class="relative flex flex-col items-center gap-3 p-4 rounded-xl border transition-all duration-300"
                :class="[participantesDivisao.includes(m.id) ? 'border-ember bg-ember/5 text-ember' : 'border-stone-surface bg-[#fbfaf9] text-ash']"
              >
                <div class="w-10 h-10 rounded-full flex items-center justify-center font-display text-sm" :class="[participantesDivisao.includes(m.id) ? 'bg-ember text-white' : 'bg-stone']">
                  {{ m.nome[0] }}
                </div>
                <span class="text-[10px] font-bold uppercase tracking-wider">{{ m.nome }}</span>
                <div v-if="participantesDivisao.includes(m.id)" class="absolute top-1 right-1">
                  <Check class="w-3 h-3 text-ember" />
                </div>
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
      </transition>
    </div>

    <!-- Footer -->
    <footer class="p-8 border-t border-stone-surface bg-[#fbfaf9] relative z-10 flex gap-4">
      <Button 
        variant="secondary" 
        class="flex-1 h-14 rounded-full border border-stone-surface" 
        @click="step === 1 ? emit('cancelar') : prev()"
      >
        {{ step === 1 ? 'Cancelar' : 'Voltar' }}
      </Button>
      <Button 
        variant="primary" 
        class="flex-[2] h-14 rounded-full text-lg"
        :disabled="!canAdvance && !isValorStep"
        @click="((wizFlow === 'loan' && step === 5) || (wizFlow === 'expense' && step === 5)) ? handleGravar() : handleNext()"
      >
        <template v-if="((wizFlow === 'loan' && step === 5) || (wizFlow === 'expense' && step === 5))">
          Confirmar
          <Zap class="ml-2 w-5 h-5 fill-current" />
        </template>
        <template v-else>
          Avançar
        </template>
      </Button>
    </footer>
  </Card>
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
  background-color: var(--color-stone-surface);
  border-radius: 9999px;
}
</style>
