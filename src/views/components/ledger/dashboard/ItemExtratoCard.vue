<script setup lang="ts">
import { type ItemExtrato } from '../../../../models/services/ExtratoService'

interface Props {
  item: ItemExtrato
}

const props = defineProps<Props>()

const formatarBRL = (centavos: number) => {
  const reais = centavos / 100
  return reais.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
</script>

<template>
  <div class="p-3.5 rounded-xl border border-stone bg-canvas flex justify-between items-center gap-4 hover:border-ember/30 transition-all duration-300 shadow-subtle group">
    <div class="space-y-1.5 min-w-0 flex-1">
      <span class="text-xs font-bold text-charcoal block truncate tracking-tight">{{ item.descricao }}</span>
      <div class="flex flex-wrap items-center gap-2">
        <span v-if="item.valorPago.centavos > 0" class="text-[9px] font-bold text-meadow bg-meadow/10 px-2 py-0.5 rounded-md uppercase tracking-wider">
          Pagou +R$ {{ formatarBRL(item.valorPago.centavos) }}
        </span>
        <span v-if="item.valorConsumido.centavos > 0" class="text-[9px] font-bold text-coral bg-coral/10 px-2 py-0.5 rounded-md uppercase tracking-wider">
          Consumiu -R$ {{ formatarBRL(item.valorConsumido.centavos) }}
        </span>
      </div>
    </div>
    <div class="text-right shrink-0">
      <span class="text-[13px] font-display text-charcoal block font-bold tracking-tight group-hover:text-ember transition-colors">
        {{ item.saldoAcumulado.centavos > 0 ? '+' : '' }}R$ {{ formatarBRL(item.saldoAcumulado.centavos) }}
      </span>
      <p class="text-[8px] text-graphite uppercase font-semibold tracking-[0.1em] opacity-60">Acumulado</p>
    </div>
  </div>
</template>
