<template>
  <section class="relative bg-midnight text-white py-16 md:py-24 overflow-hidden rounded-card-lg my-12">
    <!-- Texture layer -->
    <div class="absolute inset-0 pointer-events-none opacity-[0.03]" aria-hidden="true" style="background-image: radial-gradient(var(--color-stone) 1px, transparent 0); background-size: 16px 16px;"></div>
    
    <div class="relative max-w-2xl mx-auto px-6 z-10">
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
/**
 * InvertedSection.vue
 * A high-contrast section with near-black (midnight) background and light text.
 */
</script>
