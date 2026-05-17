<script setup lang="ts">
import { ref, computed } from 'vue'
import { Fatura } from '../../../modules/ledger/core/domain/Fatura'
import { Gasto } from '../../../modules/ledger/core/domain/Gasto'
import { useCartoesEFaturas } from '../../../modules/ledger/composables/useCartoesEFaturas'
import ListaGastosRevisao from './ListaGastosRevisao.vue'
import PreviaAcertos from './PreviaAcertos.vue'
import ModalDivisaoGasto from './ModalDivisaoGasto.vue'

interface Props {
  fatura: Fatura
  membros: { id: string; nome: string }[]
}

const props = defineProps<Props>()
const emit = defineEmits(['acertoConfirmado', 'voltar'])

const { 
  gastos, 
  antecipacoes, 
  atualizarGastoDivisoesManual, 
  atualizarGastoCompradorManual,
  confirmarAcertosManual,
  reabrirFaturaManual 
} = useCartoesEFaturas()

// Filtra apenas gastos e antecipações pertencentes a esta fatura
const gastosFatura = computed(() => {
  return gastos.value.filter(g => g.faturaId === props.fatura.id)
})

const antecipacoesFatura = computed(() => {
  return antecipacoes.value.filter(a => a.faturaId === props.fatura.id)
})

// Controle de modal de edição de rateio
const showModalRateio = ref(false)
const gastoSelecionado = ref<Gasto | null>(null)

const abrirModalRateio = (g: Gasto) => {
  gastoSelecionado.value = g
  showModalRateio.value = true
}

const fecharModalRateio = () => {
  gastoSelecionado.value = null
  showModalRateio.value = false
}

const salvarRateio = async (gastoId: string, compradorId: string, divisoes: any[]) => {
  // Salva no repositório local e recarrega
  await atualizarGastoCompradorManual(gastoId, compradorId)
  await atualizarGastoDivisoesManual(gastoId, divisoes)
  fecharModalRateio()
}

// Confirmação definitiva de acertos
const processandoConfirmacao = ref(false)
const confirmarAcertos = async () => {
  processandoConfirmacao.value = true
  try {
    await confirmarAcertosManual(props.fatura.id)
    emit('acertoConfirmado')
  } catch (err) {
    console.error(err)
    alert('Erro ao confirmar acertos. Tente novamente.')
  } finally {
    processandoConfirmacao.value = false
  }
}

// Reabrir fatura sob revisão
const reabrirFatura = async () => {
  if (confirm('Tem certeza de que deseja reabrir esta fatura? Todos os gastos sob revisão voltarão a ser editáveis no lançamento.')) {
    await reabrirFaturaManual(props.fatura.id)
    emit('voltar')
  }
}

const totalFatura = computed(() => {
  return gastosFatura.value.reduce((sum, g) => sum + g.valorTotal.centavos, 0) / 100
})
</script>

<template>
  <div class="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
    <!-- Top Header -->
    <div class="glass-card border border-divi-border p-6 rounded-3xl shadow-lg flex flex-col md:flex-row md:justify-between md:items-center gap-4 text-divi-t1 relative overflow-hidden">
      <div class="flex items-center gap-4">
        <button 
          @click="emit('voltar')"
          class="w-10 h-10 rounded-full bg-divi-s2 hover:bg-divi-s3 text-divi-t1 font-bold flex items-center justify-center border border-divi-border transition-all active:scale-95 rotate-180"
        >
          ➔
        </button>
        <div>
          <h2 class="text-xl font-black text-divi-t1 flex items-center gap-2">
            Revisão da Fatura
            <span class="text-[10px] bg-divi-amber-dim/15 text-divi-amber border border-divi-amber/20 font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm">Fechada</span>
          </h2>
          <span class="text-xs text-divi-t2 font-medium block mt-1">
            Fatura do mês {{ props.fatura.periodo.mes }}/{{ props.fatura.periodo.ano }} • Total de R$ {{ totalFatura.toFixed(2).replace('.', ',') }}
          </span>
        </div>
      </div>

      <div class="flex gap-2">
        <button 
          @click="reabrirFatura"
          class="px-4 py-2.5 border border-divi-rose/25 bg-divi-rose-dim/15 hover:bg-divi-rose-dim/25 text-divi-rose rounded-2xl text-xs font-black transition-all active:scale-95 shadow-sm"
        >
          🔓 Reabrir Fatura
        </button>
        <button 
          @click="confirmarAcertos"
          :disabled="processandoConfirmacao"
          class="px-5 py-2.5 bg-divi-primary hover:bg-indigo-500 disabled:bg-divi-s1 border border-indigo-400/25 disabled:border-divi-border disabled:text-divi-t3 text-white rounded-2xl text-xs font-black shadow-[0_0_16px_var(--primary-glow)] disabled:shadow-none transition-all active:scale-95 flex items-center gap-2"
        >
          <span v-if="processandoConfirmacao">Processando...</span>
          <span v-else>✅ Confirmar Acertos Pix</span>
        </button>
      </div>
    </div>

    <!-- Main Content Split (2 Colunas) -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <!-- Coluna da Esquerda: Extrato -->
      <div class="lg:col-span-7 glass-card border border-divi-border rounded-3xl p-5 md:p-6 shadow-md space-y-4 text-divi-t1">
        <ListaGastosRevisao 
          :gastos="gastosFatura" 
          :membros="props.membros" 
          @editarRateio="abrirModalRateio"
        />
      </div>

      <!-- Coluna da Direita: Saldos e Pix -->
      <div class="lg:col-span-5 space-y-6">
        <PreviaAcertos 
          :fatura-id="props.fatura.id"
          :responsavel-id="props.fatura.responsavelId"
          :gastos="gastosFatura"
          :antecipacoes="antecipacoesFatura"
          :membros="props.membros"
        />
      </div>
    </div>

    <!-- Modal de Edição de Rateio -->
    <ModalDivisaoGasto 
      :show="showModalRateio"
      :gasto="gastoSelecionado"
      :membros="props.membros"
      @close="fecharModalRateio"
      @salvar="salvarRateio"
    />
  </div>
</template>
