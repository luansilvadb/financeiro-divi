<script setup lang="ts">
import { computed } from 'vue'
import { Plus, Minus } from 'lucide-vue-next'

interface Props {
  valor: number
  installments: number
  wizFlow: 'expense' | 'loan' | null
  wizPayment: 'pix' | 'card' | null
}

const props = defineProps<Props>()
const emit = defineEmits(['update:valor', 'update:installments'])

const internalValor = computed({
  get: () => props.valor,
  set: (val) => emit('update:valor', val)
})

const internalInstallments = computed({
  get: () => props.installments,
  set: (val) => emit('update:installments', val)
})

const infoParcelamento = computed(() => {
  if (props.installments <= 1) return 'À vista'
  const parcela = (Number(props.valor) / props.installments).toFixed(2).replace('.', ',')
  return `${props.installments}x de R$ ${parcela}`
})
</script>

<template>
  <div class="space-y-5">
    <div class="rounded-card bg-parchment p-5 shadow-subtle transition-all duration-300">
      <label for="wizard-value-input" class="block text-[10px] font-bold text-graphite uppercase tracking-widest mb-2">Valor total do lançamento</label>
      <div class="flex items-center gap-2">
        <span class="text-[23px] font-bold text-charcoal tracking-tight" aria-hidden="true">R$</span>
        <input
          id="wizard-value-input"
          v-model.number="internalValor"
          type="number"
          inputmode="decimal"
          step="0.01"
          min="0"
          class="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none w-full bg-transparent border-none outline-none text-[40px] leading-none font-bold text-midnight tracking-tighter placeholder:text-ash"
          placeholder="0,00"
          autofocus
        />
      </div>
    </div>

    <div v-if="wizFlow === 'loan' || wizPayment === 'card'" class="rounded-card bg-white shadow-subtle p-4 space-y-3">
      <span class="block text-[10px] font-bold text-graphite uppercase tracking-widest">Opções de Parcelamento</span>
      <div class="flex items-center justify-between gap-3">
        <button 
          type="button" 
          @click="internalInstallments = Math.max(1, internalInstallments - 1)" 
          class="w-10 h-10 rounded-full bg-stone hover:opacity-80 flex items-center justify-center border-none cursor-pointer transition-opacity"
          aria-label="Diminuir parcelas"
        >
          <Minus class="w-4 h-4" aria-hidden="true" />
        </button>
        <div class="text-center" aria-live="polite">
          <span class="text-[23px] font-bold text-charcoal tracking-tight">{{ internalInstallments }}x</span>
          <p class="text-xs font-semibold text-graphite">{{ infoParcelamento }}</p>
        </div>
        <button 
          type="button" 
          @click="internalInstallments = Math.max(1, internalInstallments + 1)" 
          class="w-10 h-10 rounded-full bg-stone hover:opacity-80 flex items-center justify-center border-none cursor-pointer transition-opacity"
          aria-label="Aumentar parcelas"
        >
          <Plus class="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  </div>
</template>
