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
  <nav class="fixed bottom-0 left-0 right-0 z-30 bg-card shadow-[0_-1px_0_var(--color-stone)] pb-safe">
    <div class="flex items-center justify-around h-16">
      <template v-for="(tab, index) in tabs" :key="tab.id">
        <!-- Divisor/Espaço para o FAB no centro -->
        <div v-if="index === 1" class="w-24" aria-hidden="true" />
        
        <button
          @click="emit('update:modelValue', tab.id)"
          class="flex-1 flex flex-col items-center justify-center h-full relative group outline-none"
          :class="modelValue === tab.id ? 'text-ember' : 'text-ash hover:text-graphite'"
        >
          <div 
            class="flex flex-col items-center justify-center gap-1 transition-transform duration-500 ease-[cubic-bezier(0.19,1,0.22,1)]"
            :class="modelValue === tab.id ? '-translate-y-0.5' : 'translate-y-0 group-active:scale-95'"
          >
            <component 
              :is="tab.icon" 
              class="w-6 h-6 transition-all duration-500 ease-[cubic-bezier(0.19,1,0.22,1)]"
              :class="modelValue === tab.id ? 'stroke-[2.5px]' : 'stroke-[1.5px]'"
            />
            <span 
              class="text-[11px] font-medium tracking-tight transition-all duration-500"
            >
              {{ tab.label }}
            </span>
          </div>
          
          <!-- Active Indicator Line -->
          <div 
            class="absolute bottom-0 w-8 h-1 rounded-t-full bg-ember transition-transform duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] origin-bottom"
            :class="modelValue === tab.id ? 'scale-y-100' : 'scale-y-0'"
          />
        </button>
      </template>
    </div>
  </nav>
</template>
