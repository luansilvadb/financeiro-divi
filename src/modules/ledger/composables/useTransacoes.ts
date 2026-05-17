import { ref } from 'vue'
import { Transacao } from '../core/domain/Transacao'
import { LocalStorageTransacaoRepository } from '../adapters/LocalStorageTransacaoRepository'

// Estado global compartilhado por todas as instâncias (Singleton)
const transacoes = ref<Transacao[]>([])
const inicializado = ref(false)
let promiseInicializacao: Promise<void> | null = null
const repository = new LocalStorageTransacaoRepository()

export function useTransacoes() {
  // ✅ Usado para sincronismo: sempre relê do disco
  const carregar = async () => {
    transacoes.value = await repository.listarTodas()
    inicializado.value = true
  }

  // ✅ Usado no boot: garante apenas uma leitura simultânea no carregamento inicial
  const inicializar = async () => {
    if (promiseInicializacao) return promiseInicializacao
    promiseInicializacao = carregar()
    return promiseInicializacao
  }

  const salvar = async (t: Transacao) => {
    await repository.salvar(t)
    await carregar()
  }

  // Inicialização lazy garantida
  if (!inicializado.value) {
    inicializar()
  }

  return { 
    transacoes, 
    inicializar,
    carregar, 
    salvar 
  }
}
