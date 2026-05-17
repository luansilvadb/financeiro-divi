<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '../../shared/utils/cn'

interface Props {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'inverted'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'default'
})

const classes = computed(() => {
  return cn(
    'inline-flex items-center justify-center whitespace-nowrap transition-all duration-200 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
    // Mapeamento de tamanho
    props.size === 'default' && 'h-11 px-6 py-2 text-sm font-medium',
    props.size === 'sm' && 'h-9 px-4 text-xs font-medium',
    props.size === 'lg' && 'h-14 px-8 text-base font-medium',
    props.size === 'icon' && 'h-10 w-10 text-sm font-medium',
    // Mapeamento de variantes específicas do DESIGN.md
    props.variant === 'primary' && 'bg-midnight text-white hover:bg-charcoal-primary rounded-buttonspill font-semibold shadow-sm',
    props.variant === 'secondary' && 'bg-[#f6f4ef] text-midnight hover:bg-stone-surface rounded-buttonspill font-medium',
    props.variant === 'outline' && 'bg-transparent text-graphite border border-graphite hover:bg-stone-surface rounded-xl font-medium px-8 py-3',
    props.variant === 'ghost' && 'text-ember-orange hover:text-ember-orange/80 font-medium p-0 border-none bg-transparent',
    props.variant === 'inverted' && 'bg-white text-midnight hover:bg-[#f6f4ef] rounded-buttonspill font-medium shadow-sm',
    props.class
  )
})
</script>

<template>
  <button :class="classes">
    <slot />
  </button>
</template>
