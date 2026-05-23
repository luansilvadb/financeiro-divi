<template>
  <div :style="{ width: size + 'px', height: size + 'px' }" class="relative select-none pointer-events-none">
    <svg viewBox="0 0 100 100" class="w-full h-full overflow-visible">
      <!-- Body Shadow (subtle depth) -->
      <path
        :d="blobPath"
        fill="black"
        fill-opacity="0.05"
        transform="translate(2, 3)"
      />
      <!-- Blob Body -->
      <path
        :d="blobPath"
        :fill="fillColor"
      />
      
      <!-- Eyes -->
      <g class="eyes">
        <template v-if="mood === 'happy'">
          <circle cx="38" cy="42" r="3" fill="black" />
          <circle cx="62" cy="42" r="3" fill="black" />
        </template>
        <template v-else-if="mood === 'chill'">
          <line x1="34" y1="44" x2="42" y2="44" stroke="black" stroke-width="2.5" stroke-linecap="round" />
          <line x1="58" y1="44" x2="66" y2="44" stroke="black" stroke-width="2.5" stroke-linecap="round" />
        </template>
        <template v-else-if="mood === 'surprised'">
          <circle cx="38" cy="42" r="4" fill="white" stroke="black" stroke-width="1.5" />
          <circle cx="62" cy="42" r="4" fill="white" stroke="black" stroke-width="1.5" />
          <circle cx="38" cy="42" r="1.5" fill="black" />
          <circle cx="62" cy="42" r="1.5" fill="black" />
        </template>
      </g>

      <!-- Mouth -->
      <g class="mouth">
        <path v-if="mood === 'happy'" d="M42 62 Q50 70 58 62" stroke="black" stroke-width="2.5" fill="none" stroke-linecap="round" />
        <line v-else-if="mood === 'chill'" x1="45" y1="64" x2="55" y2="64" stroke="black" stroke-width="2" stroke-linecap="round" />
        <circle v-else-if="mood === 'surprised'" cx="50" cy="65" r="3" fill="black" />
      </g>

      <!-- Stick limbs (optional, but requested in DESIGN.md) -->
      <g class="limbs" stroke="black" stroke-width="2" stroke-linecap="round" fill="none">
        <!-- Legs -->
        <path d="M35 78 L32 90" />
        <path d="M65 78 L68 90" />
        <!-- Arms (waving if happy) -->
        <path v-if="mood === 'happy'" d="M22 55 Q10 50 8 40" />
        <path v-if="mood === 'happy'" d="M78 55 Q90 60 92 70" />
      </g>
    </svg>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps({
  variant: {
    type: String,
    default: 'ember',
    validator: (v: string) => ['ember', 'meadow', 'sky', 'sunburst', 'flamingo'].includes(v)
  },
  size: {
    type: Number,
    default: 100
  },
  mood: {
    type: String,
    default: 'happy',
    validator: (v: string) => ['happy', 'chill', 'surprised'].includes(v)
  }
});

const fillColor = computed(() => {
  const colors: Record<string, string> = {
    ember: '#ff3e00',
    meadow: '#00ca48',
    sky: '#0090ff',
    sunburst: '#ffbb26',
    flamingo: '#ff58ae'
  };
  return colors[props.variant] || colors.ember;
});

// A slightly irregular, organic blob shape
const blobPath = "M20,50 Q20,15 50,20 Q80,25 85,55 Q90,85 50,80 Q10,75 15,50 Z";
</script>
