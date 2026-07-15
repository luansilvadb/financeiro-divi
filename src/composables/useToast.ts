import { ref } from 'vue'

interface ToastItem {
  msg: string
  type: 'error' | 'success' | 'info'
  duration: number
}

const visible = ref(false)
const message = ref('')
const type = ref<'error' | 'success' | 'info'>('info')
const queue = ref<ToastItem[]>([])
let timeoutId: ReturnType<typeof setTimeout> | null = null

function processQueue() {
  if (timeoutId) {
    clearTimeout(timeoutId)
    timeoutId = null
  }

  if (queue.value.length === 0) {
    visible.value = false
    return
  }

  const next = queue.value.shift()!
  message.value = next.msg
  type.value = next.type
  visible.value = true

  timeoutId = setTimeout(() => {
    visible.value = false
    // Brief pause between toasts so the transition can finish
    setTimeout(processQueue, 300)
  }, next.duration)
}

export function useToast() {
  const show = (msg: string, t: 'error' | 'success' | 'info' = 'info', duration = 4500) => {
    queue.value.push({ msg, type: t, duration })
    // Start processing only if no toast is currently visible
    if (!visible.value) {
      processQueue()
    }
  }

  const hide = () => {
    visible.value = false
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
    queue.value = []
  }

  return {
    visible,
    message,
    type,
    show,
    hide
  }
}
