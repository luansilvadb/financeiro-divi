import { ref, computed } from 'vue'
import { Membro } from '../core/domain/Membro'
import { LocalStorageMembroRepository } from '../adapters/LocalStorageMembroRepository'

// Estado global compartilhado por todas as instâncias do composable (Singleton)
const repository = new LocalStorageMembroRepository()
const membros = ref<Membro[]>([])
const inicializado = ref(false)
let promiseInicializacao: Promise<void> | null = null

export function useMembros() {
  const ativos = computed(() => membros.value.filter(m => m.ativo))

  // ✅ Usado para sincronismo: sempre relê do disco
  const carregar = async () => {
    let lista = await repository.listarTodos()
    
    membros.value = lista
    inicializado.value = true
  }

  // ✅ Usado no boot: garante apenas uma leitura simultânea no carregamento inicial
  const inicializar = async () => {
    if (promiseInicializacao) return promiseInicializacao
    promiseInicializacao = carregar()
    return promiseInicializacao
  }

  const adicionarMembro = async (nome: string) => {
    const novo = new Membro({ id: crypto.randomUUID(), nome })
    await repository.salvar(novo)
    await carregar()
  }

  const desativarMembro = async (id: string) => {
    const membro = await repository.buscarPorId(id)
    if (membro) {
      const atualizado = new Membro({ ...membro, ativo: false })
      await repository.salvar(atualizado)
      await carregar()
    }
  }

  // Garantir carregamento inicial lazy
  if (!inicializado.value) {
    inicializar()
  }

  return {
    membros,
    ativos,
    adicionarMembro,
    desativarMembro,
    inicializar,
    carregar
  }
}
