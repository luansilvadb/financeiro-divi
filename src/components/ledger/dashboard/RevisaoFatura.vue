<script setup lang="ts">
import { ref } from 'vue'
import type { Fatura } from '../../../modules/ledger/core/domain/Fatura'
import type { Gasto } from '../../../modules/ledger/core/domain/Gasto'
import ListaGastosRevisao from './ListaGastosRevisao.vue'
import PreviaAcertos from './PreviaAcertos.vue'
import BottomSheetDivisaoGasto from './BottomSheetDivisaoGasto.vue'
import { ChevronLeft } from 'lucide-vue-next'

interface Props {
  fatura: Fatura
  membros: { id: string; nome: string }[]
}

const props = defineProps<Props>()
const emit = defineEmits(['voltar', 'acertoConfirmado'])

const showBottomSheetRateio = ref(false)
const gastoSendoEditado = ref<Gasto | null>(null)

const abrirBottomSheetRateio = (g: Gasto) => {
  gastoSendoEditado.value = g
  showBottomSheetRateio.value = true
}

const fecharBottomSheetRateio = () => {
  showBottomSheetRateio.value = false
  gastoSendoEditado.value = null
}

const handleSalvarRateio = () => {
  // O componente interno já manipula a instância do Gasto
  fecharBottomSheetRateio()
}
</script>

<template>
  <div class="min-h-screen bg-canvas pb-20 animate-in fade-in duration-500">
    <!-- Header Fixo de Revisão -->
    <header class="bg-white border-b border-stone sticky top-0 z-30 px-4 py-4 sm:px-6">
      <div class="max-w-4xl mx-auto flex items-center justify-between">
        <button 
          @click="emit('voltar')"
          class="flex items-center gap-2 text-ash hover:text-charcoal transition-colors font-bold uppercase text-[10px] tracking-widest"
        >
          <ChevronLeft class="w-4 h-4" />
          Voltar ao Dashboard
        </button>
        <div class="text-right">
          <h2 class="text-sm font-bold text-charcoal">Revisão de Fatura</h2>
          <p class="text-[10px] text-ash uppercase tracking-wider">{{ fatura.periodo.mes }}/{{ fatura.periodo.ano }}</p>
        </div>
      </div>
    </header>

    <main class="max-w-4xl mx-auto p-4 sm:p-6 space-y-12 mt-4">
      <!-- 1. Lista de Gastos -->
      <section class="space-y-6">
        <div class="space-y-1">
          <h3 class="text-2xl font-black text-charcoal tracking-tight">1. Conferir Lançamentos</h3>
          <p class="text-xs text-ash">Revise se todos os gastos e divisões estão corretos para esta fatura.</p>
        </div>
        
        <ListaGastosRevisao 
          :fatura-id="fatura.id"
          :membros="props.membros"
          @editarRateio="abrirBottomSheetRateio"
        />
      </section>

      <!-- 2. Prévia de Acertos (Cálculo Final) -->
      <section class="space-y-6">
        <div class="space-y-1">
          <h3 class="text-2xl font-black text-charcoal tracking-tight">2. Resultado do Rateio</h3>
          <p class="text-xs text-ash">Veja quanto cada morador deve enviar para o responsável pela fatura.</p>
        </div>

        <PreviaAcertos 
          :fatura="fatura"
          :membros="props.membros"
          @confirmado="emit('acertoConfirmado')"
        />
      </section>
    </main>

    <!-- BottomSheet de Edição de Rateio -->
    <BottomSheetDivisaoGasto
      v-if="gastoSendoEditado"
      :show="showBottomSheetRateio"
      :gasto="gastoSendoEditado"
      :membros="props.membros"
      @close="fecharBottomSheetRateio"
      @save="handleSalvarRateio"
    />
  </div>
</template>
