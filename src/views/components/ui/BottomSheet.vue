<template>
  <Teleport to="body">
    <!-- Backdrop overlay - fixed, doesn't move with bottom sheet -->
    <Transition name="fade">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-[998] bg-black/40 transition-opacity duration-300"
        @click="onBackdropClick"
      />
    </Transition>

    <!-- Wrapper centradora do BottomSheet para alinhamento horizontal no desktop -->
    <Transition name="slide-up" @after-leave="onTransitionLeave">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-[999] flex justify-center items-end p-0 pointer-events-none"
      >
        <div
          class="pointer-events-auto relative flex flex-col bg-canvas border-t border-x border-stone/30 shadow-lg transition-all duration-300 text-graphite
                 rounded-t-[32px] max-h-[90dvh] w-full max-w-full min-w-0 overflow-hidden"
          :class="widthClass"
          :style="{ maxHeight, minHeight }"
          @touchstart="onTouchStart"
          @touchmove="onTouchMove"
          @touchend="onTouchEnd"
          @mousedown="onMouseDown"
        >
          <!-- Drag handle -->
          <div class="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing shrink-0">
            <div class="h-1.5 w-12 rounded-full bg-stone" />
          </div>

          <!-- Header -->
          <div v-if="title || $slots.header || $slots.title || subtitle || $slots.subtitle" class="flex items-start justify-between px-6 pt-2 pb-6 shrink-0">
            <div class="flex-1 min-w-0 pr-4">
              <slot name="header">
                <slot name="title">
                  <h2 v-if="title" class="text-3xl font-display text-charcoal leading-[1.1] tracking-tight">{{ title }}</h2>
                </slot>
                <slot name="subtitle">
                  <p v-if="subtitle" class="text-sm text-graphite font-medium mt-2 leading-relaxed opacity-80">{{ subtitle }}</p>
                </slot>
              </slot>
            </div>
            <button
              v-if="showClose"
              class="w-12 h-12 rounded-full bg-stone/50 flex items-center justify-center text-ash transition-all hover:bg-stone hover:text-charcoal cursor-pointer border-none focus-visible:ring-2 focus-visible:ring-ember focus-visible:outline-none shrink-0 -mt-1"
              @click="close"
              aria-label="Fechar"
            >
              <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Divider -->
          <div v-if="(title || $slots.header || $slots.title) && showDivider" class="h-px bg-stone/60 mx-6 shrink-0" />

          <!-- Content -->
          <div :class="['overflow-y-auto flex-1 custom-scrollbar', contentClass]">
            <slot />
          </div>

          <!-- Footer -->
          <div v-if="$slots.footer" class="p-6 pt-4 border-t border-stone shrink-0 bg-white shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'
import { useBottomSheetState } from '../../../viewmodels/useBottomSheetState'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  showClose: { type: Boolean, default: true },
  showDivider: { type: Boolean, default: true },
  maxHeight: { type: String, default: '90dvh' },
  minHeight: { type: String, default: undefined },
  widthClass: { type: String, default: 'md:w-[480px]' },
  contentClass: { type: String, default: 'px-6 pb-8' }
})

const emit = defineEmits(['update:modelValue'])

const close = () => emit('update:modelValue', false)

let mountTime = 0
const onBackdropClick = () => {
  // Ignora cliques que acontecem nos primeiros 300ms de montagem do BottomSheet.
  // Isso evita que eventos sintéticos de 'click' gerados pelo navegador após
  // gestos de touch/tap sejam capturados pelo backdrop recém-renderizado.
  if (Date.now() - mountTime < 300) return
  close()
}

const { registerOpen, registerClose, isAnyBottomSheetOpen } = useBottomSheetState()

// Lock body scroll and compensate scrollbar width to prevent layout shifts
const getScrollbarWidth = () => {
  return window.innerWidth - document.documentElement.clientWidth
}

const lockScroll = () => {
  registerOpen()
  const scrollbarWidth = getScrollbarWidth()
  document.body.style.overflow = 'hidden'
  if (scrollbarWidth > 0) {
    document.documentElement.style.setProperty('--scrollbar-compensate', `${scrollbarWidth}px`)
  }
}

const unlockScroll = () => {
  // Só remove a trava se não houver outros bottomsheets ativos
  if (!isAnyBottomSheetOpen.value) {
    document.body.style.overflow = ''
    document.documentElement.style.setProperty('--scrollbar-compensate', '0px')
  }
}

watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    mountTime = Date.now()
    lockScroll()
  } else {
    // Registra o fechamento lógico no início da transição para liberar o FAB sem delay
    registerClose()
  }
}, { immediate: true })

const onTransitionLeave = () => {
  unlockScroll()
}

onUnmounted(() => {
  if (props.modelValue) {
    registerClose()
    document.body.style.overflow = ''
    document.documentElement.style.setProperty('--scrollbar-compensate', '0px')
  }
})

// Helper: check if all scrollable ancestors inside the bottomsheet are at scrollTop === 0
const isScrollAtTop = (target: HTMLElement, currentTarget: HTMLElement): boolean => {
  let el: HTMLElement | null = target
  while (el && el !== currentTarget) {
    if (el.scrollHeight > el.clientHeight && el.scrollTop > 0) {
      return false
    }
    el = el.parentElement
  }
  return true
}

// Helper: decide whether to start a drag gesture based on interactive elements and scroll state
const shouldStartDrag = (target: HTMLElement, currentTarget: HTMLElement): boolean => {
  if (
    target.closest('button') ||
    target.closest('input') ||
    target.closest('select') ||
    target.closest('textarea') ||
    target.closest('a') ||
    target.closest('[role="button"]') ||
    target.closest('.no-drag')
  ) {
    return false
  }
  return isScrollAtTop(target, currentTarget)
}

// ── Touch drag-to-close ──────────────────────────────────────
const touchStartY = ref(0)
const isDraggingTouch = ref(false)

const onTouchStart = (e: TouchEvent) => {
  const target = e.target as HTMLElement
  const currentTarget = e.currentTarget as HTMLElement

  if (!shouldStartDrag(target, currentTarget)) {
    isDraggingTouch.value = false
    return
  }

  touchStartY.value = e.touches[0].clientY
  isDraggingTouch.value = true
}

const onTouchMove = (e: TouchEvent) => {
  if (!isDraggingTouch.value) return

  const delta = e.touches[0].clientY - touchStartY.value
  if (delta > 0) {
    if (e.cancelable) e.preventDefault()
    const currentTarget = e.currentTarget as HTMLElement
    currentTarget.style.transform = `translateY(${delta}px)`
    currentTarget.style.transition = 'none'
  }
}

const onTouchEnd = (e: TouchEvent) => {
  if (!isDraggingTouch.value) return
  isDraggingTouch.value = false

  const delta = e.changedTouches[0].clientY - touchStartY.value
  const currentTarget = e.currentTarget as HTMLElement
  
  if (delta > 100) {
    // Desliza suavemente a partir do ponto atual até o final
    currentTarget.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    currentTarget.style.transform = 'translateY(100%)'
    close()
  } else {
    // Volta suavemente para o topo
    currentTarget.style.transition = 'transform 0.4s var(--ease-spring)'
    currentTarget.style.transform = 'translateY(0px)'
    setTimeout(() => {
      if (props.modelValue) {
        currentTarget.style.transition = ''
        currentTarget.style.transform = ''
      }
    }, 400)
  }
}

// ── Mouse drag-to-close (desktop) ───────────────────────────
const onMouseDown = (e: MouseEvent) => {
  const target = e.target as HTMLElement
  const currentTarget = e.currentTarget as HTMLElement

  if (!shouldStartDrag(target, currentTarget)) return

  const startY = e.clientY

  const onMove = (ev: MouseEvent) => {
    const delta = ev.clientY - startY
    if (delta > 0) {
      currentTarget.style.transform = `translateY(${delta}px)`
      currentTarget.style.transition = 'none'
    }
  }

  const onUp = (ev: MouseEvent) => {
    const delta = ev.clientY - startY
    
    if (delta > 100) {
      currentTarget.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      currentTarget.style.transform = 'translateY(100%)'
      close()
    } else {
      currentTarget.style.transition = 'transform 0.4s var(--ease-spring)'
      currentTarget.style.transform = 'translateY(0px)'
      setTimeout(() => {
        if (props.modelValue) {
          currentTarget.style.transition = ''
          currentTarget.style.transform = ''
        }
      }, 400)
    }
    
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
  }

  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)
}
</script>

<style scoped>
/* Transição limpa padrão de slide-up e slide-down */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.5s var(--ease-spring);
}
.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
}

/* Fade transition for backdrop */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease-out;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Custom Scrollbar consistent with DESIGN.md */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: var(--color-stone);
  border-radius: 9999px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: #d8d4d0;
}
</style>
