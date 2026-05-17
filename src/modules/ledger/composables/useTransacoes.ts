import { ref } from 'vue'
import { Transacao } from '../core/domain/Transacao'
import { LocalStorageTransacaoRepository } from '../adapters/LocalStorageTransacaoRepository'

// Estado global compartilhado por todas as instâncias (Singleton)
const transacoes = ref<Transacao[]>([])
const inicializado = ref(false)
let carregandoPromise: Promise<void> | null = null
const repository = new LocalStorageTransacaoRepository()

export function useTransacoes() {
  const carregar = async () => {
    // Se já estiver carregando, retorna a promessa existente
    if (carregandoPromise) return carregandoPromise

    carregandoPromise = (async () => {
      try {
        transacoes.value = await repository.listarTodas()
        inicializado.value = true
      } finally {
        carregandoPromise = null
      }
    })()

    return carregandoPromise
  }

  const salvar = async (t: Transacao) => {
    await repository.salvar(t)
    await carregar()
  }

  // Inicialização lazy garantida: se já não estiver inicializado, dispara o carregamento
  if (!inicializado.value) {
    carregar()
  }

  return { 
    transacoes, 
    carregar, 
    salvar 
  }
}
