<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useCartoesEFaturas } from '../../viewmodels/useCartoesEFaturas'
import { obterPeriodoSelecionado } from '../../shared/utils/periodoStorage'
import { DivisaoDeGasto } from '../../models/entities/DivisaoDeGasto'
import { Dinheiro } from '../../models/entities/Dinheiro'
import { gastoService } from '../../shared/container'
import Button from '../components/ui/Button.vue'
import { useToast } from '../../composables/useToast'
import { mensagemErro } from '../../shared/utils/mensagemErro'
import { CreditCard } from 'lucide-vue-next'
import { calcularRateioProporcionalCentavos, obterMembrosSelecionadosSemRenda } from '../../shared/utils/rateio'

// Componentes de Etapa
import StepFlowSelection from '../components/wizard/StepFlowSelection.vue'
import StepMemberSelection from '../components/wizard/StepMemberSelection.vue'
import StepValueInput from '../components/wizard/StepValueInput.vue'
import StepDescriptionInput from '../components/wizard/StepDescriptionInput.vue'
import StepSplitSelector from '../components/wizard/StepSplitSelector.vue'

interface Props {
  membros: { id: string; nome: string; rendaCentavos?: number }[]
}

const props = defineProps<Props>()
const emit = defineEmits(['salvar', 'cancelar'])

const { cartoes, faturasFechadas, inicializar: inicializarCartoes } = useCartoesEFaturas()
const toast = useToast()

const isSubmitting = ref(false)

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
const isPrivate = ref(false)
const splitType = ref<'equal' | 'proportional'>('equal')

const membrosSelecionadosSemRenda = computed(() =>
  obterMembrosSelecionadosSemRenda(props.membros, participantesDivisao.value)
)

const proporcionalDisponivel = computed(() => membrosSelecionadosSemRenda.value.length === 0)

const canAdvance = computed(() => {
  switch (currentState.value) {
    case 'BUYER_SELECTION':
    case 'LENDER_SELECTION': return !!compradorSelecionadoId.value
    case 'BORROWER_SELECTION': return !!borrowerId.value
    case 'VALUE': return valor.value > 0
    case 'DESCRIPTION': return descricao.value.trim().length > 0
    case 'SPLIT': return participantesDivisao.value.length > 0 && (splitType.value !== 'proportional' || proporcionalDisponivel.value)
    default: return true
  }
})

const selecionarFluxo = ({ flow, payment, cardOwner }: any) => {
  wizFlow.value = flow
  wizPayment.value = payment
  wizCardOwner.value = cardOwner
  next()
}

const handleGravar = async () => {
  isSubmitting.value = true
  try {
    const dValor = Dinheiro.deReais(Number(valor.value))
    let divisoes: DivisaoDeGasto[] = []
    
    if (wizFlow.value === 'loan') {
      divisoes = [new DivisaoDeGasto(borrowerId.value!, dValor)]
    } else if (splitType.value === 'proportional') {
      if (!proporcionalDisponivel.value) {
        toast.show('Informe a renda de todos os participantes ou escolha a divisão igual.', 'error')
        return
      }

      const participantesComRenda = participantesDivisao.value.map(id => {
        const m = props.membros.find(memb => memb.id === id)
        const renda = Number(m!.rendaCentavos)
        return { id, renda }
      })

      const valoresDivisoes = calcularRateioProporcionalCentavos(
        dValor.centavos,
        participantesComRenda.map(participante => ({
          id: participante.id,
          rendaCentavos: participante.renda,
        })),
      )

      divisoes = participantesDivisao.value.map(id => new DivisaoDeGasto(id, Dinheiro.deCentavos(valoresDivisoes[id])))
    } else {
      divisoes = participantesDivisao.value.map((id, i) => new DivisaoDeGasto(id, dValor.valorNoIndice(participantesDivisao.value.length, i)))
    }

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
      periodo: obterPeriodoSelecionado(),
      isPrivate: isPrivate.value,
      splitMode: wizFlow.value === 'loan' ? 'custom' : splitType.value === 'proportional' ? 'income' : 'equal'
    })
    emit('salvar')
  } catch (error: unknown) {
    console.error('Erro ao salvar lançamento:', error)
    toast.show(mensagemErro(error, 'Não foi possível salvar o lançamento.'), 'error')
  } finally {
    isSubmitting.value = false
  }
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
          <p class="inline-flex text-xs font-bold text-graphite bg-stone rounded-full px-2.5 py-1 uppercase tracking-wider">
            Passo {{ stepIndex + 1 }} de {{ steps.length }}
          </p>
          <h2 class="mt-3 text-3xl font-display text-charcoal leading-tight tracking-tight">
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

      <div v-if="currentState === 'BUYER_SELECTION' && wizPayment === 'card'" class="mt-4 p-3 rounded-xl bg-sky/10 border border-sky/20 flex gap-3 items-center animate-in fade-in slide-in-from-top-1">
        <CreditCard class="w-4 h-4 text-sky shrink-0" aria-hidden="true" />
        <p class="text-[11px] font-semibold text-sky leading-tight">
          O crédito de reembolso será atribuído ao dono do cartão: 
          <strong>
            {{ props.membros.find(m => m.id === cartoes.find(c => c.id === wizCardOwner)!.responsavelPadraoId)!.nome }}
          </strong>
        </p>
      </div>

      <div 
        class="mt-4 h-1.5 rounded-full bg-stone overflow-hidden"
        role="progressbar"
        :aria-valuenow="progress"
        aria-valuemin="0"
        aria-valuemax="100"
        :aria-label="`Progresso do lançamento: ${Math.round(progress)}%`"
      >
        <div
          class="h-full rounded-full bg-midnight transition-all duration-500 ease-spring"
          :style="{ width: `${progress}%` }"
        />
      </div>
    </header>

    <div class="flex-1 p-5 sm:p-6 bg-white overflow-y-auto custom-scrollbar">
      <div :key="currentState" class="w-full">
        <StepFlowSelection
          v-if="currentState === 'FLOW_SELECTION'"
          :cartoes="cartoes"
          :is-cartao-trancado="isCartaoTrancado"
          :wiz-flow="wizFlow"
          :wiz-payment="wizPayment"
          :wiz-card-owner="wizCardOwner"
          @select="selecionarFluxo"
        />

        <StepMemberSelection
          v-else-if="currentState === 'BUYER_SELECTION' || currentState === 'LENDER_SELECTION'"
          :membros="props.membros"
          :current-state="currentState"
          :selected-id="compradorSelecionadoId"
          @select="(id) => { compradorSelecionadoId = id; next() }"
        />

        <StepMemberSelection
          v-else-if="currentState === 'BORROWER_SELECTION'"
          :membros="props.membros"
          :current-state="currentState"
          :selected-id="borrowerId"
          :comprador-selecionado-id="compradorSelecionadoId"
          @select="(id) => { borrowerId = id; next() }"
        />

        <StepValueInput
          v-else-if="currentState === 'VALUE'"
          v-model:valor="valor"
          v-model:installments="installments"
          :wiz-flow="wizFlow"
          :wiz-payment="wizPayment"
        />

        <div v-else-if="currentState === 'DESCRIPTION'" class="space-y-6 animate-in fade-in duration-300">
          <StepDescriptionInput
            v-model:descricao="descricao"
            :wiz-flow="wizFlow"
          />
          <div class="flex items-center justify-between p-3.5 bg-stone/20 border border-stone/60 rounded-2xl transition-all duration-300">
            <div class="space-y-0.5 text-left">
              <span class="text-xs font-bold text-charcoal block">Gasto Privado</span>
              <p class="text-[10px] text-graphite font-medium leading-normal max-w-[320px]">
                Oculta somente a descrição para moradores não autorizados. Valor e impacto no saldo continuam compartilhados; o dono do cartão vê a descrição para conciliar a fatura.
              </p>
            </div>
            <button 
              type="button"
              @click="isPrivate = !isPrivate" 
              class="w-11 h-6 rounded-full p-0.5 border-none cursor-pointer transition-colors shrink-0" 
              :class="isPrivate ? 'bg-meadow' : 'bg-stone'"
            >
              <div class="bg-white w-5 h-5 rounded-full shadow-subtle transform transition-transform" :class="isPrivate ? 'translate-x-5' : 'translate-x-0'" />
            </button>
          </div>
        </div>

        <StepSplitSelector
          v-else-if="currentState === 'SPLIT'"
          v-model:participantes-divisao="participantesDivisao"
          v-model:splitType="splitType"
          :membros="props.membros"
          :comprador-selecionado-id="compradorSelecionadoId"
          :valor-total="Number(valor)"
        />
      </div>
    </div>

    <footer class="p-5 sm:p-6 border-t border-stone bg-white flex gap-3">
      <Button
        variant="secondary"
        class="flex-1"
        :disabled="isSubmitting"
        @click="stepIndex === 0 ? emit('cancelar') : prev()"
      >
        {{ stepIndex === 0 ? 'Cancelar' : 'Voltar' }}
      </Button>
      <Button
        class="flex-[2]"
        :disabled="!canAdvance || isSubmitting"
        :loading="isSubmitting"
        @click="stepIndex === steps.length - 1 ? handleGravar() : next()"
      >
        {{ stepIndex === steps.length - 1 ? 'Confirmar' : 'Avançar' }}
      </Button>
    </footer>
  </div>
</template>

