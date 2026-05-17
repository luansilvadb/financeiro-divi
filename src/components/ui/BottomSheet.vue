<template>
  <!-- Backdrop -->
  <Transition name="fade">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
      @click="close"
    />
  </Transition>

  <!-- Sheet -->
  <Transition :name="centered ? 'zoom' : 'slide-up'">
    <div
      v-if="modelValue"
      :class="[
        'fixed z-50 flex flex-col bg-card border border-stone-surface shadow-2xl transition-all duration-300 text-graphite',
        centered
          ? 'inset-x-4 top-1/2 -translate-y-1/2 rounded-2xl sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-md'
          : 'inset-x-0 bottom-0 rounded-t-2xl'
      ]"
      :style="{ maxHeight: centered ? 'auto' : maxHeight }"
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
      <div class="overflow-y-auto overscroll-contain px-5 py-4 flex-grow custom-scrollbar">
        <slot />
      </div>

      <!-- Footer -->
      <div v-if="$slots.footer" class="border-t border-stone-surface px-5 py-4 shrink-0">
        <slot name="footer" />
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = withDefaults(defineProps<{
  modelValue?: boolean
  title?: string
  showClose?: boolean
  maxHeight?: string
  centered?: boolean
  widthClass?: string
}>(), {
  modelValue: false,
  title: '',
  showClose: true,
  maxHeight: '90dvh',
  centered: true,
  widthClass: ''
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

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
    const isMobile = window.innerWidth < 640
    if (props.centered) {
      target.style.transform = isMobile
        ? `translateY(calc(-50% + ${delta}px))`
        : `translate(-50%, calc(-50% + ${delta}px))`
    } else {
      target.style.transform = `translateY(${delta}px)`
    }
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
      const isMobile = window.innerWidth < 640
      if (props.centered) {
        sheet.style.transform = isMobile
          ? `translateY(calc(-50% + ${delta}px))`
          : `translate(-50%, calc(-50% + ${delta}px))`
      } else {
        sheet.style.transform = `translateY(${delta}px)`
      }
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
/* Backdrop */
.fade-enter-active,
.fade-leave-active { transition: opacity 0.25s ease; }
.fade-enter-from,
.fade-leave-to    { opacity: 0; }

/* Sheet — slide up (bottom) */
.slide-up-enter-active,
.slide-up-leave-active { transition: transform 0.35s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.35s ease; }
.slide-up-enter-from,
.slide-up-leave-to    { transform: translateY(100%); opacity: 0; }

/* Sheet — zoom (centered) */
.zoom-enter-active,
.zoom-leave-active { transition: transform 0.25s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.25s ease; }

@media (min-width: 640px) {
  .zoom-enter-from,
  .zoom-leave-to { transform: translateY(-48%) translateX(-50%) scale(0.95); opacity: 0; }
}
@media (max-width: 639px) {
  .zoom-enter-from,
  .zoom-leave-to { transform: translateY(-48%) scale(0.95); opacity: 0; }
}

.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: var(--color-stone-surface);
  border-radius: 9999px;
}
</style>
