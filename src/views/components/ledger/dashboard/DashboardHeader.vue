<script setup lang="ts">
import { CheckCircle2, ChevronDown, Home, User } from 'lucide-vue-next'
import IllustrationMascot from '../../ui/IllustrationMascot.vue'
import MembroAvatar from '../../ui/MembroAvatar.vue'
import { useMembros } from '../../../../viewmodels/useMembros'

defineProps<{
  currentYear: string | number
  currentMonthName: string
  faturaSelecionadaFechada: boolean
  isAuthed: boolean
  activeTenantObj: any
}>()

defineEmits<{
  (e: 'openHistorico'): void
  (e: 'openCasas'): void
  (e: 'openSettings'): void
}>()

const { currentMembro } = useMembros()
</script>

<template>
  <header class="flex items-center justify-between pb-6 pt-3 mb-8 border-b border-stone/50">
    <!-- Coluna Esquerda: Mês Selector -->
    <div class="flex-1">
      <button 
        class="flex flex-col text-left group bg-transparent border-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember focus-visible:ring-offset-4 rounded-lg p-1 -ml-1 transition-all cursor-pointer"
        aria-haspopup="dialog"
        aria-label="Selecionar período"
        @click="$emit('openHistorico')"
      >
        <span class="text-[10px] font-semibold text-graphite uppercase tracking-[0.15em] mb-1 flex items-center gap-1 group-hover:text-ember transition-colors">
          {{ currentYear }}
          <ChevronDown class="w-3 h-3 text-ash group-hover:text-ember transition-colors" aria-hidden="true" />
        </span>
        <div class="flex items-center gap-2">
          <span class="text-2xl font-bold text-charcoal tracking-tighter group-hover:text-ember transition-colors">{{ currentMonthName }}</span>
          <CheckCircle2 v-if="faturaSelecionadaFechada" class="w-4 h-4 text-[#00a83d] animate-in zoom-in-50 duration-300" aria-label="Mês encerrado" />
        </div>
      </button>
    </div>

    <!-- Coluna Central: Brand -->
    <div class="flex-1 flex flex-col items-center justify-center text-center relative">
      <!-- Mascote do Header (Wobble) -->
      <div class="absolute -top-4 -right-1 transform rotate-12 animate-wobble z-0 opacity-80 pointer-events-none" aria-hidden="true">
        <IllustrationMascot variant="ember" :size="32" mood="happy" />
      </div>

      <button 
        v-if="isAuthed && activeTenantObj"
        class="bg-transparent border-none cursor-pointer flex flex-col items-center justify-center group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember rounded-xl p-1 -m-1 transition-all"
        aria-label="Gerenciar casas"
        @click="$emit('openCasas')"
      >
        <div class="flex items-center justify-center gap-1 text-[10px] font-bold text-ember uppercase tracking-[0.15em] mb-1.5 relative z-10 group-hover:opacity-80 transition-opacity">
          <Home class="w-3.5 h-3.5 text-ember" aria-hidden="true" />
          <span>{{ activeTenantObj.name }}</span>
          <ChevronDown class="w-3 h-3 text-ember" aria-hidden="true" />
        </div>
        <h1 class="text-3xl font-bold text-charcoal tracking-[-0.05em] leading-none relative z-10 group-hover:scale-[0.98] transition-transform">
          DIVI<span class="text-ember">.</span>
        </h1>
      </button>

      <template v-else>
        <span class="text-[8px] font-semibold text-ash/80 uppercase tracking-[0.25em] block leading-none mb-1.5 relative z-10">Finanças Residenciais</span>
        <h1 class="text-3xl font-bold text-charcoal tracking-[-0.05em] leading-none relative z-10">
          DIVI<span class="text-ember">.</span>
        </h1>
      </template>
    </div>

    <!-- Coluna Direita: Ações (Settings) -->
    <div class="flex-1 flex justify-end">
      <button 
        @click="$emit('openSettings')" 
        class="w-11 h-11 bg-transparent hover:bg-stone/50 border-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ember focus-visible:ring-offset-2 rounded-xl flex items-center justify-center transition-all group cursor-pointer"
        aria-label="Perfil do usuário"
        title="Perfil do Usuário"
      >
        <MembroAvatar 
          v-if="currentMembro" 
          :nome="currentMembro.nome" 
          variant="ember" 
          size="sm" 
          class="group-hover:scale-110 transition-transform duration-300 ease-spring"
        />
        <User v-else class="w-6 h-6 text-ash group-hover:text-ember transition-colors duration-200" aria-hidden="true" />
      </button>
    </div>
  </header>
</template>
