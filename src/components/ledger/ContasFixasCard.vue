<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import type { ContaFixa } from '../../modules/ledger/core/domain/ContaFixa'
import { Settings } from 'lucide-vue-next'
import Button from '../ui/Button.vue'

const props = defineProps<{
  bill: ContaFixa
  paga: boolean
  statusGasto: { valorReal: number; pagoPor: string } | null
  obterNomeMembro: (id?: string) => string | undefined
  isMonthLocked: boolean
}>()

const emit = defineEmits<{
  (e: 'lancar', bill: ContaFixa): void
  (e: 'estornar', bill: ContaFixa): void
  (e: 'configurar', bill: ContaFixa): void
}>()

const cardRef = ref<HTMLElement | null>(null)

interface RippleState {
  active: boolean
  x: number
  y: number
  radius: number
  opacity: number
  type: 'tap' | 'long'
}

const ripple = ref<RippleState>({
  active: false,
  x: 0,
  y: 0,
  radius: 0,
  opacity: 0,
  type: 'tap'
})

let startTime = 0
let startTimeTap = 0
let startRadius = 0
let maxRadiusGlobal = 0
let isHolding = false
let hasTriggered = false
let animationFrameId: number | null = null

const DURATION_LONG = 800 // ms para segurar completo (long press)
const DURATION_TAP = 200 // ms para animar e cobrir no tap rapido

const triggerAction = () => {
  if (props.isMonthLocked) return
  if (props.paga) {
    emit('estornar', props.bill)
  } else {
    emit('lancar', props.bill)
  }
}

const triggerTapAction = () => {
  if (props.isMonthLocked) return
  if (!props.paga) {
    emit('lancar', props.bill)
  }
}

const cancelInteraction = () => {
  isHolding = false
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }
  
  // Se for cancelado o long-press antes de completar ou virar tap, faz um fade out visual do raio atual
  if (ripple.value.active && ripple.value.type === 'long') {
    const fadeTick = () => {
      if (ripple.value.opacity > 0) {
        ripple.value.opacity -= 0.05
        requestAnimationFrame(fadeTick)
      } else {
        ripple.value.active = false
      }
    }
    requestAnimationFrame(fadeTick)
  }
}

const onPointerDown = (e: PointerEvent) => {
  if (props.isMonthLocked) return
  
  const card = cardRef.value
  if (!card) return

  const rect = card.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top

  isHolding = true
  hasTriggered = false
  startTime = performance.now()

  // Calcula raio máximo a partir do ponto de toque
  const dx = Math.max(x, rect.width - x)
  const dy = Math.max(y, rect.height - y)
  maxRadiusGlobal = Math.sqrt(dx * dx + dy * dy)

  // Inicia ripple no modo 'long' (crescimento inicial lento de espera)
  ripple.value.active = true
  ripple.value.type = 'long'
  ripple.value.x = x
  ripple.value.y = y
  ripple.value.radius = 0
  ripple.value.opacity = 0.35

  if (animationFrameId) cancelAnimationFrame(animationFrameId)
  
  const tick = (now: number) => {
    if (!ripple.value.active) return

    if (ripple.value.type === 'long') {
      if (!isHolding) return
      
      const elapsed = now - startTime
      const progress = Math.min(elapsed / DURATION_LONG, 1)
      const easeProgress = 1 - Math.pow(1 - progress, 3) // ease-out cubic
      ripple.value.radius = easeProgress * maxRadiusGlobal

      if (progress >= 1) {
        hasTriggered = true
        triggerAction()
        cancelInteraction()
        return
      }
    } else if (ripple.value.type === 'tap') {
      const elapsed = now - startTimeTap
      const progress = Math.min(elapsed / DURATION_TAP, 1)
      const easeProgress = 1 - Math.pow(1 - progress, 3)
      ripple.value.radius = startRadius + easeProgress * (maxRadiusGlobal - startRadius)
      ripple.value.opacity = 0.35 * (1 - progress)

      if (progress >= 1) {
        triggerTapAction()
        ripple.value.active = false
        return
      }
    }

    animationFrameId = requestAnimationFrame(tick)
  }

  animationFrameId = requestAnimationFrame(tick)
}

const onPointerUp = () => {
  if (!isHolding || hasTriggered) return

  const elapsed = performance.now() - startTime

  if (elapsed < 220) {
    // Foi um Toque Rápido (Tap) -> Acelera o ripple no modo 'tap' para cobrir o card rapidamente
    ripple.value.type = 'tap'
    startTimeTap = performance.now()
    startRadius = ripple.value.radius
  } else {
    // Soltou no meio do long press -> Cancela e some
    cancelInteraction()
  }
  isHolding = false
}

const onPointerLeave = () => {
  cancelInteraction()
}

onUnmounted(() => {
  if (animationFrameId) cancelAnimationFrame(animationFrameId)
})
</script>

<template>
  <div 
    ref="cardRef"
    @pointerdown="onPointerDown"
    @pointerup="onPointerUp"
    @pointerleave="onPointerLeave"
    @pointercancel="onPointerLeave"
    class="relative overflow-hidden group flex items-center justify-between p-4 rounded-xl border transition-all duration-300 select-none cursor-pointer"
    :class="[
      paga ? 'bg-meadow/5 border-meadow/20' : 'bg-canvas border-stone hover:border-ember/30',
      isMonthLocked ? 'opacity-60 cursor-not-allowed' : ''
    ]"
    :data-testid="`conta-fixa-card-${bill.id}`"
  >
    <!-- Ripple overlay controlado 100% via JS de forma nativa e sem estilos obstrutivos -->
    <div 
      v-if="ripple.active"
      class="absolute rounded-full pointer-events-none -translate-x-1/2 -translate-y-1/2"
      :class="[
        paga ? 'bg-coral/25' : 'bg-ember/20'
      ]"
      :style="{
        left: ripple.x + 'px',
        top: ripple.y + 'px',
        width: ripple.radius * 2 + 'px',
        height: ripple.radius * 2 + 'px',
        opacity: ripple.opacity
      }"
    ></div>

    <div class="flex items-center gap-4 min-w-0 flex-1 pointer-events-none">
      <div class="w-10 h-10 rounded-lg bg-card border border-stone flex items-center justify-center text-xl shadow-subtle">
        {{ bill.icon }}
      </div>
      <div class="min-w-0 flex-1">
        <span class="font-bold text-sm block text-charcoal truncate tracking-[-0.17px]">{{ bill.name }}</span>
        <div v-if="paga && statusGasto" class="flex items-center mt-1">
          <span class="text-[10px] text-meadow font-bold uppercase tracking-wider">
            R$ {{ statusGasto.valorReal.toFixed(2).replace('.', ',') }} por {{ obterNomeMembro(statusGasto.pagoPor) }}
          </span>
        </div>
      </div>
    </div>

    <!-- Botão de Configurar isolado da interação do card principal -->
    <div class="flex items-center gap-2 shrink-0 ml-4 relative z-10">
      <Button 
        variant="secondary" 
        size="icon"
        @click.stop="$emit('configurar', bill)"
        @pointerdown.stop
        @pointerup.stop
        class="w-8 h-8 rounded-lg border border-stone bg-white/80 hover:bg-white active:scale-95 transition-all shadow-sm"
        :data-testid="`configurar-conta-${bill.id}`"
        :aria-label="`Configurar ${bill.name}`"
        :title="`Configurar ${bill.name}`"
      >
        <Settings class="w-4 h-4 text-ash" />
      </Button>
    </div>
  </div>
</template>
