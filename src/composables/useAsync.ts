import { ref } from 'vue'
import { mensagemErro } from '../shared/utils/mensagemErro'

export function useAsync() {
  const loading = ref(false)
  const errorMsg = ref('')
  let inFlight = 0
  let callCount = 0

  const run = async <T>(task: () => Promise<T>, fallbackMsg = 'Ocorreu um erro inesperado'): Promise<T | undefined> => {
    const myCall = ++callCount
    inFlight++
    loading.value = true
    errorMsg.value = ''
    try {
      return await task()
    } catch (e) {
      // Only surface the error if this was the most recent call.
      // Otherwise a later call's result (success or failure) supersedes it.
      if (myCall === callCount) {
        errorMsg.value = mensagemErro(e, fallbackMsg)
      }
      return undefined
    } finally {
      inFlight--
      if (inFlight <= 0) {
        inFlight = 0
        loading.value = false
      }
    }
  }

  return {
    loading,
    errorMsg,
    run
  }
}
