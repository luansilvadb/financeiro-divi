import { ref, computed } from 'vue'
import { Membro } from '../model/domain/Membro'
import type { IMembroRepository } from '../model/repositories/IMembroRepository'
import { MembroService } from '../model/services/MembroService'
import { LocalStorageMembroRepository } from '../infrastructure/local/LocalStorageMembroRepository'

export interface MembrosDependencies {
  membroRepository?: IMembroRepository
  membroService?: MembroService
}

const defaultRepo = new LocalStorageMembroRepository()
const defaultService = new MembroService(defaultRepo)
const membros = ref<Membro[]>([])
const inicializado = ref(false)
let promiseInicializacao: Promise<void> | null = null

export function useMembros(dependencies: MembrosDependencies = {}) {
  const repo = dependencies.membroRepository || defaultRepo
  const service = dependencies.membroService || defaultService

  const ativos = computed(() => membros.value.filter(m => m.ativo))

  // ✅ Usado para sincronismo: sempre relê do disco
  const carregar = async () => {
    let lista = await repo.listarTodos()
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
    await service.adicionarMembro(nome)
    await carregar()
  }

  const desativarMembro = async (id: string) => {
    await service.desativarMembro(id)
    await carregar()
  }

  const ativarMembro = async (id: string) => {
    await service.ativarMembro(id)
    await carregar()
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
    ativarMembro,
    inicializar,
    carregar
  }
}
