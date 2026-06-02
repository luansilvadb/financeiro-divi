<script setup lang="ts">
import { computed } from 'vue'

type SkeletonShape = 'text' | 'rect' | 'circle'
type SkeletonTone = 'soft' | 'base' | 'strong'

const props = withDefaults(
  defineProps<{
    shape?: SkeletonShape
    tone?: SkeletonTone
    width?: string
    height?: string
    radius?: string
    delay?: string
  }>(),
  {
    shape: 'rect',
    tone: 'base',
    width: '100%',
    height: '1rem',
    radius: undefined,
    delay: '0ms'
  }
)

const blockStyle = computed(() => ({
  '--skeleton-width': props.width,
  '--skeleton-height': props.height,
  '--skeleton-radius': props.radius,
  '--skeleton-delay': props.delay
}))
</script>

<template>
  <span
    data-testid="skeleton-block"
    aria-hidden="true"
    class="skeleton-block"
    :class="[`skeleton-block--${shape}`, `skeleton-block--${tone}`]"
    :style="blockStyle"
  />
</template>

<style scoped>
.skeleton-block {
  position: relative;
  display: block;
  width: var(--skeleton-width);
  height: var(--skeleton-height);
  overflow: hidden;
  background: var(--skeleton-fill);
  border-radius: var(--skeleton-radius, 0.625rem);
  contain: paint;
}

.skeleton-block::after {
  position: absolute;
  inset: 0;
  content: '';
  background: linear-gradient(
    100deg,
    transparent 14%,
    var(--skeleton-highlight, rgb(255 255 255 / 48%)) 48%,
    transparent 82%
  );
  transform: translate3d(-110%, 0, 0);
  animation: skeleton-shimmer 1.8s cubic-bezier(0.16, 1, 0.3, 1) var(--skeleton-delay) infinite;
  will-change: transform;
}

.skeleton-block--text {
  border-radius: var(--skeleton-radius, 0.375rem);
}

.skeleton-block--circle {
  border-radius: var(--skeleton-radius, 9999px);
}

.skeleton-block--soft {
  --skeleton-fill: rgb(73 87 80 / 8%);
}

.skeleton-block--base {
  --skeleton-fill: rgb(73 87 80 / 13%);
}

.skeleton-block--strong {
  --skeleton-fill: rgb(73 87 80 / 20%);
}

:global(.dark) .skeleton-block {
  --skeleton-highlight: rgb(255 255 255 / 12%);
}

:global(.dark) .skeleton-block--soft {
  --skeleton-fill: rgb(255 255 255 / 6%);
}

:global(.dark) .skeleton-block--base {
  --skeleton-fill: rgb(255 255 255 / 10%);
}

:global(.dark) .skeleton-block--strong {
  --skeleton-fill: rgb(255 255 255 / 16%);
}

@keyframes skeleton-shimmer {
  to {
    transform: translate3d(110%, 0, 0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .skeleton-block::after {
    animation: none;
    transform: translate3d(0, 0, 0);
  }
}
</style>
