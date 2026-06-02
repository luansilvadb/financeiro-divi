<script setup lang="ts">
import { useToast } from '../../../composables/useToast'
import { X } from 'lucide-vue-next'

const { visible, message, hide } = useToast()
</script>

<template>
  <Transition name="toast-slide">
    <div 
      v-if="visible" 
      class="fixed top-5 left-1/2 z-[9999] w-[90%] max-w-[420px] bg-card border-none rounded-card-lg p-4 flex items-center gap-4 shadow-lg pointer-events-auto custom-toast"
      role="alert"
    >
      <!-- Borda Inset Simulatada para profundidade tátil -->
      <div class="absolute inset-0 rounded-card-lg shadow-subtle pointer-events-none"></div>

      <!-- Ícone Alerta Sólido (Ember) -->
      <div class="flex items-center justify-center w-10 h-10 rounded-xl shrink-0 bg-ember/10">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5 text-ember animate-in zoom-in-50 duration-500">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      </div>

      <div class="flex-1 text-sm font-bold text-charcoal leading-tight tracking-tight">
        {{ message }}
      </div>

      <button 
        @click="hide" 
        class="w-8 h-8 rounded-full flex items-center justify-center text-ash hover:text-charcoal hover:bg-stone transition-all cursor-pointer border-none bg-transparent"
        aria-label="Fechar notificação"
      >
        <X class="w-4 h-4" />
      </button>
    </div>
  </Transition>
</template>

<style scoped>
.custom-toast {
  translate: -50% 0;
}
.toast-slide-enter-active {
  transition: all 0.5s var(--ease-spring);
}
.toast-slide-leave-active {
  transition: all 0.3s ease;
}
.toast-slide-enter-from {
  translate: -50% -120px;
  opacity: 0;
  scale: 0.9;
}
.toast-slide-leave-to {
  translate: -50% -120px;
  opacity: 0;
}
</style>
