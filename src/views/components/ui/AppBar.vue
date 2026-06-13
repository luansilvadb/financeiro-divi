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
    class="relative flex items-center justify-between sticky z-50 overflow-hidden"
  >
    <!-- Background Parallax Layer (absolute — fora do fluxo flex) -->
    <!-- opacity e translateY são mutados diretamente pelo pai via parallaxEl ref -->
    <div
      ref="parallaxEl"
      class="absolute inset-0 pointer-events-none z-0"
    >
      <slot name="flexible-background" />
    </div>

    <!-- Coluna Esquerda: Left-aligned content column (flex-1 basis-0 justify-start) -->
    <div class="relative z-10 flex-1 basis-0 flex items-center justify-start">
      <slot name="left" />
    </div>

    <!-- Coluna Central: Centered branding column (flex-shrink-0 min-w-max) -->
    <div class="relative z-20 flex-shrink-0 min-w-max flex items-center justify-center">
      <slot name="center" />
    </div>

    <!-- Coluna Direita: Right-aligned content column (flex-1 basis-0 justify-end) -->
    <div class="relative z-10 flex-1 basis-0 flex items-center justify-end">
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
  will-change: background-color, box-shadow;

  /* --parent-pad controla o breakout edge-to-edge e o padding interno.
     Lido pelo DashboardHeader via getComputedStyle para calcular os valores CSS. */
  --parent-pad: 1.5rem; /* 24px */

  /* Altura física constante de 120px para evitar layout shift e flickering no mobile */
  height: 120px;
  top: -68px;

  /* Geometria lateral estática para evitar layout reflows durante o scroll */
  margin-left: calc(-1 * var(--parent-pad));
  margin-right: calc(-1 * var(--parent-pad));
  width: calc(100% + 2 * var(--parent-pad));
  padding-left: var(--parent-pad);
  padding-right: var(--parent-pad);
}

@media (max-width: 640px) {
  header {
    --parent-pad: 1rem; /* 16px */
  }
}
</style>
