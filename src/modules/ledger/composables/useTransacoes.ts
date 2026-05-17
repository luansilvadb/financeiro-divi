import { ref } from 'vue'
import { Transacao } from '../core/domain/Transacao'
import { LocalStorageTransacaoRepository } from '../adapters/LocalStorageTransacaoRepository'

// Estado global compartilhado por todas as instâncias (Singleton)
const transacoes = ref<Transacao[]>([])
const inicializado = ref(false)
const repository = new LocalStorageTransacaoRepository()

export function useTransacoes() {
  const carregar = async () => {
    transacoes.value = await repository.listarTodas()
    inicializado.value = true
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
