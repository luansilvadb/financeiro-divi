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
  --skeleton-default-soft: rgb(73 87 80 / 8%);
  --skeleton-default-base: rgb(73 87 80 / 13%);
  --skeleton-default-strong: rgb(73 87 80 / 20%);
  --skeleton-default-highlight: rgb(255 255 255 / 48%);
}

.skeleton-block::after {
  position: absolute;
  inset: 0;
  content: '';
  background: linear-gradient(
    100deg,
    transparent 14%,
    var(--skeleton-highlight, var(--skeleton-default-highlight)) 48%,
    transparent 82%
  );
  transform: translate3d(-110%, 0, 0);
  animation: skeleton-shimmer var(--skeleton-duration, 1.8s)
    var(--skeleton-ease, cubic-bezier(0.4, 0, 0.2, 1)) var(--skeleton-delay) infinite;
  will-change: transform;
}

.skeleton-block--text {
  border-radius: var(--skeleton-radius, 0.375rem);
}

.skeleton-block--circle {
  border-radius: var(--skeleton-radius, 9999px);
}

.skeleton-block--soft {
  --skeleton-fill: var(--skeleton-soft, var(--skeleton-default-soft));
}

.skeleton-block--base {
  --skeleton-fill: var(--skeleton-base, var(--skeleton-default-base));
}

.skeleton-block--strong {
  --skeleton-fill: var(--skeleton-strong, var(--skeleton-default-strong));
}

:global(.dark) .skeleton-block {
  --skeleton-default-soft: rgb(255 255 255 / 6%);
  --skeleton-default-base: rgb(255 255 255 / 10%);
  --skeleton-default-strong: rgb(255 255 255 / 16%);
  --skeleton-default-highlight: rgb(255 255 255 / 12%);
}

@keyframes skeleton-shimmer {
  to {
    transform: translate3d(110%, 0, 0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .skeleton-block::after {
    animation: none;
    transform: none;
    will-change: auto;
  }
}
</style>
