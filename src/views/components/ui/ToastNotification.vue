<script setup lang="ts">
import { useToast } from '../../../composables/useToast'
import { X } from 'lucide-vue-next'

const { visible, message, hide } = useToast()
</script>

<template>
  <Transition name="toast-slide">
    <div 
      v-if="visible" 
      class="fixed top-5 left-1/2 z-[9999] w-[90%] max-w-[420px] bg-white/85 backdrop-blur-md border border-rose-500/20 rounded-xl p-3 flex items-center gap-3 shadow-[0_10px_30px_-10px_rgba(225,29,72,0.15),0_1px_3px_0_rgba(0,0,0,0.05)] pointer-events-auto custom-toast"
      role="alert"
    >
      <!-- Ícone Shield Alert com Degradê Vermelho/Laranja -->
      <div class="flex items-center justify-center w-8 h-8 rounded-lg shrink-0 bg-rose-500/10">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="url(#toast-gradient-red-orange)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-[18px] h-[18px] animate-pulse">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      </div>

      <div class="flex-1 text-xs md:text-sm font-semibold text-slate-800 leading-relaxed">
        {{ message }}
      </div>

      <button 
        @click="hide" 
        class="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
        aria-label="Fechar notificação"
      >
        <X class="w-4 h-4" />
      </button>

      <!-- Definição global do gradiente para o SVG de ícone -->
      <svg width="0" height="0" class="absolute">
        <defs>
          <linearGradient id="toast-gradient-red-orange" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#e11d48" />
            <stop offset="100%" stop-color="#f59e0b" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  </Transition>
</template>

<style scoped>
.custom-toast {
  translate: -50% 0;
}
.toast-slide-enter-active {
  transition: translate 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.3s ease;
}
.toast-slide-leave-active {
  transition: translate 0.3s ease, opacity 0.3s ease;
}
.toast-slide-enter-from {
  translate: -50% -120px;
  opacity: 0;
}
.toast-slide-leave-to {
  translate: -50% -120px;
  opacity: 0;
}
</style>
