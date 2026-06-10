import { ref } from 'vue'

/**
 * Creates a locking initializer that prevents concurrent initializations.
 * Useful for singleton-like stores in viewmodels.
 */
export function createLockingInitializer(loadFn: () => Promise<void>) {
  const inicializado = ref(false)
  let promiseInicializacao: Promise<void> | null = null

  const carregar = async () => {
    await loadFn()
    inicializado.value = true
  }

  const inicializar = async () => {
    if (inicializado.value) return
    if (promiseInicializacao) return promiseInicializacao

    promiseInicializacao = carregar().finally(() => {
      promiseInicializacao = null
    })

    return promiseInicializacao
  }

  return {
    inicializado,
    inicializar,
    carregar
  }
}
