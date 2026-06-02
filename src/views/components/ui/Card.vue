<script setup lang="ts">
interface Props {
  variant?: 'default' | 'recessed' | 'dark' | 'featured'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default'
})

const variantClasses: Record<string, string> = {
  default: 'rounded-[20px] bg-card shadow-subtle p-6 sm:p-8 border border-stone/30',
  featured: 'rounded-[24px] bg-card shadow-subtle p-6 sm:p-10 border border-stone/50 ring-4 ring-ember/5',
  recessed: 'rounded-[20px] bg-parchment p-[24px] shadow-[inset_0_2px_8px_rgba(0,0,0,0.02)]',
  dark: 'rounded-[24px] bg-obsidian shadow-lg text-white p-8'
}
</script>

<template>
  <div :class="['transition-all duration-500 ease-spring hover:border-ember/20 group', variantClasses[props.variant]]">
    <slot />
  </div>
</template>
