<!-- src/views/components/ui/AppBar.vue -->
<script setup lang="ts">
import { useTemplateRef } from 'vue'

// No scrollRatio prop — all scroll-driven mutations are applied externally
// via the exposed DOM refs (Direct DOM Mutation Pattern).
// This completely removes Vue's reactivity pipeline from the animation hot path.

const headerEl = useTemplateRef<HTMLElement>('headerEl')
const parallaxEl = useTemplateRef<HTMLElement>('parallaxEl')

defineExpose({ headerEl, parallaxEl })
</script>

<template>
  <!--
    ZERO-JITTER CONTRACT:
    - NO `transition` class on this element or its children for scroll-driven props.
    - `will-change` hints GPU to pre-promote this layer.
    - All style changes come from DashboardHeader via el.style mutations inside RAF.
  -->
  <header
    ref="headerEl"
    class="relative flex items-center justify-between sticky top-0 z-50 overflow-hidden"
  >
    <!-- Background Parallax Layer (absolute — fora do fluxo flex) -->
    <!-- opacity e translateY são mutados diretamente pelo pai via parallaxEl ref -->
    <div
      ref="parallaxEl"
      class="absolute inset-0 pointer-events-none z-0"
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
  /*
   * will-change instrui a GPU a criar uma layer dedicada para este elemento.
   * Propriedades listadas aqui são as mutadas pelo RAF loop no DashboardHeader.
   * NÃO adicionar `transition` aqui — causaria double-interpolation jitter.
   */
  will-change: height, padding, background-color, box-shadow, margin, width;

  /* --parent-pad controla o breakout edge-to-edge e o padding interno.
     Lido pelo DashboardHeader via getComputedStyle para calcular os valores CSS. */
  --parent-pad: 1.5rem; /* 24px */

  /* Altura base: 6rem (96px). Mutada diretamente via headerEl.style.height pelo pai. */
  height: 6rem;
}

@media (max-width: 640px) {
  header {
    --parent-pad: 1rem; /* 16px */
  }
}
</style>
