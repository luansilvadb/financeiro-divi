<script setup lang="ts">
import { CheckCircle2, ChevronDown, Home, Settings } from 'lucide-vue-next'
import IllustrationMascot from '../../ui/IllustrationMascot.vue'

defineProps<{
  currentYear: string | number
  currentMonthName: string
  faturaSelecionadaFechada: boolean
  isAuthed: boolean
  activeTenantObj: any
}>()

const emit = defineEmits<{
  (e: 'openHistorico'): void
  (e: 'openCasas'): void
  (e: 'openSettings'): void
}>()
</script>

<template>
  <header class="flex items-center justify-between pb-6 pt-3 mb-8 border-b border-stone/50">
    <!-- Coluna Esquerda: Mês Selector -->
    <div class="flex-1">
      <div 
        class="flex flex-col cursor-pointer group inline-block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember focus-visible:ring-offset-2 rounded-md p-1 -ml-1 transition-all"
        role="button"
        tabindex="0"
        aria-haspopup="dialog"
        aria-label="Selecionar período"
        @click="$emit('openHistorico')"
        @keydown.enter.prevent="$emit('openHistorico')"
        @keydown.space.prevent="$emit('openHistorico')"
      >
        <span class="text-[8px] font-black text-ash uppercase tracking-[0.2em] mb-1 flex items-center gap-1 group-hover:text-ember transition-colors">
          {{ currentYear }}
          <ChevronDown class="w-3 h-3 text-ash group-hover:text-ember transition-colors" />
        </span>
        <div class="flex items-center gap-2">
          <span class="text-2xl font-black text-charcoal tracking-tighter group-hover:text-ember transition-colors">{{ currentMonthName }}</span>
          <CheckCircle2 v-if="faturaSelecionadaFechada" class="w-4 h-4 text-meadow animate-in zoom-in-50 duration-300" />
        </div>
      </div>
    </div>

    <!-- Coluna Central: Brand -->
    <div class="flex-1 flex flex-col items-center justify-center text-center relative">
      <!-- Mascote do Header (Wobble) -->
      <div class="absolute -top-4 -right-1 transform rotate-12 animate-wobble z-0 opacity-80 pointer-events-none">
        <IllustrationMascot variant="ember" :size="32" mood="happy" />
      </div>
      <div 
        v-if="isAuthed && activeTenantObj"
        class="cursor-pointer flex items-center justify-center gap-1 text-[9px] font-bold text-ember uppercase tracking-[0.15em] mb-1.5 relative z-10 hover:opacity-85"
        @click="$emit('openCasas')"
      >
        <Home class="w-3.5 h-3.5 text-ember" />
        <span>{{ activeTenantObj.name }}</span>
        <ChevronDown class="w-3 h-3 text-ember" />
      </div>
      <span v-else class="text-[7px] font-bold text-ash/60 uppercase tracking-[0.3em] block leading-none mb-1.5 relative z-10">Finanças Residenciais</span>
      <h1 class="text-3xl font-black text-charcoal tracking-[-0.05em] leading-none relative z-10">
        DIVI<span class="text-ember">.</span>
      </h1>
    </div>

    <!-- Coluna Direita: Ações (Settings) -->
    <div class="flex-1 flex justify-end">
      <button 
        @click="$emit('openSettings')" 
        class="w-11 h-11 bg-transparent hover:bg-transparent border-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ember focus-visible:ring-offset-2 rounded-xl flex items-center justify-center transition-all group cursor-pointer"
        aria-label="Configurações"
        title="Configurações"
      >
        <Settings class="w-6 h-6 text-ash group-hover:text-ember transition-colors duration-200" />
      </button>
    </div>
  </header>
</template>
