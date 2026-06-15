<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useCartoesEFaturas } from '../../viewmodels/useCartoesEFaturas'
import { useMembros } from '../../viewmodels/useMembros'
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
import StepPaymentMethodSelection from '../components/wizard/StepPaymentMethodSelection.vue'
import StepMemberSelection from '../components/wizard/StepMemberSelection.vue'
import StepValueInput from '../components/wizard/StepValueInput.vue'
import StepDescriptionInput from '../components/wizard/StepDescriptionInput.vue'
import StepSplitSelector from '../components/wizard/StepSplitSelector.vue'

interface Props {
  membros: { id: string; nome: string; rendaCentavos?: number }[]
  isPrivate?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isPrivate: false
})

const emit = defineEmits(['salvar', 'cancelar'])

const { cartoes, faturasFechadas, inicializar: inicializarCartoes } = useCartoesEFaturas()
const { currentMembro } = useMembros()
const toast = useToast()

const isSubmitting = ref(false)

onMounted(async () => {
  if (props.isPrivate && currentMembro.value && !compradorSelecionadoId.value) {
    compradorSelecionadoId.value = currentMembro.value.id
  }
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

type WizardState = 'FLOW_SELECTION' | 'PAYMENT_METHOD_SELECTION' | 'LENDER_SELECTION' | 'BORROWER_SELECTION' | 'BUYER_SELECTION' | 'VALUE' | 'DESCRIPTION' | 'SPLIT'

const wizFlow = ref<'expense' | 'loan' | 'loan_given' | 'loan_taken' | null>(null)
const wizPayment = ref<'pix' | 'card' | null>(null)
const wizCardOwner = ref<string | null>(null)

const steps = computed<WizardState[]>(() => {
  const stepList: WizardState[] = ['FLOW_SELECTION']
  
  if (!wizFlow.value) return stepList
  
  if (wizFlow.value === 'expense') {
    stepList.push('PAYMENT_METHOD_SELECTION')
    if (wizPayment.value === 'pix' && !props.isPrivate) {
      stepList.push('BUYER_SELECTION')
    }
    stepList.push('VALUE', 'DESCRIPTION')
    if (!props.isPrivate) {
      stepList.push('SPLIT')
    }
  } else if (wizFlow.value === 'loan') {
    stepList.push('LENDER_SELECTION', 'BORROWER_SELECTION', 'VALUE', 'DESCRIPTION')
  } else if (wizFlow.value === 'loan_given') {
    stepList.push('BORROWER_SELECTION', 'VALUE', 'DESCRIPTION')
  } else if (wizFlow.value === 'loan_taken') {
    stepList.push('LENDER_SELECTION', 'VALUE', 'DESCRIPTION')
  }
  
  return stepList
})

const stepIndex = ref(0)
const currentState = computed(() => steps.value[stepIndex.value])
const progress = computed(() => ((stepIndex.value + 1) / steps.value.length) * 100)

const next = () => stepIndex.value++
const prev = () => stepIndex.value--

const valor = ref(0)
const descricao = ref('')
const compradorSelecionadoId = ref(props.isPrivate && currentMembro.value ? currentMembro.value.id : '')
const borrowerId = ref<string | null>(null)
const installments = ref(1)

const membrosLocais = ref([...props.membros])
const participantesDivisao = ref<string[]>(membrosLocais.value.map(m => m.id))
const splitType = ref<'equal' | 'proportional'>('equal')

const membrosSelecionadosSemRenda = computed(() =>
  obterMembrosSelecionadosSemRenda(membrosLocais.value, participantesDivisao.value)
)

const proporcionalDisponivel = computed(() => membrosSelecionadosSemRenda.value.length === 0)

const canAdvance = computed(() => {
  switch (currentState.value) {
    case 'PAYMENT_METHOD_SELECTION': return !!wizPayment.value
    case 'BUYER_SELECTION':
    case 'LENDER_SELECTION': return !!compradorSelecionadoId.value
    case 'BORROWER_SELECTION': return !!borrowerId.value
    case 'VALUE': return valor.value > 0
    case 'DESCRIPTION': return descricao.value.trim().length > 0
    case 'SPLIT': return participantesDivisao.value.length > 0 && (splitType.value !== 'proportional' || proporcionalDisponivel.value)
    default: return true
  }
})

const selecionarFluxo = (flow: 'expense' | 'loan' | 'loan_given' | 'loan_taken') => {
  wizFlow.value = flow
  
  if (flow !== 'expense') {
    wizPayment.value = 'pix'
    wizCardOwner.value = null
  } else {
    wizPayment.value = null
    wizCardOwner.value = null
  }
  
  next()
}

const selecionarMetodoPagamento = ({ payment, cardOwner }: { payment: 'pix' | 'card', cardOwner: string | null }) => {
  wizPayment.value = payment
  wizCardOwner.value = cardOwner
  next()
}

const handleAdicionarExterno = (nome: string) => {
  const idFicticio = `externo:${nome}`
  if (!membrosLocais.value.some(m => m.id === idFicticio)) {
    membrosLocais.value.push({
      id: idFicticio,
      nome: `${nome} (Externo)`
    })
  }
  if (currentState.value === 'BORROWER_SELECTION') {
    borrowerId.value = idFicticio
    next()
  } else if (currentState.value === 'BUYER_SELECTION' || currentState.value === 'LENDER_SELECTION') {
    compradorSelecionadoId.value = idFicticio
    next()
  } else if (currentState.value === 'SPLIT') {
    if (!participantesDivisao.value.includes(idFicticio)) {
      participantesDivisao.value.push(idFicticio)
    }
  }
}

const handleGravar = async () => {
  isSubmitting.value = true
  try {
    const dValor = Dinheiro.deReais(Number(valor.value))
    let divisoes: DivisaoDeGasto[] = []
    
    const backendFlow = (wizFlow.value === 'loan_given' || wizFlow.value === 'loan_taken') ? 'loan' : wizFlow.value!
    const isLoanLike = backendFlow === 'loan'

    if (isLoanLike) {
      const finalBorrower = wizFlow.value === 'loan_taken' ? currentMembro.value!.id : borrowerId.value!
      divisoes = [new DivisaoDeGasto(finalBorrower, dValor)]
    } else if (splitType.value === 'proportional') {
      if (!proporcionalDisponivel.value) {
        toast.show('Informe a renda de todos os participantes ou escolha a divisão igual.', 'error')
        return
      }

      const participantesComRenda = participantesDivisao.value.map(id => {
        const m = membrosLocais.value.find(memb => memb.id === id)
        const renda = Number(m!.rendaCentavos || 0)
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
    } else if (props.isPrivate) {
      divisoes = [new DivisaoDeGasto(currentMembro.value!.id, dValor)]
    } else {
      divisoes = participantesDivisao.value.map((id, i) => new DivisaoDeGasto(id, dValor.valorNoIndice(participantesDivisao.value.length, i)))
    }

    const finalCompradorId = wizFlow.value === 'loan_given' ? currentMembro.value!.id :
                             (props.isPrivate && wizFlow.value === 'expense') ? currentMembro.value!.id :
                             (wizPayment.value === 'card' && wizCardOwner.value) ? cartoes.value.find(c => c.id === wizCardOwner.value)!.responsavelPadraoId :
                             compradorSelecionadoId.value

    const finalBorrowerId = wizFlow.value === 'loan_taken' ? currentMembro.value!.id : borrowerId.value

    await gastoService.lancarGastoOuEmprestimo({
      flow: backendFlow,
      paymentMethod: wizPayment.value!,
      compradorId: finalCompradorId,
      valor: Number(valor.value),
      descricao: descricao.value,
      divisoes,
      installments: installments.value,
      cardOwnerId: wizCardOwner.value,
      borrowerId: finalBorrowerId,
      periodo: obterPeriodoSelecionado(),
      isPrivate: props.isPrivate,
      splitMode: isLoanLike ? 'custom' : (props.isPrivate ? 'custom' : (splitType.value === 'proportional' ? 'income' : 'equal'))
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
            <template v-if="currentState === 'FLOW_SELECTION'">O que deseja fazer?</template>
            <template v-else-if="currentState === 'PAYMENT_METHOD_SELECTION'">Como você pagou?</template>
            <template v-else-if="currentState === 'LENDER_SELECTION'">{{ wizFlow === 'loan_taken' ? 'Para quem você deve?' : 'Quem está emprestando?' }}</template>
            <template v-else-if="currentState === 'BUYER_SELECTION'">{{ wizPayment === 'card' ? 'Quem usou o cartão?' : 'Quem foi que pagou?' }}</template>
            <template v-else-if="currentState === 'BORROWER_SELECTION'">{{ wizFlow === 'loan_given' ? 'Quem está te devendo?' : 'Quem pegou emprestado?' }}</template>
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
            {{ membrosLocais.find(m => m.id === cartoes.find(c => c.id === wizCardOwner)!.responsavelPadraoId)!.nome }}
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
          :wiz-flow="wizFlow"
          :is-private="props.isPrivate"
          @select="selecionarFluxo"
        />

        <StepPaymentMethodSelection
          v-else-if="currentState === 'PAYMENT_METHOD_SELECTION'"
          :cartoes="cartoes"
          :is-cartao-trancado="isCartaoTrancado"
          :selected-card-owner-id="wizCardOwner"
          :selected-payment-method="wizPayment"
          @select="selecionarMetodoPagamento"
        />

        <StepMemberSelection
          v-else-if="currentState === 'BUYER_SELECTION' || currentState === 'LENDER_SELECTION'"
          :membros="membrosLocais"
          :current-state="currentState"
          :selected-id="compradorSelecionadoId"
          :is-private="props.isPrivate"
          @select="(id) => { compradorSelecionadoId = id; next() }"
          @adicionar-externo="handleAdicionarExterno"
        />

        <StepMemberSelection
          v-else-if="currentState === 'BORROWER_SELECTION'"
          :membros="membrosLocais"
          :current-state="currentState"
          :selected-id="borrowerId"
          :comprador-selecionado-id="compradorSelecionadoId"
          :is-private="props.isPrivate"
          @select="(id) => { borrowerId = id; next() }"
          @adicionar-externo="handleAdicionarExterno"
        />

        <StepValueInput
          v-else-if="currentState === 'VALUE'"
          v-model:valor="valor"
          v-model:installments="installments"
          :wiz-flow="(wizFlow === 'loan_given' || wizFlow === 'loan_taken') ? 'loan' : wizFlow"
          :wiz-payment="wizPayment"
        />

        <div v-else-if="currentState === 'DESCRIPTION'" class="space-y-6 animate-in fade-in duration-300">
          <StepDescriptionInput
            v-model:descricao="descricao"
            :wiz-flow="(wizFlow === 'loan_given' || wizFlow === 'loan_taken') ? 'loan' : wizFlow"
          />
        </div>

        <StepSplitSelector
          v-else-if="currentState === 'SPLIT'"
          v-model:participantes-divisao="participantesDivisao"
          v-model:splitType="splitType"
          :membros="membrosLocais"
          :comprador-selecionado-id="compradorSelecionadoId"
          :valor-total="Number(valor)"
          :is-private="props.isPrivate"
          @adicionar-externo="handleAdicionarExterno"
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
        v-if="currentState !== 'FLOW_SELECTION' && currentState !== 'PAYMENT_METHOD_SELECTION' && currentState !== 'BUYER_SELECTION' && currentState !== 'LENDER_SELECTION' && currentState !== 'BORROWER_SELECTION'"
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

