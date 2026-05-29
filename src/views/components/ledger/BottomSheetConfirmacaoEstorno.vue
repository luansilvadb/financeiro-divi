<template>
  <BottomSheet 
    :model-value="visible" 
    @update:model-value="(val: boolean) => { if (!val) $emit('cancel') }" 
    width-class="md:w-[420px]"
  >
    <div class="p-8 sm:p-10 space-y-8 flex flex-col items-center text-center">
      <!-- Ilustração Sad Blob (Estilo Family) -->
      <div class="relative w-32 h-32 mb-2">
        <svg viewBox="0 0 100 100" class="w-full h-full drop-shadow-sm">
          <!-- Corpo do Blob (Coral Red para indicar perigo/tristeza) -->
          <path 
            d="M20,50 Q20,20 50,20 Q80,20 80,50 Q80,80 50,85 Q20,80 20,50 Z" 
            fill="var(--color-coral)" 
            class="animate-pulse"
            style="animation-duration: 4s;"
          />
          <!-- Olhinhos tristes (Stick limbs style) -->
          <circle cx="40" cy="45" r="3" fill="white" />
          <circle cx="60" cy="45" r="3" fill="white" />
          <!-- Boca curva de preocupação -->
          <path d="M42,62 Q50,55 58,62" stroke="white" stroke-width="2.5" stroke-linecap="round" fill="none" />
          <!-- Perninhas de palito -->
          <line x1="40" y1="83" x2="35" y2="95" stroke="var(--color-charcoal)" stroke-width="3" stroke-linecap="round" />
          <line x1="60" y1="83" x2="65" y2="95" stroke="var(--color-charcoal)" stroke-width="3" stroke-linecap="round" />
        </svg>
      </div>

      <!-- Cabeçalho -->
      <div class="space-y-3">
        <h3 class="text-heading text-charcoal leading-tight">
          {{ itemType === 'Conta Fixa' ? 'Excluir Modelo?' : `Estornar ${itemType}?` }}
        </h3>
        <p class="text-body text-graphite leading-relaxed max-w-[280px] mx-auto">
          {{ itemType === 'Conta Fixa' 
            ? 'Este modelo de conta fixa será removido da sua lista. Lançamentos que já foram feitos não serão afetados.'
            : 'O lançamento será removido e os saldos dos moradores serão recalculados imediatamente.' 
          }}
        </p>
      </div>

      <!-- Detalhes do Item (Visual Recessed Panel) -->
      <div v-if="itemName || (itemValue !== undefined && itemValue !== null)" class="w-full p-6 rounded-card bg-parchment shadow-subtle border-none">
        <div class="flex justify-between items-center gap-4">
          <div class="text-left flex-1 min-w-0">
            <p class="text-caption font-bold uppercase text-ash tracking-widest mb-1">
              {{ itemType === 'Conta Fixa' ? 'Nome da Conta' : 'Item selecionado' }}
            </p>
            <p class="text-body font-semibold text-charcoal truncate">{{ itemName || 'Sem descrição' }}</p>
          </div>
          <div v-if="itemValue" class="text-right shrink-0">
            <p class="text-caption font-bold uppercase text-ash tracking-widest mb-1">Valor</p>
            <p class="text-heading-sm font-bold text-ember">R$ {{ itemValue.toFixed(2).replace('.', ',') }}</p>
          </div>
        </div>
      </div>

      <!-- Ações (Pill Buttons) -->
      <div class="flex flex-col gap-4 w-full pt-4">
        <Button 
          variant="primary" 
          class="w-full h-14 text-body font-semibold bg-midnight text-white rounded-pill hover:bg-charcoal transition-all"
          @click="$emit('confirm')"
        >
          {{ itemType === 'Conta Fixa' ? 'Sim, excluir modelo' : 'Sim, confirmar estorno' }}
        </Button>
        <Button 
          variant="secondary" 
          class="w-full h-14 text-body font-semibold bg-stone text-charcoal rounded-pill hover:bg-stone/80 border-none transition-all"
          @click="$emit('cancel')"
        >
          {{ itemType === 'Conta Fixa' ? 'Não, manter modelo' : 'Não, manter lançamento' }}
        </Button>
      </div>
    </div>
  </BottomSheet>
</template>

<script setup lang="ts">
import BottomSheet from '../ui/BottomSheet.vue'
import Button from '../ui/Button.vue'

defineProps<{
  visible: boolean
  itemType: string // ex: "Lançamento", "Conta Fixa"
  itemName?: string
  itemValue?: number
}>()

defineEmits(['confirm', 'cancel'])
</script>
