import { ref, onMounted, computed } from 'vue'
import { Membro } from '../core/domain/Membro'
import { LocalStorageMembroRepository } from '../adapters/LocalStorageMembroRepository'

// Estado global compartilhado por todas as instâncias do composable (Singleton)
const repository = new LocalStorageMembroRepository()
const membros = ref<Membro[]>([])
const carregado = ref(false)

export function useMembros() {
  const ativos = computed(() => membros.value.filter(m => m.ativo))

  const carregar = async () => {
    let lista = await repository.listarTodos()
    
    // Migração inicial: Se vazio, popula com os hardcoded
    if (lista.length === 0) {
      const iniciais = [
        { id: 'luan', nome: 'Luan' },
        { id: 'maria', nome: 'Maria' },
        { id: 'joao', nome: 'João' },
        { id: 'paula', nome: 'Paula' }
      ]
      for (const m of iniciais) {
        const novo = new Membro(m)
        await repository.salvar(novo)
      }
      lista = await repository.listarTodos()
    }
    
    membros.value = lista
    carregado.value = true
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

  onMounted(async () => {
    if (!carregado.value) {
      await carregar()
    }
  })

  return {
    membros,
    ativos,
    adicionarMembro,
    desativarMembro,
    carregar
  }
}
