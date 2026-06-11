<!-- src/views/components/ledger/dashboard/DashboardHeader.vue -->
<script setup lang="ts">
import { CheckCircle2, Home, Bell, ChevronDown } from 'lucide-vue-next'
import IllustrationMascot from '../../ui/IllustrationMascot.vue'
import { useToast } from '../../../../composables/useToast'
import type { TenantSummary } from '../../../../models/services/TenantSessionService'

defineProps<{
  currentYear: string | number
  currentMonthName: string
  faturaSelecionadaFechada: boolean
  isAuthed: boolean
  activeTenantObj: TenantSummary | null
}>()

defineEmits<{
  (e: 'openHistorico'): void
}>()

const toast = useToast()

const handleNotificationsClick = () => {
  toast.show('Você não tem novas notificações.', 'info')
}
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
          <CheckCircle2 v-if="faturaSelecionadaFechada" class="w-4 h-4 text-meadow animate-in zoom-in-50 duration-300" aria-label="Mês encerrado" />
        </div>
      </button>
    </div>

    <!-- Coluna Central: Brand -->
    <div class="flex-1 flex flex-col items-center justify-center text-center">
      <div 
        v-if="isAuthed && activeTenantObj"
        class="flex flex-col items-center justify-center select-none"
      >
        <!-- Container do nome do tenant com decorações absolutas nas laterais para centralização pura do texto -->
        <div class="relative px-6 mb-1.5 text-[10px] font-bold text-ember uppercase tracking-[0.15em] whitespace-nowrap">
          <!-- Ícone Home à esquerda -->
          <Home class="absolute left-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ember" aria-hidden="true" />
          
          <!-- Nome do Tenant (exatamente no centro geométrico) -->
          <span>{{ activeTenantObj.name }}</span>
          
          <!-- Mascote do Header (Wobble) à direita -->
          <div class="absolute -top-4 -right-4.5 transform rotate-12 animate-wobble z-0 opacity-80 pointer-events-none" aria-hidden="true">
            <IllustrationMascot variant="ember" :size="32" mood="happy" />
          </div>
        </div>

        <h1 class="text-3xl font-bold text-charcoal tracking-[-0.05em] leading-none relative z-10">
          DIVI<span class="text-ember">.</span>
        </h1>
      </div>

      <div v-else class="flex flex-col items-center justify-center select-none relative px-6">
        <!-- Mascote do Header (Wobble) para estado deslogado -->
        <div class="absolute -top-4 -right-4.5 transform rotate-12 animate-wobble z-0 opacity-80 pointer-events-none" aria-hidden="true">
          <IllustrationMascot variant="ember" :size="32" mood="happy" />
        </div>
        <span class="text-[8px] font-semibold text-ash/80 uppercase tracking-[0.25em] block leading-none mb-1.5 relative z-10">Finanças Residenciais</span>
        <h1 class="text-3xl font-bold text-charcoal tracking-[-0.05em] leading-none relative z-10">
          DIVI<span class="text-ember">.</span>
        </h1>
      </div>
    </div>

    <!-- Coluna Direita: Notificações -->
    <div class="flex-1 flex justify-end">
      <button 
        @click="handleNotificationsClick" 
        class="w-11 h-11 bg-transparent hover:bg-stone/50 border-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ember focus-visible:ring-offset-2 rounded-xl flex items-center justify-center transition-all group cursor-pointer text-ash hover:text-charcoal"
        aria-label="Notificações"
        title="Notificações"
      >
        <Bell class="w-5 h-5 transition-all duration-300 ease-spring group-hover:scale-110 group-hover:rotate-12" aria-hidden="true" />
      </button>
    </div>
  </header>
</template>
