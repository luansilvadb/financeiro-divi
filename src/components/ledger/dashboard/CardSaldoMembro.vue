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
  <div class="rounded-xl overflow-hidden border border-gray-100 mb-4">
    <div 
      @click="$emit('toggle')"
      :class="['flex items-center justify-between p-3 cursor-pointer transition-colors', isExpanded ? 'bg-blue-50' : 'bg-gray-50 hover:bg-gray-100']"
    >
      <div class="flex items-center gap-3">
        <div :class="['p-2 rounded-full', saldo.centavos >= 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600']">
          <User class="w-5 h-5" />
        </div>
        <span class="font-medium text-gray-700">{{ nome }}</span>
      </div>
      <div class="flex items-center gap-4">
        <div class="text-right">
          <div :class="['font-bold text-lg', saldo.centavos >= 0 ? 'text-green-600' : 'text-red-600']">
            {{ saldo.centavos > 0 ? '+' : '' }}{{ formatarDinheiro(saldo) }}
          </div>
        </div>
        <component :is="isExpanded ? ChevronUp : ChevronDown" class="w-4 h-4 text-gray-400" />
      </div>
    </div>
    
    <div v-if="isExpanded" class="bg-white border-t border-blue-50 p-4 space-y-4">
      <slot name="details" />
    </div>
  </div>
</template>
