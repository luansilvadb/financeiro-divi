<script setup lang="ts">
import { type ItemExtrato } from '../../../../models/services/ExtratoService'

interface Props {
  item: ItemExtrato
}

const props = defineProps<Props>()

const formatarBRL = (centavos: number) => {
  const reais = Math.abs(centavos) / 100
  return reais.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const obterClasseSaldo = (centavos: number) => {
  if (centavos > 0) return 'text-meadow font-bold'
  if (centavos < 0) return 'text-coral font-bold'
  return 'text-graphite font-semibold'
}

const obterSinalSaldo = (centavos: number) => {
  if (centavos > 0) return '+'
  if (centavos < 0) return '-'
  return ''
}
</script>

<template>
  <div class="p-3.5 rounded-xl border border-stone bg-canvas flex justify-between items-center gap-4 hover:border-ember/30 transition-all duration-300 shadow-subtle group">
    <div class="space-y-2 min-w-0 flex-1">
      <span class="text-sm font-bold text-charcoal block truncate tracking-tight">{{ item.descricao }}</span>
      <div class="flex flex-wrap items-center gap-2">
        <span v-if="item.valorPago.centavos > 0" class="text-[10px] font-bold text-meadow bg-meadow/10 px-2 py-0.5 rounded-md uppercase tracking-wider">
          Pagou +R$ {{ (item.valorPago.centavos / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}
        </span>
        <span v-if="item.valorConsumido.centavos > 0" class="text-[10px] font-bold text-coral bg-coral/10 px-2 py-0.5 rounded-md uppercase tracking-wider">
          Consumiu -R$ {{ (item.valorConsumido.centavos / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}
        </span>
      </div>
    </div>
    <div class="text-right shrink-0">
      <span 
        class="text-[13px] font-display block font-bold tracking-tight transition-colors"
        :class="obterClasseSaldo(item.saldoAcumulado.centavos)"
      >
        {{ obterSinalSaldo(item.saldoAcumulado.centavos) }}R$ {{ formatarBRL(item.saldoAcumulado.centavos) }}
      </span>
      <p class="text-[9px] text-graphite uppercase font-bold tracking-wider mt-0.5">Acumulado</p>
    </div>
  </div>
</template>
