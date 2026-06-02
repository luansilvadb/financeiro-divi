<script setup lang="ts">
interface Props {
  nome: string
  variant?: 'ember' | 'meadow' | 'sky' | 'sunburst' | 'flamingo'
  size?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'ember',
  size: 'md'
})

const sizeClasses = {
  sm: 'w-8 h-8 text-[10px]',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base'
}

const variantColors = {
  ember: 'bg-ember/10 text-ember border-ember/20',
  meadow: 'bg-[#00a83d]/10 text-[#00a83d] border-[#00a83d]/20',
  sky: 'bg-sky/10 text-sky border-sky/20',
  sunburst: 'bg-sunburst/10 text-sunburst border-sunburst/20',
  flamingo: 'bg-flamingo/10 text-flamingo border-flamingo/20'
}

// Map index or ID to a variant consistently if needed, 
// but here we'll just use the variant prop
</script>

<template>
  <div 
    :class="[
      'relative flex items-center justify-center font-bold rounded-xl border transition-all duration-500 shadow-subtle group-hover:scale-110 group-hover:rotate-3',
      sizeClasses[size],
      variantColors[variant]
    ]"
    aria-hidden="true"
  >
    <!-- Organic Blob Background Shape (CSS) -->
    <div class="absolute inset-0 bg-current opacity-[0.03] rounded-[40%_60%_70%_30%_/_40%_50%_60%_50%] animate-pulse" />
    
    <span class="relative z-10 uppercase tracking-tighter">{{ nome[0] }}</span>
  </div>
</template>

<style scoped>
@keyframes blob-morph {
  0%, 100% { border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%; }
  50% { border-radius: 60% 40% 30% 70% / 50% 60% 40% 60%; }
}

div {
  animation: blob-morph 8s ease-in-out infinite;
}
</style>
