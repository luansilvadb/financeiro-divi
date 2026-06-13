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
// NÃO usar ref()/computed() para scrollY/scrollRatio.
// Todos os refs abaixo são usados para mutação imperativa via el.style dentro do RAF.
const appBarRef = useTemplateRef<InstanceType<typeof AppBar>>('appBarRef')
const leftBtnRef = useTemplateRef<HTMLButtonElement>('leftBtnRef')
const leftLabelRef = useTemplateRef<HTMLDivElement>('leftLabelRef')
const rightBtnRef = useTemplateRef<HTMLButtonElement>('rightBtnRef')
const rightLabelRef = useTemplateRef<HTMLDivElement>('rightLabelRef')
const centerRef = useTemplateRef<HTMLDivElement>('centerRef')
const mascotRef = useTemplateRef<HTMLDivElement>('mascotRef')
const tenantNameRef = useTemplateRef<HTMLDivElement>('tenantNameRef')

// ─── Scroll Engine ────────────────────────────────────────────────────────────
// Métricas Flutter-like: expanded (96px) → collapsed (60px)
const INTERPOLATION_RANGE = 36 // 96 - 60

// Variável JS simples — NÃO reativa. Evita VDOM diff no hot path.
let rafId: number | null = null

/**
 * applyStyles — núcleo do loop de animação.
 * Chamada dentro de requestAnimationFrame; lê window.scrollY diretamente
 * e muta el.style em cada elemento interpolado.
 *
 * ZERO CSS TRANSITION nas propriedades mutadas aqui:
 * qualquer transition CSS nessas props criaria double-interpolation jitter.
 */
function applyStyles(): void {
  // t ∈ [0, 1]: 0 = totalmente expandido, 1 = totalmente colapsado
  const t = Math.min(Math.max(window.scrollY / INTERPOLATION_RANGE, 0), 1)

  const header = appBarRef.value?.headerEl
  const parallax = appBarRef.value?.parallaxEl

  if (!header) return

  // ── AppBar <header> ────────────────────────────────────────────────────────
  // Lê --parent-pad do elemento para compatibilidade com breakpoints CSS.
  const pad = parseFloat(getComputedStyle(header).getPropertyValue('--parent-pad')) || 24

  header.style.height = `${96 - 36 * t}px`
  header.style.backgroundColor = t > 0.05
    ? `rgba(251, 250, 249, ${Math.min(1.0, 0.98 * t)})`
    : 'transparent'
  header.style.boxShadow = t > 0.6
    ? `0 ${6 * t * t}px ${24 * t}px -4px rgba(67,70,69,${0.08 * t}), 0 0 1px rgba(18,18,18,${0.1 * t})`
    : 'none'
  header.style.borderBottom = `1px solid rgba(242, 240, 237, ${Math.max(0, (t - 0.8) * 10)})`

  // Breakout edge-to-edge: expande sobre o padding do pai conforme t → 1
  // --parent-pad é 1.5rem (24px) ≥640px, 1rem (16px) <640px
  const padPx = pad // já em px via parseFloat
  header.style.marginLeft = `${-padPx * t}px`
  header.style.marginRight = `${-padPx * t}px`
  header.style.width = `calc(100% + ${2 * padPx * t}px)`
  header.style.paddingLeft = `${padPx * (1 - t)}px`
  header.style.paddingRight = `${padPx * (1 - t)}px`

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
  // Cancela frame pendente antes de agendar um novo — evita frame-doubling.
  if (rafId !== null) cancelAnimationFrame(rafId)
  rafId = requestAnimationFrame(applyStyles)
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
  // Aplica estilos iniciais (t = 0 se page não está rolada)
  applyStyles()
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  if (rafId !== null) cancelAnimationFrame(rafId)
})
</script>

<template>
  <!--
    DashboardHeader — Zero-Jitter SliverAppBar
    Todos os estilos driven por scroll são aplicados via el.style dentro do RAF (applyStyles).
    O template NÃO usa :style para propriedades interpoladas pelo scroll.
    CSS transitions nessas propriedades estão removidas (causariam double-interpolation jitter).
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
        <!--
          SEM transition-all: o transform e backgroundColor deste botão
          são mutados por applyStyles() a cada frame — transition CSS aqui
          causaria double-interpolation jitter.
          Apenas hover/focus usam CSS transition (propriedades NÃO driven por scroll).
        -->
        <div class="w-8 h-8 rounded-full bg-white/30 flex items-center justify-center group-hover:bg-ember/10 group-hover:text-ember order-first transition-colors duration-300">
          <Calendar class="w-4 h-4 group-hover:scale-110 transition-transform duration-500 ease-jelly" aria-hidden="true" />
        </div>
        <!--
          leftLabelRef: escalonado por applyStyles via transform.
          transformOrigin: left é definido via CSS scoped abaixo.
        -->
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
      <!--
        centerRef: escalonado por applyStyles via transform.
        SEM :style aqui — valor vem do applyStyles via el.style.
      -->
      <div
        v-if="isAuthed && activeTenantObj"
        ref="centerRef"
        class="flex flex-col items-center justify-center select-none relative"
      >
        <!--
          mascotRef (OUTER WRAPPER):
          - Recebe top, right, transform via applyStyles (Direct DOM).
          - NÃO carrega animate-wobble nem qualquer CSS animation que escreva em transform.
          - O wobble está no INNER WRAPPER abaixo (isolamento de camadas).
        -->
        <div
          ref="mascotRef"
          class="absolute z-0 opacity-80 pointer-events-none mascot-outer"
          aria-hidden="true"
        >
          <!--
            INNER WRAPPER (wobble isolation):
            Carrega animate-wobble, que anima rotate e scale em ±0.01.
            Por estar em um elemento filho separado, NÃO conflita com o
            transform do mascotRef que é owned pelo scroll RAF.
          -->
          <div class="animate-wobble">
            <IllustrationMascot variant="ember" :size="24" mood="happy" />
          </div>
        </div>

        <!-- Tenant Name: opacity mutada por applyStyles via tenantNameRef.style -->
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
        <!-- mascotRef para o estado não-autenticado -->
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
        <!--
          SEM transition-all: mesma lógica do leftBtnRef.
          Apenas hover/focus usam CSS transition em propriedades não driven por scroll.
        -->
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
 * REGRA CRÍTICA DE SEPARAÇÃO CSS/JS (Norm #5):
 * Propriedades listed abaixo são mutadas pelo RAF loop (applyStyles):
 *   transform, background-color, box-shadow, opacity
 * Elas NÃO devem ter `transition` aqui — causaria double-interpolation jitter.
 *
 * CSS `transition` é APENAS permitida em pseudo-classes de interação
 * (hover, focus) que targetam propriedades NÃO driven por scroll.
 */

/* transform-origin para os label stacks dos botões laterais */
.left-label-stack {
  transform-origin: left center;
}

.right-label-stack {
  transform-origin: right center;
}

/*
 * mascot-outer: posicionamento absoluto base.
 * top e right são sobrescritos pelo applyStyles via el.style.
 * transform é exclusivamente owned pelo RAF loop — NUNCA adicionar
 * CSS animation em transform neste elemento (Safeguard #8).
 */
.mascot-outer {
  position: absolute;
  /* Valores iniciais (t = 0): top = -14px, right = -12px */
  top: -14px;
  right: -12px;
}
</style>