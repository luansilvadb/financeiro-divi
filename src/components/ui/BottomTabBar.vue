<!-- src/components/ui/BottomTabBar.vue -->
<script setup lang="ts">
export type Tab = 'hoje' | 'faturas' // Removido 'historico'

const props = defineProps<{ modelValue: Tab }>()
const emit = defineEmits<{ (e: 'update:modelValue', tab: Tab): void }>()

const tabs: { id: Tab; label: string; icon: string }[] = [
  { id: 'hoje', label: 'Hoje', icon: '🏠' },
  // Espaço central será ocupado pelo FAB no App.vue
  { id: 'faturas', label: 'Faturas', icon: '💳' },
]
</script>

<template>
  <nav class="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card border-t border-stone pb-safe">
    <div class="flex items-center justify-around h-16">
      <template v-for="(tab, index) in tabs" :key="tab.id">
        <!-- Divisor/Espaço para o FAB no centro -->
        <div v-if="index === 1" class="w-20" aria-hidden="true" />
        
        <button
          @click="emit('update:modelValue', tab.id)"
          class="flex-1 flex flex-col items-center gap-1 py-1 transition-colors"
          :class="modelValue === tab.id ? 'text-ember' : 'text-ash'"
        >
          <span class="text-xl">{{ tab.icon }}</span>
          <span class="text-[10px] font-bold uppercase tracking-wider">{{ tab.label }}</span>
        </button>
      </template>
    </div>
  </nav>
</template>
