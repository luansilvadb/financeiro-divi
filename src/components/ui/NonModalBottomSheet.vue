<script setup lang="ts">
// Componente reutilizável de BottomSheet Não Modal
interface Props {
  visible: boolean
  widthClass?: string // default: md:w-[480px]
  maxHeightClass?: string // default: max-h-[85vh]
}

withDefaults(defineProps<Props>(), {
  widthClass: 'md:w-[480px]',
  maxHeightClass: 'max-h-[85vh]'
})
</script>

<template>
  <transition
    enter-active-class="transition duration-300 ease-out"
    enter-from-class="opacity-0 translate-y-full md:translate-y-4 md:scale-95"
    enter-to-class="opacity-100 translate-y-0 md:scale-100"
    leave-active-class="transition duration-200 ease-in"
    leave-from-class="opacity-100 translate-y-0 md:scale-100"
    leave-to-class="opacity-0 translate-y-full md:translate-y-4 md:scale-95"
  >
    <div 
      v-if="visible" 
      class="fixed bottom-0 left-0 right-0 md:left-auto md:right-8 md:bottom-8 z-[9999] p-0 pointer-events-auto"
    >
      <!-- Container do BottomSheet Não Modal -->
      <div 
        class="w-full overflow-hidden bg-card border-t md:border border-stone-surface rounded-t-cardsLarge md:rounded-cards shadow-2xl flex flex-col text-graphite"
        :class="[widthClass, maxHeightClass]"
      >
        <!-- Grabber para deslizar no Mobile -->
        <div class="md:hidden w-12 h-1 bg-stone-surface rounded-full mx-auto my-3 shrink-0"></div>
        
        <slot />
      </div>
    </div>
  </transition>
</template>
