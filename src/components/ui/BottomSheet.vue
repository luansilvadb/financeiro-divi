<template>
  <!-- Backdrop overlay - fixed, doesn't move with bottom sheet -->
  <Transition name="fade">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-40 bg-black/40 transition-opacity duration-300"
      @click="close"
    />
  </Transition>

  <!-- Wrapper centradora do BottomSheet para alinhamento horizontal no desktop -->
  <Transition name="slide-up">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-50 flex justify-center items-end p-0 pointer-events-none"
    >
      <div
        class="pointer-events-auto relative flex flex-col bg-card border-t border-x border-stone shadow-lg transition-all duration-300 text-graphite
               rounded-t-card-lg md:rounded-t-card rounded-b-none max-h-[90dvh] w-full"
        :class="widthClass"
        :style="{ maxHeight }"
        @touchstart="onTouchStart"
        @touchmove="onTouchMove"
        @touchend="onTouchEnd"
        @mousedown="onMouseDown"
      >
        <!-- Drag handle -->
        <div class="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing shrink-0">
          <div class="h-1 w-10 rounded-full bg-stone" />
        </div>

        <!-- Header -->
        <div v-if="title || $slots.header" class="flex items-center justify-between px-5 pb-3 shrink-0">
          <slot name="header">
            <h2 class="text-heading text-charcoal">{{ title }}</h2>
          </slot>
          <button
            v-if="showClose"
            class="rounded-full p-1.5 text-ash transition hover:bg-stone hover:text-charcoal cursor-pointer"
            @click="close"
          >
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Divider -->
        <div v-if="title || $slots.header" class="h-px bg-stone shrink-0" />

        <!-- Content -->
        <slot />
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'
import { useBottomSheetState } from '../../composables/useBottomSheetState'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: '' },
  showClose: { type: Boolean, default: true },
  maxHeight: { type: String, default: '90dvh' },
  widthClass: { type: String, default: 'md:w-[480px]' }
})

const emit = defineEmits(['update:modelValue'])

const close = () => emit('update:modelValue', false)

const { registerOpen, registerClose } = useBottomSheetState()

// Lock body scroll when bottom sheet is open
watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    registerOpen()
    document.body.style.overflow = 'hidden'
  } else {
    registerClose()
    document.body.style.overflow = ''
  }
}, { immediate: true })

onUnmounted(() => {
  if (props.modelValue) {
    registerClose()
    document.body.style.overflow = ''
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
  
  // Limpa estilos de arrasto inline para permitir que a transição padrão do CSS atue
  currentTarget.style.transition = ''
  currentTarget.style.transform = ''
  
  if (delta > 100) {
    close()
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
    // Limpa estilos de arrasto inline para permitir que a transição padrão do CSS atue
    currentTarget.style.transition = ''
    currentTarget.style.transform = ''
    
    if (delta > 100) {
      close()
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
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
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
</style>
