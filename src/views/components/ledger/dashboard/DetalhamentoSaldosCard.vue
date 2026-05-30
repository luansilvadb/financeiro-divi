<script setup lang="ts">
import { computed } from 'vue'
import { Gasto } from '../../../../models/entities/Gasto'
import { ExtratoService } from '../../../../models/services/ExtratoService'
import Card from '../../ui/Card.vue'
import { Search } from 'lucide-vue-next'
import DetalhamentoMembroCard from './DetalhamentoMembroCard.vue'

interface Props {
  membros: { id: string; nome: string }[]
  gastos: Gasto[]
  saldosUnificados: Record<string, number>
}

const props = defineProps<Props>()

const detailedBreakdown = computed(() => {
  return ExtratoService.obterBreakdownGranular(props.membros, props.gastos)
})
</script>

<template>
  <Card class="p-0 overflow-hidden shadow-subtle bg-card rounded-card">
    <div class="p-6 border-b border-stone bg-parchment flex justify-between items-center">
      <div class="flex items-center gap-4">
        <div class="w-10 h-10 rounded-xl bg-midnight text-white flex items-center justify-center">
          <Search class="w-5 h-5" />
        </div>
        <div>
          <h3 class="font-bold text-lg leading-tight text-charcoal">Detalhamento Granular</h3>
          <p class="text-[11px] text-ash uppercase tracking-wider mt-0.5">
            Fluxos de PIX, Cartão e Empréstimos
          </p>
        </div>
      </div>
    </div>

    <div class="p-6 sm:p-8 space-y-12">
      <DetalhamentoMembroCard 
        v-for="m in membros" 
        :key="m.id" 
        :membro="m"
        :gastos="gastos"
        :saldo-unificado="saldosUnificados[m.id] || 0"
        :breakdown="detailedBreakdown[m.id]"
      />
    </div>
  </Card>
</template>
