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
let isHolding = false
let lastMaxRadius = 0
let longPressTimeout: any | null = null
let longPressActionTimeout: any | null = null
let animationFrameId: number | null = null

const DURATION_LONG_PRESS = 700 // ms

const startLongPressAnimation = (startX: number, startY: number, maxRadius: number) => {
  ripple.value.active = true
  ripple.value.type = 'long'
  ripple.value.x = startX
  ripple.value.y = startY
  ripple.value.radius = 0
  ripple.value.opacity = 0.35

  const startTimeLong = performance.now()

  const tick = (now: number) => {
    if (!isHolding) return

    const elapsed = now - startTimeLong
    const progress = Math.min(elapsed / DURATION_LONG_PRESS, 1)
    
    // Ease-out cúbico
    const easeProgress = 1 - Math.pow(1 - progress, 3)
    ripple.value.radius = easeProgress * maxRadius

    if (progress < 1) {
      animationFrameId = requestAnimationFrame(tick)
    }
  }

  animationFrameId = requestAnimationFrame(tick)

  // Timeout para acionamento da ação física real do long press
  longPressActionTimeout = setTimeout(() => {
    if (isHolding) {
      triggerAction()
      cancelInteraction()
    }
  }, DURATION_LONG_PRESS)
}

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
  // Tap rápido só lança se não estiver paga. Se estiver paga, o tap rápido não faz nada (o estorno exige segurar/long-press)
  if (!props.paga) {
    emit('lancar', props.bill)
  }
}

const cancelInteraction = () => {
  isHolding = false
  if (longPressTimeout) {
    clearTimeout(longPressTimeout)
    longPressTimeout = null
  }
  if (longPressActionTimeout) {
    clearTimeout(longPressActionTimeout)
    longPressActionTimeout = null
  }
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }
  
  // Fade out suave do ripple apenas para o long press
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

  startTime = performance.now()
  isHolding = true

  // Calcula raio máximo (distância até o canto mais distante do card)
  const dx = Math.max(x, rect.width - x)
  const dy = Math.max(y, rect.height - y)
  lastMaxRadius = Math.sqrt(dx * dx + dy * dy)

  // Inicia timeout para distinguir tap de long press
  longPressTimeout = setTimeout(() => {
    if (isHolding) {
      startLongPressAnimation(x, y, lastMaxRadius)
    }
  }, 180)
}

const onPointerUp = (e: PointerEvent) => {
  const elapsed = performance.now() - startTime

  if (isHolding) {
    if (elapsed < 180) {
      // Tap Rápido
      if (longPressTimeout) {
        clearTimeout(longPressTimeout)
        longPressTimeout = null
      }
      
      const card = cardRef.value
      if (card) {
        const rect = card.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top

        // Dispara animação de tap rápido (CSS keyframe)
        ripple.value.active = true
        ripple.value.type = 'tap'
        ripple.value.x = x
        ripple.value.y = y
        ripple.value.radius = lastMaxRadius
        ripple.value.opacity = 0.55

        triggerTapAction()

        // Remove o ripple após a animação CSS completar (400ms)
        setTimeout(() => {
          if (ripple.value.type === 'tap') {
            ripple.value.active = false
          }
        }, 400)
      }
    }
  }

  cancelInteraction()
}

const onPointerLeave = () => {
  cancelInteraction()
}

onUnmounted(() => {
  if (longPressTimeout) clearTimeout(longPressTimeout)
  if (longPressActionTimeout) clearTimeout(longPressActionTimeout)
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
    <!-- Ripple Canvas overlay -->
    <div 
      v-if="ripple.active"
      class="absolute rounded-full pointer-events-none -translate-x-1/2 -translate-y-1/2 transition-opacity duration-200"
      :class="[
        ripple.type === 'tap' ? 'animate-ripple-tap' : '',
        paga ? 'bg-coral/25' : 'bg-meadow/25'
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

<style scoped>
@keyframes ripple-tap {
  0% {
    transform: translate(-50%, -50%) scale(0);
    opacity: 0.55;
  }
  100% {
    transform: translate(-50%, -50%) scale(1.05);
    opacity: 0;
  }
}
.animate-ripple-tap {
  animation: ripple-tap 400ms cubic-bezier(0.1, 0.8, 0.3, 1) forwards;
}
</style>
