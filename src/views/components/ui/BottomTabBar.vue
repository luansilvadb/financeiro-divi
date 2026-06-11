<!-- src/views/components/ui/BottomTabBar.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Building2, Calendar, CreditCard, User, Plus } from 'lucide-vue-next'
import MembroAvatar from './MembroAvatar.vue'

export type Tab = 'casas' | 'hoje' | 'faturas' | 'perfil'

const props = defineProps<{ 
  modelValue: Tab
  isMonthClosed?: boolean
}>()

const emit = defineEmits<{ 
  (e: 'update:modelValue', tab: Tab): void 
  (e: 'click-fab'): void
}>()

const tabs = [
  { id: 'casas', label: 'Casas', icon: Building2 },
  { id: 'hoje', label: 'Hoje', icon: Calendar },
  { id: 'faturas', label: 'Faturas', icon: CreditCard },
  { id: 'perfil', label: 'Perfil', icon: User },
] as const

const userName = ref('Perfil')

onMounted(() => {
  userName.value = localStorage.getItem('divi_username') || 'Perfil'
})
</script>

<template>
  <div class="fixed bottom-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-2xl border-t border-stone/40 pb-safe shadow-[0_-8px_30px_rgba(0,0,0,0.02)] pointer-events-auto">
    <nav class="max-w-[75rem] mx-auto w-full h-16 sm:h-18 flex items-center px-4 sm:px-8">
      <!-- Lado Esquerdo: Casas e Hoje -->
      <div class="flex-1 flex justify-around h-full">
        <button
          v-for="tab in tabs.slice(0, 2)"
          :key="tab.id"
          @click="emit('update:modelValue', tab.id)"
          class="flex-1 max-w-[80px] flex flex-col items-center justify-center h-full relative group outline-none cursor-pointer border-none bg-transparent rounded-xl transition-colors duration-300"
          :class="[
            modelValue === tab.id ? 'text-ember font-semibold' : 'text-graphite/50 hover:text-charcoal'
          ]"
        >
          <!-- Circular Highlight Background -->
          <div
            class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-ember/5 transition-all duration-300 ease-spring"
            :class="modelValue === tab.id ? 'scale-100 opacity-100' : 'scale-75 opacity-0'"
          />
          <div class="relative flex flex-col items-center justify-center gap-1 transition-transform duration-300 group-active:scale-95">
            <component 
              :is="tab.icon" 
              class="w-5 h-5 transition-all duration-300"
              :class="modelValue === tab.id ? 'stroke-[2.2px] drop-shadow-[0_1px_4px_rgba(255,62,0,0.15)]' : 'stroke-[1.8px]'"
            />
            <span class="text-[8.5px] sm:text-[9px] font-bold uppercase tracking-[0.05em] leading-none text-center">
              {{ tab.label }}
            </span>
          </div>
        </button>
      </div>

      <!-- Centro: FAB (Botão de Adicionar) -->
      <div class="flex justify-center items-center px-4 shrink-0">
        <button
          @click="emit('click-fab')"
          :disabled="isMonthClosed"
          class="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-ember text-white flex items-center justify-center border-none transition-all duration-300 shadow-[0_4px_16px_rgba(255,62,0,0.3)] hover:bg-ember/90 hover:scale-105 active:scale-90 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed cursor-pointer group"
          aria-label="Novo lançamento"
          data-testid="novo-lancamento-fab"
        >
          <Plus class="w-5 h-5 stroke-[3px] group-hover:rotate-90 transition-transform duration-300" />
        </button>
      </div>

      <!-- Lado Direito: Faturas e Perfil -->
      <div class="flex-1 flex justify-around h-full">
        <button
          v-for="tab in tabs.slice(2, 4)"
          :key="tab.id"
          @click="emit('update:modelValue', tab.id)"
          class="flex-1 max-w-[80px] flex flex-col items-center justify-center h-full relative group outline-none cursor-pointer border-none bg-transparent rounded-xl transition-colors duration-300"
          :class="[
            modelValue === tab.id ? 'text-ember font-semibold' : 'text-graphite/50 hover:text-charcoal'
          ]"
        >
          <!-- Circular Highlight Background -->
          <div
            class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-ember/5 transition-all duration-300 ease-spring"
            :class="modelValue === tab.id ? 'scale-100 opacity-100' : 'scale-75 opacity-0'"
          />
          <div class="relative flex flex-col items-center justify-center gap-1 transition-transform duration-300 group-active:scale-95">
            <MembroAvatar
              v-if="tab.id === 'perfil'"
              :nome="userName"
              size="xs"
              variant="ember"
              class="!border-none !shadow-none transition-all duration-300"
              :class="modelValue === 'perfil' ? 'scale-110' : 'grayscale opacity-50 contrast-75 group-hover:grayscale-0 group-hover:opacity-100'"
            />
            <component 
              v-else
              :is="tab.icon" 
              class="w-5 h-5 transition-all duration-300"
              :class="modelValue === tab.id ? 'stroke-[2.2px] drop-shadow-[0_1px_4px_rgba(255,62,0,0.15)]' : 'stroke-[1.8px]'"
            />
            <span class="text-[8.5px] sm:text-[9px] font-bold uppercase tracking-[0.05em] leading-none text-center">
              {{ tab.label }}
            </span>
          </div>
        </button>
      </div>
    </nav>
  </div>
</template>
