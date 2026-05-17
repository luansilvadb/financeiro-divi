<script setup lang="ts">
import { useNovoLancamentoWizard } from '../../modules/ledger/composables/useNovoLancamentoWizard'
import WizardProgressBar from './WizardProgressBar.vue'
import WizardFooter from './WizardFooter.vue'
import WizardStep1Tipo from './wizard/WizardStep1Tipo.vue'
import WizardStep2Dados from './wizard/WizardStep2Dados.vue'
import WizardStep3Divisao from './wizard/WizardStep3Divisao.vue'

interface Props {
  membros: { id: string; nome: string }[]
}

const props = defineProps<Props>()
const emit = defineEmits(['salvar', 'cancelar'])

const {
  step,
  totalSteps,
  tipo,
  valor,
  descricao,
  beneficiarios_selecionados,
  pagamentos,
  restantePagamento,
  pagamentosEquilibrados,
  canAdvance,
  next,
  prev,
  selecionarTipo,
  toggleBeneficiario,
  finalizar: finalizarWizard
} = useNovoLancamentoWizard(props.membros)

const finalizar = () => {
  const transacao = finalizarWizard()
  emit('salvar', transacao)
}
</script>

<template>
  <div class="max-w-md mx-auto p-6 bg-white rounded-xl shadow-md pb-24 md:pb-6">
    <WizardProgressBar :current-step="step" :total-steps="totalSteps" />

    <WizardStep1Tipo 
      v-if="step === 1" 
      :tipo="tipo" 
      @selecionar="selecionarTipo" 
    />

    <WizardStep2Dados
      v-else-if="step === 2"
      v-model:valor="valor"
      v-model:descricao="descricao"
      :tipo="tipo"
    />

    <WizardStep3Divisao
      v-else-if="step === 3"
      :membros="props.membros"
      :beneficiarios_selecionados="beneficiarios_selecionados"
      v-model:pagamentos="pagamentos"
      :valor="valor"
      :pagamentos-equilibrados="pagamentosEquilibrados"
      :restante-pagamento="restantePagamento"
      @toggle-beneficiario="toggleBeneficiario"
      @marcar-todos="beneficiarios_selecionados = props.membros.map(m => m.id)"
      @limpar="beneficiarios_selecionados = []"
    />

    <WizardFooter 
      :step="step" 
      :total-steps="totalSteps" 
      :can-advance="canAdvance"
      @next="next"
      @prev="prev"
      @finish="finalizar"
    />
  </div>
</template>

