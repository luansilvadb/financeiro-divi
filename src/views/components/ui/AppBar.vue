<!-- src/views/components/ui/AppBar.vue -->
<script setup lang="ts">
defineProps<{
  scrollRatio: number
}>()
</script>

<template>
  <header 
    class="relative flex items-center justify-between sticky top-0 z-50 overflow-hidden"
    :style="{
      '--scroll-ratio': scrollRatio,
      height: `calc(6rem - (2.25rem * ${scrollRatio}))`, /* 96px to 60px */
      /* Breakout parent padding: starts at 0, ends at -16px/-24px to touch edges */
      marginLeft: `calc(-1 * var(--parent-pad) * ${scrollRatio})`,
      marginRight: `calc(-1 * var(--parent-pad) * ${scrollRatio})`,
      width: `calc(100% + (2 * var(--parent-pad) * ${scrollRatio}))`,
      /* Horizontal padding: starts at 24px, ends at 0px */
      paddingLeft: `calc(var(--parent-pad) * (1 - ${scrollRatio}))`,
      paddingRight: `calc(var(--parent-pad) * (1 - ${scrollRatio}))`,
      /* Warm background transition: bg-transparent to bg-canvas */
      backgroundColor: scrollRatio > 0.05 ? `rgba(251, 250, 249, ${Math.min(1.0, 0.98 * scrollRatio)})` : 'transparent',
      /* shadow-premium for pinned state */
      boxShadow: scrollRatio > 0.6 
        ? `0 ${6 * Math.pow(scrollRatio, 2)}px ${24 * scrollRatio}px -4px rgba(67, 70, 69, ${0.08 * scrollRatio}), 
           0 0 1px rgba(18, 18, 18, ${0.1 * scrollRatio})` 
        : 'none',
      borderBottom: `1px solid rgba(242, 240, 237, ${Math.max(0, (scrollRatio - 0.8) * 10)})`,
    }"
  >
    <!-- Background Parallax Layer (absolute — fora do fluxo flex) -->
    <div 
      class="absolute inset-0 pointer-events-none z-0"
      :style="{
        opacity: 1 - scrollRatio,
        transform: `translateY(${scrollRatio * 24}px)`
      }"
    >
      <slot name="flexible-background" />
    </div>

    <!-- Coluna Esquerda: width natural, empurrada para a esquerda -->
    <div class="relative z-10 flex items-center justify-start shrink-0">
      <slot name="left" />
    </div>

    <!-- Coluna Central: ABSOLUTAMENTE centrada — left:50% + translateX(-50%) -->
    <!-- Garante que DIVI. está sempre em exatamente 50% da largura, independente das laterais -->
    <div class="absolute left-1/2 -translate-x-1/2 z-20 flex items-center justify-center pointer-events-none px-10">
      <div class="pointer-events-auto">
        <slot name="center" />
      </div>
    </div>

    <!-- Coluna Direita: width natural, empurrada para a direita -->
    <div class="relative z-10 flex items-center justify-end shrink-0">
      <slot name="right" />
    </div>
  </header>
</template>

<style scoped>
header {
  will-change: height, padding, background-color, box-shadow, margin, width;
  --parent-pad: 1.5rem; /* 24px */
}

@media (max-width: 640px) {
  header {
    --parent-pad: 1rem; /* 16px */
  }
}
</style>
