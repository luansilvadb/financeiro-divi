<script setup lang="ts">
import { User, ChevronDown, ChevronUp } from 'lucide-vue-next'
import { Dinheiro } from '../../../shared/primitives/Dinheiro'

defineProps<{
  nome: string
  saldo: Dinheiro
  isExpanded: boolean
}>()

defineEmits(['toggle'])

const formatarDinheiro = (valor: Dinheiro) => {
  return valor.formatar()
}
</script>

<template>
  <div class="rounded-2xl overflow-hidden border border-divi-border glass-card mb-3 text-divi-t1">
    <div 
      @click="$emit('toggle')"
      :class="['flex items-center justify-between p-3.5 cursor-pointer transition-colors', isExpanded ? 'bg-divi-primary-dim/15' : 'hover:bg-divi-s1/30']"
    >
      <div class="flex items-center gap-2.5">
        <div :class="['p-2 rounded-full border', saldo.centavos >= 0 ? 'bg-emerald-500/10 text-divi-emerald border-emerald-500/20 shadow-[0_0_8px_var(--emerald-glow)]' : 'bg-rose-500/10 text-divi-rose border-rose-500/20']">
          <User class="w-4 h-4" />
        </div>
        <span class="text-xs font-bold text-divi-t1">{{ nome }}</span>
      </div>
      <div class="flex items-center gap-3">
        <div class="text-right">
          <div :class="['font-black text-sm font-mono', saldo.centavos >= 0 ? 'text-divi-emerald text-glow-emerald' : 'text-divi-rose']">
            {{ saldo.centavos > 0 ? '+' : '' }}{{ formatarDinheiro(saldo) }}
          </div>
        </div>
        <component :is="isExpanded ? ChevronUp : ChevronDown" class="w-3.5 h-3.5 text-divi-t2" />
      </div>
    </div>
    
    <div v-if="isExpanded" class="bg-divi-s1/10 border-t border-divi-border p-3.5 space-y-3">
      <slot name="details" />
    </div>
  </div>
</template>
