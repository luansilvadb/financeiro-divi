import { ref } from 'vue'
import { mensagemErro } from '../shared/utils/mensagemErro'

export function useAsync() {
  const loading = ref(false)
  const errorMsg = ref('')

  const run = async <T>(task: () => Promise<T>, fallbackMsg = 'Ocorreu um erro inesperado'): Promise<T | undefined> => {
    loading.value = true
    errorMsg.value = ''
    try {
      return await task()
    } catch (e) {
      errorMsg.value = mensagemErro(e, fallbackMsg)
      return undefined
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    errorMsg,
    run
  }
}
