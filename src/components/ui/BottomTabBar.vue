<!-- src/components/ui/BottomTabBar.vue -->
<script setup lang="ts">
export type Tab = 'hoje' | 'faturas' | 'historico'

const props = defineProps<{ modelValue: Tab }>()
const emit = defineEmits<{ (e: 'update:modelValue', tab: Tab): void }>()

const tabs: { id: Tab; label: string; icon: string }[] = [
  { id: 'hoje', label: 'Hoje', icon: '🏠' },
  { id: 'faturas', label: 'Faturas', icon: '💳' },
  { id: 'historico', label: 'Histórico', icon: '📋' },
]
</script>

<template>
  <nav
    class="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card border-t border-stone-surface pb-safe"
    aria-label="Navegação principal"
  >
    <div class="flex">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        @click="emit('update:modelValue', tab.id)"
        :aria-current="modelValue === tab.id ? 'page' : undefined"
        class="flex-1 flex flex-col items-center gap-1 py-2.5 min-h-[56px] transition-colors"
        :class="modelValue === tab.id ? 'text-ember' : 'text-ash'"
      >
        <span class="text-xl leading-none" aria-hidden="true">{{ tab.icon }}</span>
        <span class="text-[10px] font-semibold">{{ tab.label }}</span>
        <span
          v-if="modelValue === tab.id"
          class="w-1 h-1 rounded-full bg-ember"
          aria-hidden="true"
        />
      </button>
    </div>
  </nav>
</template>
