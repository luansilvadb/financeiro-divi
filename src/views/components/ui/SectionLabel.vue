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
  <div :class="['inline-flex items-center gap-3 rounded-tags border border-ember/20 bg-ember/5 px-4 py-1.5 shrink-0', $props.class]">
    <span 
      :class="[
        'h-2 w-2 shrink-0 rounded-full bg-ember',
        pulse ? 'animate-pulse' : ''
      ]"  
    />
    <span class="font-sans text-[11px] font-bold uppercase tracking-[0.12em] text-ember whitespace-nowrap">
      <slot />
    </span>
  </div>
</template>
