<!-- src/components/ui/BottomTabBar.vue -->
<script setup lang="ts">
import { Home, CreditCard } from 'lucide-vue-next'

export type Tab = 'hoje' | 'faturas'

const props = defineProps<{ modelValue: Tab }>()
const emit = defineEmits<{ (e: 'update:modelValue', tab: Tab): void }>()

const tabs = [
  { id: 'hoje', label: 'Hoje', icon: Home },
  // Espaço central será ocupado pelo FAB no App.vue
  { id: 'faturas', label: 'Faturas', icon: CreditCard },
] as const
</script>

<template>
  <div class="fixed bottom-6 left-0 right-0 z-40 flex justify-center px-4 pointer-events-none">
    <nav class="relative w-full max-w-[420px] pointer-events-auto nav-stable">
      <!-- Floating Island Background -->
      <div class="absolute inset-0 bg-white/70 backdrop-blur-2xl border border-stone/50 shadow-[0_8px_32px_rgba(0,0,0,0.08)] rounded-pill pointer-events-none">
        <!-- Subtle Inner Highlight for Premium Depth -->
        <div class="absolute inset-0 rounded-pill ring-1 ring-white/40 ring-inset shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)]" />
      </div>
      
      <div class="relative flex items-center justify-around h-16 sm:h-18 px-4">
        <template v-for="(tab, index) in tabs" :key="tab.id">
          <!-- Espaço central para o FAB flutuar acima ou dentro do ritmo visual -->
          <div v-if="index === 1" class="w-20" aria-hidden="true" />
          
          <button
            @click="emit('update:modelValue', tab.id)"
            class="flex-1 flex flex-col items-center justify-center h-full relative group outline-none cursor-pointer border-none bg-transparent rounded-pill transition-colors duration-500"
            :class="modelValue === tab.id ? 'text-ember' : 'text-graphite/50 hover:text-charcoal'"
          >
            <!-- Pill Highlight Background -->
            <div
              class="absolute inset-1 rounded-full bg-ember/5 transition-all duration-500 ease-spring"
              :class="modelValue === tab.id ? 'scale-100 opacity-100' : 'scale-75 opacity-0'"
            />

            <div 
              class="relative flex flex-col items-center justify-center gap-1.5 transition-all duration-500 ease-spring"
              :class="modelValue === tab.id ? '-translate-y-0.5 scale-105' : 'translate-y-0 group-active:scale-90'"
            >
              <component 
                :is="tab.icon" 
                class="w-5.5 h-5.5 transition-all duration-500 ease-spring"
                :class="modelValue === tab.id ? 'stroke-[2.5px] drop-shadow-[0_2px_8px_rgba(255,62,0,0.2)]' : 'stroke-[1.8px]'"
              />
              <span 
                class="text-[9px] font-bold uppercase tracking-[0.15em] transition-all duration-500 leading-none"
              >
                {{ tab.label }}
              </span>
            </div>
            
          </button>
        </template>
      </div>
    </nav>
  </div>
</template>

<style scoped>
.nav-stable {
  backface-visibility: hidden;
  transform: translateZ(0);
  will-change: transform;
}
</style>
