<script setup lang="ts">
import { Home, User } from 'lucide-vue-next'

interface Props {
  isPrivate: boolean
}

defineProps<Props>()
const emit = defineEmits(['select'])
</script>

<template>
  <div class="grid gap-3" role="listbox" aria-label="Opções de escopo">
    <!-- Casa -->
    <button
      @click="emit('select', false)"
      role="option"
      :aria-selected="!isPrivate"
      class="group w-full flex items-center gap-3 p-4 rounded-card bg-parchment hover:bg-stone transition-all text-left border border-transparent cursor-pointer"
      :class="{ '!border-midnight bg-white shadow-subtle': !isPrivate }"
    >
      <div class="w-10 h-10 rounded-full bg-white shadow-subtle text-graphite flex items-center justify-center shrink-0 border border-stone/10">
        <Home class="w-5 h-5 text-midnight" aria-hidden="true" />
      </div>
      <div class="min-w-0">
        <strong class="block text-[15px] font-bold text-charcoal tracking-tight">Para a Casa</strong>
        <span class="text-xs text-graphite font-semibold">Gasto compartilhado com a moradia</span>
      </div>
    </button>

    <!-- Pessoal -->
    <button
      @click="emit('select', true)"
      role="option"
      :aria-selected="isPrivate"
      class="group w-full flex items-center gap-3 p-4 rounded-card bg-parchment hover:bg-stone transition-all text-left border border-transparent cursor-pointer"
      :class="{ '!border-ember bg-white shadow-subtle': isPrivate }"
    >
      <div class="w-10 h-10 rounded-full bg-white shadow-subtle text-graphite flex items-center justify-center shrink-0 border border-stone/10">
        <User class="w-5 h-5 text-ember" aria-hidden="true" />
      </div>
      <div class="min-w-0">
        <strong class="block text-[15px] font-bold text-charcoal tracking-tight">Pessoal</strong>
        <span class="text-xs text-graphite font-semibold">Gasto privado individual ou com externos</span>
      </div>
    </button>
  </div>
</template>
