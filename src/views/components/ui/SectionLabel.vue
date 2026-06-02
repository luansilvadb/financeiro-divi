<script setup lang="ts">
interface Props {
  pulse?: boolean
  class?: string
}

withDefaults(defineProps<Props>(), {
  pulse: true
})
</script>

<template>
  <div :class="['inline-flex items-center gap-2.5 rounded-tags border border-ember/20 bg-ember/5 px-4 py-2 shrink-0 shadow-sm', $props.class]">
    <span 
      :class="[
        'h-2 w-2 shrink-0 rounded-full bg-ember',
        pulse ? 'animate-pulse' : ''
      ]"  
    />
    <span class="font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-ember whitespace-nowrap leading-none">
      <slot />
    </span>
  </div>
</template>
