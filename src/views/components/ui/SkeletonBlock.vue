<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  shape?: 'text' | 'rect' | 'circle'
  tone?: 'soft' | 'base' | 'strong'
  width?: string
  height?: string
  radius?: string
  delay?: string
}

const props = withDefaults(defineProps<Props>(), {
  shape: 'rect',
  tone: 'base',
  width: '100%',
  height: '1rem',
  radius: undefined,
  delay: '0ms'
})

const blockStyle = computed(() => ({
  '--skeleton-width': props.width,
  '--skeleton-height': props.height,
  '--skeleton-radius': props.radius,
  '--skeleton-delay': props.delay
}))
</script>

<template>
  <span
    :class="[
      'skeleton-block',
      `skeleton-block--${props.shape}`,
      `skeleton-block--${props.tone}`
    ]"
    :style="blockStyle"
    aria-hidden="true"
    data-testid="skeleton-block"
  />
</template>

<style scoped>
.skeleton-block {
  position: relative;
  display: block;
  width: var(--skeleton-width);
  height: var(--skeleton-height);
  overflow: hidden;
  border-radius: var(--skeleton-radius, 0.75rem);
  background: var(--skeleton-base, rgba(242, 240, 237, 0.88));
}

.skeleton-block::after {
  position: absolute;
  inset: 0;
  content: "";
  background: linear-gradient(
    100deg,
    transparent 18%,
    var(--skeleton-highlight, rgba(255, 255, 255, 0.72)) 48%,
    transparent 78%
  );
  transform: translate3d(-110%, 0, 0);
  animation: skeleton-shimmer var(--skeleton-duration, 1.8s)
    var(--skeleton-ease, cubic-bezier(0.4, 0, 0.2, 1))
    var(--skeleton-delay)
    infinite;
  will-change: transform;
}

.skeleton-block--text {
  border-radius: var(--skeleton-radius, 0.375rem);
}

.skeleton-block--circle {
  border-radius: var(--skeleton-radius, 9999px);
}

.skeleton-block--soft {
  background: var(--skeleton-soft, rgba(242, 240, 237, 0.56));
}

.skeleton-block--strong {
  background: var(--skeleton-strong, rgba(226, 223, 219, 0.96));
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
    opacity: 0.35;
  }
}
</style>
