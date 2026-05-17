<template>
  <Transition name="slide-up">
    <!-- Wrapper centered layout -->
    <div
      v-if="modelValue"
      class="fixed inset-0 z-50 pointer-events-none flex items-center justify-center p-4 sm:p-6"
    >
      <!-- Sheet -->
      <div
        class="pointer-events-auto flex flex-col bg-card border border-stone-surface shadow-2xl transition-all duration-300 text-graphite rounded-cards max-h-[90dvh]"
        :class="widthClass"
        :style="{ maxHeight }"
        @touchstart="onTouchStart"
        @touchmove="onTouchMove"
        @touchend="onTouchEnd"
      >
        <!-- Drag handle -->
        <div class="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing shrink-0" @mousedown="onMouseDown">
          <div class="h-1 w-10 rounded-full bg-stone-surface" />
        </div>

        <!-- Header -->
        <div v-if="title || $slots.header" class="flex items-center justify-between px-5 pb-3 shrink-0">
          <slot name="header">
            <h2 class="text-lg font-semibold text-charcoal">{{ title }}</h2>
          </slot>
          <button
            v-if="showClose"
            class="rounded-full p-1.5 text-ash transition hover:bg-stone-surface hover:text-charcoal cursor-pointer"
            @click="close"
          >
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Divider -->
        <div v-if="title || $slots.header" class="h-px bg-stone-surface shrink-0" />

        <!-- Content -->
        <slot />
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: '' },
  showClose: { type: Boolean, default: true },
  maxHeight: { type: String, default: '90dvh' },
  widthClass: { type: String, default: 'w-full md:w-[480px]' }
})

const emit = defineEmits(['update:modelValue'])

const close = () => emit('update:modelValue', false)

// ── Touch drag-to-close ──────────────────────────────────────
const touchStartY = ref(0)

const onTouchStart = (e: TouchEvent) => {
  touchStartY.value = e.touches[0].clientY
}

const onTouchMove = (e: TouchEvent) => {
  const delta = e.touches[0].clientY - touchStartY.value
  if (delta > 0) {
    const target = e.currentTarget as HTMLElement
    target.style.transform = `translateY(${delta}px)`
    target.style.transition = 'none'
  }
}

const onTouchEnd = (e: TouchEvent) => {
  const delta = e.changedTouches[0].clientY - touchStartY.value
  const target = e.currentTarget as HTMLElement
  target.style.transition = ''
  target.style.transform = ''
  if (delta > 100) close()
}

// ── Mouse drag-to-close (desktop) ───────────────────────────
const onMouseDown = (e: MouseEvent) => {
  const startY = e.clientY
  const dragHandle = e.currentTarget as HTMLElement
  const sheet = dragHandle.parentElement

  if (!sheet) return

  const onMove = (ev: MouseEvent) => {
    const delta = ev.clientY - startY
    if (delta > 0) {
      sheet.style.transform = `translateY(${delta}px)`
      sheet.style.transition = 'none'
    }
  }

  const onUp = (ev: MouseEvent) => {
    sheet.style.transition = ''
    sheet.style.transform = ''
    if (ev.clientY - startY > 100) close()
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
  }

  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)
}
</script>

<style scoped>
/* Sheet */
.slide-up-enter-active,
.slide-up-leave-active { transition: transform 0.35s cubic-bezier(0.32, 0.72, 0, 1); }
.slide-up-enter-from,
.slide-up-leave-to    { transform: translateY(100vh); }
</style>
