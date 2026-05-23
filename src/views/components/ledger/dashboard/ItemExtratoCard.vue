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
  <div class="p-3 rounded-lg border border-stone bg-canvas flex justify-between items-center gap-4 hover:border-ember/30 transition-colors">
    <div class="space-y-1 min-w-0">
      <span class="text-xs font-bold text-charcoal block truncate">{{ item.descricao }}</span>
      <div class="flex items-center gap-2">
        <span v-if="item.valorPago.centavos > 0" class="text-[9px] font-bold text-meadow bg-meadow/10 px-1.5 py-0.5 rounded">
          PAGOU: +R$ {{ formatarBRL(item.valorPago.centavos) }}
        </span>
        <span v-if="item.valorConsumido.centavos > 0" class="text-[9px] font-bold text-coral bg-coral/10 px-1.5 py-0.5 rounded">
          USOU: -R$ {{ formatarBRL(item.valorConsumido.centavos) }}
        </span>
      </div>
    </div>
    <div class="text-right shrink-0">
      <span class="text-[11px] font-display text-charcoal block font-bold">
        {{ item.saldoAcumulado.centavos > 0 ? '+' : '' }}R$ {{ formatarBRL(item.saldoAcumulado.centavos) }}
      </span>
      <span class="text-[9px] text-ash uppercase tracking-tighter">Saldo Acumulado</span>
    </div>
  </div>
</template>
