<script setup lang="ts">
import { ref, reactive, onUnmounted } from 'vue'
import { Settings } from 'lucide-vue-next'
import type { ContaFixa } from '../../modules/ledger/core/domain/ContaFixa'
import Button from '../ui/Button.vue'

const props = defineProps<{
  bill: ContaFixa
  paga: boolean
  valorReal: number | null
  pagoPorNome?: string
  isMonthLocked: boolean
  holdColor: string
  tapColor: string
}>()

const emit = defineEmits<{
  (e: 'lancar', bill: ContaFixa): void
  (e: 'estornar', bill: ContaFixa): void
  (e: 'configurar', bill: ContaFixa): void
}>()

// ── state para ripples ──────────────────────────────────────────────────
const ripples = reactive<{ id: number; x: number; y: number; size: number }[]>([])
const hold = reactive({
  active: false,
  x: 0,
  y: 0,
  scale: 0,
  opacity: 0,
})

let holdRaf: number | null = null
let holdTimer: any = null
let rippleId = 0

// ── helpers de coordenadas ──────────────────────────────────────────────
function coords(el: HTMLElement, e: PointerEvent) {
  const r = el.getBoundingClientRect()
  return { x: e.clientX - r.left, y: e.clientY - r.top }
}

function maxRadius(el: HTMLElement, x: number, y: number) {
  const { width: w, height: h } = el.getBoundingClientRect()
  return Math.hypot(Math.max(x, w - x), Math.max(y, h - y))
}

// ── hold ripple (cresce no toque longo) ────────────────────────────────
function startHold(el: HTMLElement, x: number, y: number) {
  const max = maxRadius(el, x, y)
  hold.active = true
  hold.x = x
  hold.y = y
  hold.scale = 0
  hold.opacity = 1

  const start = performance.now()
  const DURATION = 800 // ms para preencher todo o card

  function grow(now: number) {
    if (!hold.active) return
    const t = Math.min((now - start) / DURATION, 1)
    hold.scale = (1 - Math.pow(1 - t, 3)) * max * 2
    
    if (t >= 1) {
      triggerHoldComplete()
      return
    }
    holdRaf = requestAnimationFrame(grow)
  }
  holdRaf = requestAnimationFrame(grow)
}

function stopHold() {
  hold.active = false
  hold.opacity = 0
  hold.scale = 0
  if (holdRaf !== null) {
    cancelAnimationFrame(holdRaf)
    holdRaf = null
  }
}

function triggerHoldComplete() {
  stopHold()
  if (navigator.vibrate) {
    navigator.vibrate(60) // feedback tátil
  }
  emit('estornar', props.bill)
}

// ── tap ripple (efeito pedra na água) ──────────────────────────────────
function spawnTap(el: HTMLElement, x: number, y: number) {
  const id = ++rippleId
  const max = maxRadius(el, x, y)
  ripples.push({ id, x, y, size: max * 2 })

  setTimeout(() => {
    const i = ripples.findIndex(r => r.id === id)
    if (i !== -1) ripples.splice(i, 1)
  }, 650)
}

// ── event handlers ─────────────────────────────────────────────────────
const HOLD_DELAY = 180 // ms antes de iniciar hold
let isHolding = false

function onPointerDown(e: PointerEvent) {
  if (props.isMonthLocked) return
  const el = e.currentTarget as HTMLElement
  if (typeof el.setPointerCapture === 'function') {
    el.setPointerCapture(e.pointerId)
  }
  isHolding = false
  const { x, y } = coords(el, e)

  // O hold (estorno) só faz sentido se a conta já estiver paga
  if (props.paga) {
    holdTimer = setTimeout(() => {
      isHolding = true
      startHold(el, x, y)
    }, HOLD_DELAY)
  } else {
    // Se não estiver paga, guardamos a posição para um possível tap rápido
    holdTimer = null
  }
}

function onPointerUp(e: PointerEvent) {
  if (props.isMonthLocked) return
  
  if (holdTimer !== null) {
    clearTimeout(holdTimer)
    holdTimer = null
  }

  if (isHolding) {
    stopHold()
  } else {
    const el = e.currentTarget as HTMLElement
    const { x, y } = coords(el, e)
    spawnTap(el, x, y)

    // Toque simples em conta não paga realiza o lançamento
    if (!props.paga) {
      emit('lancar', props.bill)
    }
  }
  isHolding = false
}

function onPointerCancel() {
  if (holdTimer !== null) {
    clearTimeout(holdTimer)
    holdTimer = null
  }
  stopHold()
  isHolding = false
}

onUnmounted(() => {
  if (holdRaf !== null) {
    cancelAnimationFrame(holdRaf)
  }
  if (holdTimer !== null) {
    clearTimeout(holdTimer)
  }
})
</script>

<template>
  <div
    class="ripple-card group relative overflow-hidden select-none border transition-all duration-300 p-4 rounded-xl flex items-center justify-between"
    :class="[
      paga ? 'bg-meadow/5 border-meadow/20 cursor-default' : 'bg-canvas border-stone hover:border-ember/30 cursor-pointer',
      isMonthLocked ? 'opacity-80 cursor-not-allowed' : ''
    ]"
    @pointerdown="onPointerDown"
    @pointerup="onPointerUp"
    @pointercancel="onPointerCancel"
    @contextmenu.prevent
  >
    <!-- ① tap ripples (pedra na água) -->
    <span
      v-for="r in ripples"
      :key="r.id"
      class="ripple-tap"
      :style="{
        left: r.x + 'px',
        top: r.y + 'px',
        width: r.size + 'px',
        height: r.size + 'px',
        background: tapColor,
      }"
    />

    <!-- ② hold ripple (cresce enquanto pressiona) -->
    <span
      v-if="hold.active || hold.opacity > 0"
      class="ripple-hold"
      :style="{
        left: hold.x + 'px',
        top: hold.y + 'px',
        width: hold.scale + 'px',
        height: hold.scale + 'px',
        opacity: hold.opacity,
        background: holdColor,
      }"
    />

    <!-- Conteúdo principal -->
    <div class="ripple-content flex items-center gap-4 min-w-0 flex-1">
      <div class="w-10 h-10 rounded-lg bg-card border border-stone flex items-center justify-center text-xl shadow-subtle shrink-0">
        {{ bill.icon }}
      </div>
      <div class="min-w-0 flex-1">
        <span class="font-bold text-sm block text-charcoal truncate tracking-[-0.17px]">{{ bill.name }}</span>
        
        <div v-if="paga && valorReal !== null" class="flex items-center mt-1">
          <span class="text-[10px] text-meadow font-bold uppercase tracking-wider">
            R$ {{ valorReal.toFixed(2).replace('.', ',') }} por {{ pagoPorNome }}
          </span>
        </div>
        
        <div v-if="paga && !isMonthLocked" class="mt-1 text-[9px] text-ash/80 uppercase tracking-widest font-semibold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <span>Segure para estornar</span>
        </div>
      </div>
    </div>

    <!-- Ações secundárias -->
    <div class="ripple-content flex items-center gap-2 shrink-0 ml-4">
      <Button 
        variant="secondary" 
        size="icon"
        class="w-8 h-8 rounded-lg border border-stone bg-white"
        :aria-label="`Configurar ${bill.name}`"
        :title="`Configurar ${bill.name}`"
        :data-testid="`configurar-conta-${bill.id}`"
        @click.stop="emit('configurar', bill)"
        @pointerdown.stop
        @pointerup.stop
      >
        <Settings class="w-4 h-4 text-ash" />
      </Button>
    </div>
  </div>
</template>

<style scoped>
.ripple-card {
  isolation: isolate;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

.ripple-tap {
  position: absolute;
  border-radius: 9999px;
  transform: translate(-50%, -50%) scale(0);
  pointer-events: none;
  animation: ripple-tap-anim 650ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
  z-index: 0;
}

.ripple-hold {
  position: absolute;
  border-radius: 9999px;
  transform: translate(-50%, -50%);
  pointer-events: none;
  transition: opacity 200ms ease;
  z-index: 0;
}

.ripple-content {
  position: relative;
  z-index: 1;
}

@keyframes ripple-tap-anim {
  0% {
    transform: translate(-50%, -50%) scale(0);
    opacity: 1;
  }
  60% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0.5;
  }
  100% {
    transform: translate(-50%, -50%) scale(1.15);
    opacity: 0;
  }
}
</style>
