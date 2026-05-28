import { ref } from 'vue'

const visible = ref(false)
const message = ref('')
const type = ref<'error' | 'success' | 'info'>('info')
let timeoutId: any = null

export function useToast() {
  const show = (msg: string, t: 'error' | 'success' | 'info' = 'info', duration = 4500) => {
    message.value = msg
    type.value = t
    visible.value = true
    
    if (timeoutId) clearTimeout(timeoutId)
    timeoutId = setTimeout(() => {
      visible.value = false
    }, duration)
  }

  const hide = () => {
    visible.value = false
    if (timeoutId) clearTimeout(timeoutId)
  }

  return {
    visible,
    message,
    type,
    show,
    hide
  }
}
