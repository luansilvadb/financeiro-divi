<script setup lang="ts">
import { cn } from '../../shared/utils/cn'

interface Props {
  variant?: 'default' | 'recessed' | 'dark' | 'featured'
  class?: any
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default'
})
</script>

<template>
  <!-- Card Padrão (White) com borda stone tátil interna (subtle inset) -->
  <div 
    v-if="props.variant === 'default' || props.variant === 'featured'"
    :class="cn(
      'rounded-cards bg-card shadow-subtle transition-all duration-300 p-8',
      props.class
    )"
  >
    <slot />
  </div>

  <!-- Card Recessed (Warm Cream) afundado no layout sem sombras -->
  <div 
    v-else-if="props.variant === 'recessed'"
    :class="cn(
      'rounded-[12px] bg-recessed p-[22.8px] transition-all duration-300',
      props.class
    )"
  >
    <slot />
  </div>

  <!-- Card Escuro / Mockup de Celular (Obsidian) -->
  <div 
    v-else-if="props.variant === 'dark'"
    :class="cn(
      'rounded-t-[24px] rounded-b-[24px] bg-obsidian shadow-lg text-white p-6',
      props.class
    )"
  >
    <slot />
  </div>
</template>
