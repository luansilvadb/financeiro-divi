<script setup lang="ts">
import { computed, ref } from 'vue'
import { Gasto } from '../../../../models/entities/Gasto'
import { ExtratoService } from '../../../../models/services/ExtratoService'
import Card from '../../ui/Card.vue'
import { Search, HelpCircle } from 'lucide-vue-next'
import DetalhamentoMembroCard from './DetalhamentoMembroCard.vue'
import HelpExplanationModal from './HelpExplanationModal.vue'

interface Props {
  membros: { id: string; nome: string }[]
  gastos: Gasto[]
  saldosUnificados: Record<string, number>
}

const props = defineProps<Props>()

const showHelpModal = ref(false)

const detailedBreakdown = computed(() => {
  return ExtratoService.obterBreakdownGranular(props.membros, props.gastos)
})
</script>

<template>
  <Card class="!p-0 overflow-hidden shadow-subtle bg-card rounded-2xl">
    <div class="py-5 px-5 sm:py-7 sm:px-6 border-b border-stone bg-parchment flex justify-between items-center">
      <div class="flex items-center gap-5">
        <div class="w-11 h-11 rounded-xl bg-charcoal text-white flex items-center justify-center shadow-sm">
          <Search class="w-5 h-5" aria-hidden="true" />
        </div>
        <div>
          <h2 class="font-bold text-lg leading-tight text-charcoal tracking-tight">Análise Detalhada</h2>
          <p class="text-[11px] text-graphite uppercase tracking-widest mt-0.5 font-semibold">
            Fluxos de PIX, Cartão e Empréstimos
          </p>
        </div>
      </div>

      <button 
        @click="showHelpModal = true"
        class="w-10 h-10 rounded-full hover:bg-stone flex items-center justify-center text-graphite hover:text-ember transition-colors border-none bg-transparent cursor-pointer active:scale-95"
        title="Como funciona a divisão dos saldos?"
        aria-label="Como funciona a divisão dos saldos?"
      >
        <HelpCircle class="w-5.5 h-5.5" />
      </button>
    </div>

    <div class="p-4 sm:p-8 space-y-12">
      <DetalhamentoMembroCard 
        v-for="m in membros" 
        :key="m.id" 
        :membro="m"
        :gastos="gastos"
        :saldo-unificado="saldosUnificados[m.id] || 0"
        :breakdown="detailedBreakdown[m.id]"
      />
    </div>

    <HelpExplanationModal :show="showHelpModal" @close="showHelpModal = false" />
  </Card>
</template>
