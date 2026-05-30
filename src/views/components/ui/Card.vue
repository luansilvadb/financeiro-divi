<script setup lang="ts">
interface Props {
  variant?: 'default' | 'recessed' | 'dark' | 'featured'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default'
})

const variantClasses: Record<string, string> = {
  default: 'rounded-card bg-card shadow-subtle p-6 sm:p-8',
  featured: 'rounded-card bg-card shadow-subtle p-6 sm:p-8',
  recessed: 'rounded-card-lg bg-parchment p-[22.8px]',
  dark: 'rounded-card-lg bg-obsidian shadow-lg text-white p-6'
}
</script>

<template>
  <div :class="['transition-all duration-300', variantClasses[props.variant]]">
    <slot />
  </div>
</template>
