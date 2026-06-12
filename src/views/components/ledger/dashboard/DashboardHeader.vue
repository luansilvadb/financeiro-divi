<!-- src/views/components/ledger/dashboard/DashboardHeader.vue -->
<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { CheckCircle2, Home, Bell, Calendar } from 'lucide-vue-next'
import IllustrationMascot from '../../ui/IllustrationMascot.vue'
import AppBar from '../../ui/AppBar.vue'
import type { TenantSummary } from '../../../../models/services/TenantSessionService'

defineProps<{
  currentYear: string | number
  currentMonthName: string
  faturaSelecionadaFechada: boolean
  isAuthed: boolean
  activeTenantObj: TenantSummary | null
  podeVerLogs?: boolean
}>()

const emit = defineEmits<{
  (e: 'openHistorico'): void
  (e: 'openAuditLogs'): void
}>()

// Flutter-like metrics: expanded (96px) to collapsed (60px)
const EXPANDED_HEIGHT = 96
const COLLAPSED_HEIGHT = 60
const INTERPOLATION_RANGE = EXPANDED_HEIGHT - COLLAPSED_HEIGHT

const scrollY = ref(0)
const scrollRatio = computed(() => {
  const ratio = scrollY.value / INTERPOLATION_RANGE
  return Math.min(Math.max(ratio, 0), 1)
})

let rafId: number | null = null

const handleScroll = () => {
  if (rafId) cancelAnimationFrame(rafId)
  rafId = requestAnimationFrame(() => {
    scrollY.value = window.scrollY
  })
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
  scrollY.value = window.scrollY
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  if (rafId) cancelAnimationFrame(rafId)
})

const handleNotificationsClick = () => {
  emit('openAuditLogs')
}
</script>

<template>
  <AppBar :scroll-ratio="scrollRatio" class="mb-4">
    <!-- Slot Esquerdo: Mês Selector -->
    <template #left>
      <button 
        class="flex items-center gap-2.5 text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember focus-visible:ring-offset-4 rounded-2xl px-3 py-1.5 cursor-pointer active:scale-95 origin-left border border-stone/20"
        :style="{
          /* Subtle linear scaling */
          transform: `scale(${1 - (0.05 * scrollRatio)})`,
          /* Tactile warm background */
          backgroundColor: `rgba(242, 240, 237, ${0.4 + (0.1 * scrollRatio)})`,
          boxShadow: scrollRatio > 0.8 ? 'var(--shadow-subtle)' : 'none',
        }"
        aria-haspopup="dialog"
        aria-label="Selecionar período"
        @click="$emit('openHistorico')"
      >
        <div class="w-8 h-8 rounded-full bg-white/30 flex items-center justify-center transition-all group-hover:bg-ember/10 group-hover:text-ember order-first">
          <Calendar class="w-4 h-4 transition-all duration-300 ease-out group-hover:scale-110" aria-hidden="true" />
        </div>
        <div class="flex flex-col" :style="{ transform: `scale(${1 - (0.1 * scrollRatio)})`, transformOrigin: 'left' }">
          <span class="text-[7.5px] font-bold uppercase tracking-[0.2em] mb-0.5 flex items-center gap-1 transition-colors whitespace-nowrap text-ash/60 group-hover:text-ember">
            {{ currentYear }}
          </span>
          <div class="flex items-center gap-1 whitespace-nowrap">
            <span class="text-base font-bold tracking-tight transition-colors leading-none text-charcoal group-hover:text-ember">{{ currentMonthName }}</span>
            <CheckCircle2 v-if="faturaSelecionadaFechada" class="w-2.5 h-2.5 text-meadow animate-in zoom-in-50 duration-300" aria-label="Mês encerrado" />
          </div>
        </div>
      </button>
    </template>

    <!-- Slot Central: Flexible Branding Area -->
    <template #center>
      <div 
        v-if="isAuthed && activeTenantObj"
        class="flex flex-col items-center justify-center select-none relative"
        :style="{
          /* Subtle scaling centered */
          transform: `scale(${1.05 - (0.15 * scrollRatio)})`,
          opacity: 0.98 + (0.02 * scrollRatio)
        }"
      >
        <!-- Mascote Guardião (Movable Anchor - Stays visible) -->
        <div 
          class="absolute transform z-0 opacity-80 pointer-events-none"
          :style="{
            top: `${-14 + (18 * scrollRatio)}px`,
            right: `${-12 + (12 * scrollRatio)}px`,
            transform: `scale(${0.95 - (0.2 * scrollRatio)}) rotate(${4 - (4 * scrollRatio)}deg)`
          }"
          aria-hidden="true"
        >
          <IllustrationMascot variant="ember" :size="24" mood="happy" />
        </div>

        <div 
          class="relative mb-1.5 text-[8.5px] font-bold uppercase tracking-[0.2em] whitespace-nowrap flex items-center gap-2 justify-center text-ember"
          :style="{ opacity: Math.max(0, 1 - (2.8 * scrollRatio)) }"
        >
          <Home class="w-2 h-2 text-ember/40" aria-hidden="true" />
          <span>{{ activeTenantObj.name }}</span>
        </div>

        <h1 class="font-display text-3xl font-bold text-charcoal tracking-[-0.04em] leading-none relative z-10">
          DIVI<span class="text-ember">.</span>
        </h1>
      </div>

      <div 
        v-else 
        class="flex flex-col items-center justify-center select-none relative px-4"
        :style="{ transform: `scale(${1.05 - (0.15 * scrollRatio)})` }"
      >
        <!-- Mascote Guardião (Unauthed) -->
        <div 
          class="absolute transform z-0 opacity-80 pointer-events-none"
          :style="{
            top: `${-14 + (18 * scrollRatio)}px`,
            right: `${-12 + (12 * scrollRatio)}px`,
            transform: `scale(${0.95 - (0.2 * scrollRatio)}) rotate(${8 - (8 * scrollRatio)}deg)`
          }"
          aria-hidden="true"
        >
          <IllustrationMascot variant="ember" :size="24" mood="happy" />
        </div>
        <span class="text-[7.5px] font-bold text-ash/60 uppercase tracking-[0.25em] block leading-none mb-1.5 relative z-10" :style="{ opacity: 1 - (2.8 * scrollRatio) }">Finanças Residenciais</span>
        <h1 class="font-display text-3xl font-bold text-charcoal tracking-[-0.04em] leading-none relative z-10">
          DIVI<span class="text-ember">.</span>
        </h1>
      </div>
    </template>

    <!-- Slot Direito: Notificações/Atividade -->
    <template #right>
      <button 
        v-if="podeVerLogs !== false"
        @click="handleNotificationsClick" 
        class="flex items-center gap-2.5 text-right group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember focus-visible:ring-offset-4 rounded-2xl px-3 py-1.5 cursor-pointer active:scale-95 origin-right border border-stone/20"
        :style="{
          /* Identical scaling for symmetry */
          transform: `scale(${1 - (0.05 * scrollRatio)})`,
          /* Tactile warm background consistency */
          backgroundColor: `rgba(242, 240, 237, ${0.4 + (0.1 * scrollRatio)})`,
          boxShadow: scrollRatio > 0.8 ? 'var(--shadow-subtle)' : 'none',
        }"
        aria-label="Ver atividade"
        title="Ver atividade"
      >
        <div class="flex flex-col text-right" :style="{ transform: `scale(${1 - (0.1 * scrollRatio)})`, transformOrigin: 'right' }">
          <span class="text-[7.5px] font-bold uppercase tracking-[0.2em] mb-0.5 text-ash/60 group-hover:text-ember whitespace-nowrap">Logs</span>
          <span class="text-xs font-bold text-charcoal leading-none whitespace-nowrap">Atividade</span>
        </div>
        <div class="w-8 h-8 rounded-full bg-white/40 flex items-center justify-center transition-all group-hover:bg-ember/10 group-hover:text-ember">
          <Bell class="w-4 h-4 transition-all duration-300 ease-out group-hover:scale-110 group-active:rotate-[-12deg]" aria-hidden="true" />
        </div>
      </button>
    </template>
  </AppBar>
</template>