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
  <!-- Card Padrão (White) -->
  <div 
    v-if="props.variant === 'default' || props.variant === 'featured'"
    :class="cn(
      'rounded-card bg-card shadow-subtle transition-all duration-300 p-8',
      props.class
    )"
  >
    <slot />
  </div>

  <!-- Card Recessed (Parchment) -->
  <div 
    v-else-if="props.variant === 'recessed'"
    :class="cn(
      'rounded-card-lg bg-parchment p-[22.8px] transition-all duration-300',
      props.class
    )"
  >
    <slot />
  </div>

  <!-- Card Escuro / Phone Mockup (Obsidian) -->
  <div 
    v-else-if="props.variant === 'dark'"
    :class="cn(
      'rounded-card-lg bg-obsidian shadow-lg text-white p-6',
      props.class
    )"
  >
    <slot />
  </div>
</template>
