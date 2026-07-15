<script setup lang="ts">
import { ref, onErrorCaptured, onMounted, onUnmounted, nextTick } from 'vue'

const hasError = ref(false)
const errorMessage = ref('')
const errorKey = ref(0)

// Catch render/lifecycle/watcher errors
onErrorCaptured((err: unknown) => {
  hasError.value = true
  errorMessage.value = err instanceof Error ? err.message : String(err)
  return false // Prevent propagation
})

// Catch unhandled promise rejections (async errors)
function onUnhandledRejection(event: PromiseRejectionEvent) {
  hasError.value = true
  errorMessage.value = event.reason instanceof Error
    ? event.reason.message
    : String(event.reason)
  event.preventDefault()
}

// Catch errors thrown in event handlers / setTimeout / etc.
function onGlobalError(event: ErrorEvent) {
  hasError.value = true
  errorMessage.value = event.message || 'Erro inesperado'
  event.preventDefault()
}

onMounted(() => {
  window.addEventListener('unhandledrejection', onUnhandledRejection)
  window.addEventListener('error', onGlobalError)
})

onUnmounted(() => {
  window.removeEventListener('unhandledrejection', onUnhandledRejection)
  window.removeEventListener('error', onGlobalError)
})

// Reset causes a full re-mount of the slot content via key change
function reset() {
  hasError.value = false
  errorMessage.value = ''
  errorKey.value++
  nextTick(() => {
    // Give Vue a tick to process the reset
  })
}
</script>

<template>
  <div v-if="hasError" class="flex flex-col items-center justify-center p-8 text-center">
    <p class="text-sm text-coral font-bold mb-2">Algo deu errado</p>
    <p class="text-xs text-graphite mb-4 max-w-md">{{ errorMessage }}</p>
    <button
      class="mt-2 px-6 py-2.5 text-sm font-bold rounded-full bg-midnight text-white transition-all duration-200 hover:scale-105 active:scale-95"
      @click="reset"
    >
      Tentar novamente
    </button>
  </div>
  <slot v-else :key="errorKey" />
</template>
