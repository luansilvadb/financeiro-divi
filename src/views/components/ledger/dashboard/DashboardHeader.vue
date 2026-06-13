<!-- src/views/components/ledger/dashboard/DashboardHeader.vue -->
<script setup lang="ts">
import { useTemplateRef, onMounted, onUnmounted } from 'vue'
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

// ─── DOM Refs (Direct DOM Mutation Pattern) ───────────────────────────────────
const appBarRef = useTemplateRef<InstanceType<typeof AppBar>>('appBarRef')
const leftBtnRef = useTemplateRef<HTMLButtonElement>('leftBtnRef')
const leftLabelRef = useTemplateRef<HTMLDivElement>('leftLabelRef')
const rightBtnRef = useTemplateRef<HTMLButtonElement>('rightBtnRef')
const rightLabelRef = useTemplateRef<HTMLDivElement>('rightLabelRef')
const centerRef = useTemplateRef<HTMLDivElement>('centerRef')
const mascotRef = useTemplateRef<HTMLDivElement>('mascotRef')
const tenantNameRef = useTemplateRef<HTMLDivElement>('tenantNameRef')

// ─── Direction-Aware State Machine ───────────────────────────────────────────
// ARQUITETURA: t é uma variável JS auto-gerenciada, NUNCA derivada de window.scrollY.
// A causa raiz do snap-back glitch era o mapeamento position-based:
//   t = scrollY / RANGE  →  oscila infinitamente quando scrollY flutua no threshold.
// Solução: t é atualizado por DELTA de scroll, com dead zone e snap decisivo.

const EXPANDED_HEIGHT = 52   // px — ~12mm físico em tela 96dpi
const COLLAPSED_HEIGHT = 44  // px — estado colapsado (branding apenas)
const INTERPOLATION_RANGE = EXPANDED_HEIGHT - COLLAPSED_HEIGHT  // 8px

const DEAD_ZONE_PX = 8       // px acumulados antes de mover t (absorve micro-scrolls)
const COLLAPSE_RATE = 1 / 40 // t avança X por px de delta descendo
const EXPAND_RATE = 1 / 30   // t recua X por px de delta subindo (mais rápido)
const SNAP_THRESHOLD = 0.35  // zona ambígua: snapa decisivamente para 0 ou 1

// Variáveis de estado — plain let, NUNCA ref() reativo
let t = 0               // [0=expandido, 1=colapsado]
let lastScrollY = 0     // scrollY do frame anterior
let deadZoneAccum = 0   // delta acumulado não processado (px)
let rafId: number | null = null
let snapTransitionPending = false

/**
 * applyStyles — núcleo do estado machine.
 * 
 * Algoritmo (conforme spec SPDD §8):
 * 1. Computa delta = scrollY - lastScrollY
 * 2. Boundary: scrollY ≤ 0 → força t=0 (topo da página = sempre expandido)
 * 3. Acumula delta na dead zone — micro-scrolls são absorvidos silenciosamente
 * 4. Após cruzar DEAD_ZONE_PX, aplica delta efetivo à taxa collapse/expand
 * 5. Snap decisivo: t em zona ambígua → snapa para 0 ou 1 com transição suave
 * 6. Aplica estilos via el.style direto (zero Vue reactivity no hot path)
 */
function applyStyles(): void {
  const currentScrollY = window.scrollY
  const delta = currentScrollY - lastScrollY
  lastScrollY = currentScrollY

  // ── Boundary: topo da página ─────────────────────────────────────────────
  if (currentScrollY <= 0) {
    t = 0
    deadZoneAccum = 0
    commitStyles(false)
    return
  }

  // ── Dead Zone ─────────────────────────────────────────────────────────────
  deadZoneAccum += delta

  let didSnap = false

  if (Math.abs(deadZoneAccum) >= DEAD_ZONE_PX) {
    // Extrai delta efetivo descontando a dead zone
    const eff = deadZoneAccum - Math.sign(deadZoneAccum) * DEAD_ZONE_PX
    deadZoneAccum = 0

    if (eff > 0) {
      // Scroll DOWN → colapsar
      t = Math.min(1, t + eff * COLLAPSE_RATE)
    } else {
      // Scroll UP → expandir
      t = Math.max(0, t + eff * EXPAND_RATE)
    }

    // ── Snap to stable state ────────────────────────────────────────────────
    // Impede que t fique "preso" em zona ambígua (snap-back root cause)
    if (t > SNAP_THRESHOLD && t < 1) {
      t = 1
      didSnap = true
    } else if (t < (1 - SNAP_THRESHOLD) && t > 0) {
      t = 0
      didSnap = true
    }
  }

  commitStyles(didSnap)
}

/**
 * commitStyles — aplica o valor final de t diretamente em el.style.
 * Separado de applyStyles para clareza e para controlar o snap transition.
 *
 * REGRA CRÍTICA (Norm #5 / Safeguard #7):
 * Nenhuma propriedade mutada aqui pode ter CSS `transition` durante scroll contínuo.
 * A única exceção é o one-shot snap transition (didSnap = true).
 */
function commitStyles(didSnap: boolean): void {
  const header = appBarRef.value?.headerEl
  const parallax = appBarRef.value?.parallaxEl
  if (!header) return

  // Snap one-shot transition: suaviza apenas o salto discreto de snap
  if (didSnap && !snapTransitionPending) {
    snapTransitionPending = true
    header.style.transition = 'height 180ms ease-out, background-color 180ms ease-out, box-shadow 180ms ease-out'
    requestAnimationFrame(() => {
      header.style.transition = ''
      snapTransitionPending = false
    })
  }

  const pad = parseFloat(getComputedStyle(header).getPropertyValue('--parent-pad')) || 24

  // ── AppBar <header> ────────────────────────────────────────────────────────
  header.style.height = `${EXPANDED_HEIGHT - INTERPOLATION_RANGE * t}px`
  header.style.backgroundColor = t > 0.05
    ? `rgba(251, 250, 249, ${Math.min(1.0, 0.98 * t)})`
    : 'transparent'
  header.style.boxShadow = t > 0.6
    ? `0 ${6 * t * t}px ${24 * t}px -4px rgba(67,70,69,${0.08 * t}), 0 0 1px rgba(18,18,18,${0.1 * t})`
    : 'none'
  header.style.borderBottom = `1px solid rgba(242, 240, 237, ${Math.max(0, (t - 0.8) * 10)})`
  header.style.marginLeft = `${-pad * t}px`
  header.style.marginRight = `${-pad * t}px`
  header.style.width = `calc(100% + ${2 * pad * t}px)`
  header.style.paddingLeft = `${pad * (1 - t)}px`
  header.style.paddingRight = `${pad * (1 - t)}px`

  // ── Parallax Layer ─────────────────────────────────────────────────────────
  if (parallax) {
    parallax.style.opacity = String(1 - t)
    parallax.style.transform = `translateY(${t * 24}px)`
  }

  // ── Branding Central ───────────────────────────────────────────────────────
  if (centerRef.value) {
    centerRef.value.style.transform = `scale(${1.05 - 0.15 * t})`
  }

  // ── Mascote (outer wrapper — transform exclusivo do scroll) ────────────────
  if (mascotRef.value) {
    mascotRef.value.style.top = `${-14 + 18 * t}px`
    mascotRef.value.style.right = `${-12 + 12 * t}px`
    mascotRef.value.style.transform = `scale(${0.95 - 0.2 * t}) rotate(${4 - 4 * t}deg)`
  }

  // ── Tenant Name ────────────────────────────────────────────────────────────
  if (tenantNameRef.value) {
    tenantNameRef.value.style.opacity = String(Math.max(0, 1 - 2.8 * t))
  }

  // ── Botão Esquerdo ─────────────────────────────────────────────────────────
  if (leftBtnRef.value) {
    leftBtnRef.value.style.transform = `scale(${1 - 0.05 * t})`
    leftBtnRef.value.style.backgroundColor = `rgba(242, 240, 237, ${0.4 + 0.1 * t})`
    leftBtnRef.value.style.boxShadow = t > 0.8 ? 'var(--shadow-subtle)' : 'none'
  }
  if (leftLabelRef.value) {
    leftLabelRef.value.style.transform = `scale(${1 - 0.1 * t})`
  }

  // ── Botão Direito ──────────────────────────────────────────────────────────
  if (rightBtnRef.value) {
    rightBtnRef.value.style.transform = `scale(${1 - 0.05 * t})`
    rightBtnRef.value.style.backgroundColor = `rgba(242, 240, 237, ${0.4 + 0.1 * t})`
    rightBtnRef.value.style.boxShadow = t > 0.8 ? 'var(--shadow-subtle)' : 'none'
  }
  if (rightLabelRef.value) {
    rightLabelRef.value.style.transform = `scale(${1 - 0.1 * t})`
  }
}

function handleScroll(): void {
  if (rafId !== null) cancelAnimationFrame(rafId)
  rafId = requestAnimationFrame(applyStyles)
}

onMounted(() => {
  lastScrollY = window.scrollY  // inicializa com posição atual (evita delta espúrio)
  window.addEventListener('scroll', handleScroll, { passive: true })
  applyStyles()  // aplica estado inicial
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  if (rafId !== null) cancelAnimationFrame(rafId)
})
</script>

<template>
  <!--
    DashboardHeader — Zero-Jitter SliverAppBar (Direction-Aware State Machine)
    
    Todos os estilos driven por scroll são aplicados via el.style dentro do RAF (commitStyles).
    O template NÃO usa :style para propriedades interpoladas pelo scroll.
    CSS transitions nessas propriedades estão removidas — exceto one-shot snap transition.
  -->
  <AppBar ref="appBarRef" class="mb-4">
    <!-- Slot Esquerdo: Seletor de Mês -->
    <template #left>
      <button
        ref="leftBtnRef"
        class="flex items-center gap-2.5 text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember focus-visible:ring-offset-4 rounded-2xl px-3 py-1.5 cursor-pointer active:scale-95 origin-left border border-stone/20"
        aria-haspopup="dialog"
        aria-label="Selecionar período"
        @click="$emit('openHistorico')"
      >
        <div class="w-8 h-8 rounded-full bg-white/30 flex items-center justify-center group-hover:bg-ember/10 group-hover:text-ember order-first transition-colors duration-300">
          <Calendar class="w-4 h-4 group-hover:scale-110 transition-transform duration-500 ease-jelly" aria-hidden="true" />
        </div>
        <div ref="leftLabelRef" class="flex flex-col left-label-stack">
          <span class="text-[7.5px] font-bold uppercase tracking-[0.2em] mb-0.5 flex items-center gap-1 whitespace-nowrap text-ash/60 group-hover:text-ember transition-colors duration-300">
            {{ currentYear }}
          </span>
          <div class="flex items-center gap-1 whitespace-nowrap">
            <span class="text-base font-bold tracking-tight leading-none text-charcoal group-hover:text-ember transition-colors duration-300">{{ currentMonthName }}</span>
            <CheckCircle2 v-if="faturaSelecionadaFechada" class="w-2.5 h-2.5 text-meadow animate-in zoom-in-50 duration-300" aria-label="Mês encerrado" />
          </div>
        </div>
      </button>
    </template>

    <!-- Slot Central: Branding DIVI. + Mascote Guardião -->
    <template #center>
      <div
        v-if="isAuthed && activeTenantObj"
        ref="centerRef"
        class="flex flex-col items-center justify-center select-none relative"
      >
        <!--
          mascotRef (OUTER WRAPPER):
          Recebe top, right, transform via commitStyles — NUNCA via CSS animation.
          O wobble está isolado no INNER WRAPPER abaixo (Safeguard #8).
        -->
        <div
          ref="mascotRef"
          class="absolute z-0 opacity-80 pointer-events-none mascot-outer"
          aria-hidden="true"
        >
          <!-- INNER WRAPPER: animate-wobble isolado — não conflita com transform do outer -->
          <div class="animate-wobble">
            <IllustrationMascot variant="ember" :size="24" mood="happy" />
          </div>
        </div>

        <div
          ref="tenantNameRef"
          class="relative mb-1.5 text-[8.5px] font-bold uppercase tracking-[0.2em] whitespace-nowrap flex items-center gap-2 justify-center text-ember"
        >
          <Home class="w-2 h-2 text-ember/40" aria-hidden="true" />
          <span>{{ activeTenantObj.name }}</span>
        </div>

        <h1 class="font-display text-3xl font-bold text-charcoal tracking-[-0.04em] leading-none relative z-10">
          DIVI<span class="text-ember">.</span>
        </h1>
      </div>

      <!-- Estado não autenticado -->
      <div
        v-else
        ref="centerRef"
        class="flex flex-col items-center justify-center select-none relative px-4"
      >
        <div
          ref="mascotRef"
          class="absolute z-0 opacity-80 pointer-events-none mascot-outer"
          aria-hidden="true"
        >
          <div class="animate-wobble">
            <IllustrationMascot variant="ember" :size="24" mood="happy" />
          </div>
        </div>
        <span
          ref="tenantNameRef"
          class="text-[7.5px] font-bold text-ash/60 uppercase tracking-[0.25em] block leading-none mb-1.5 relative z-10"
        >Finanças Residenciais</span>
        <h1 class="font-display text-3xl font-bold text-charcoal tracking-[-0.04em] leading-none relative z-10">
          DIVI<span class="text-ember">.</span>
        </h1>
      </div>
    </template>

    <!-- Slot Direito: Notificações / Atividade -->
    <template #right>
      <button
        v-if="podeVerLogs !== false"
        ref="rightBtnRef"
        class="flex items-center gap-2.5 text-right group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember focus-visible:ring-offset-4 rounded-2xl px-3 py-1.5 cursor-pointer active:scale-95 origin-right border border-stone/20"
        aria-label="Ver atividade"
        title="Ver atividade"
        @click="emit('openAuditLogs')"
      >
        <div ref="rightLabelRef" class="flex flex-col text-right right-label-stack">
          <span class="text-[7.5px] font-bold uppercase tracking-[0.2em] mb-0.5 text-ash/60 group-hover:text-ember whitespace-nowrap transition-colors duration-300">Logs</span>
          <span class="text-xs font-bold text-charcoal leading-none whitespace-nowrap">Atividade</span>
        </div>
        <div class="w-8 h-8 rounded-full bg-white/40 flex items-center justify-center group-hover:bg-ember/10 group-hover:text-ember transition-colors duration-300">
          <Bell class="w-4 h-4 group-hover:scale-110 group-active:rotate-[-12deg] transition-transform duration-500 ease-jelly" aria-hidden="true" />
        </div>
      </button>
    </template>
  </AppBar>
</template>

<style scoped>
/*
 * Norm #5 — CSS/JS Transition Separation:
 * Propriedades mutadas pelo RAF loop (transform, background-color, box-shadow,
 * opacity, height, margin, padding, width, border) NÃO devem ter transition aqui.
 * Exceção única: one-shot transition aplicada programaticamente no snap (commitStyles).
 * CSS transition só é permitida em hover/focus em props NÃO driven por scroll.
 */

.left-label-stack {
  transform-origin: left center;
}

.right-label-stack {
  transform-origin: right center;
}

/*
 * mascot-outer: outer wrapper com transform exclusivamente owned pelo RAF loop.
 * Safeguard #8: NUNCA adicionar CSS animation em transform neste elemento.
 * top e right são sobrescritos pelo commitStyles via el.style.
 */
.mascot-outer {
  position: absolute;
  top: -14px;  /* valor inicial (t=0, expandido) */
  right: -12px;
}
</style>