import { ref, computed } from 'vue'
import { Membro } from '../models/entities/Membro'
import type { IMembroRepository } from '../models/repositories/IMembroRepository'
import type { IMembroService } from '../models/services/IMembroService'
import { membroRepository, membroService, tenantSessionService } from '../shared/container'
import { obterPeriodoSelecionado } from '../shared/utils/periodoStorage'

export interface MembrosDependencies {
  membroRepository?: IMembroRepository
  membroService?: IMembroService
}

const defaultRepo = membroRepository
const defaultService = membroService
const membros = ref<Membro[]>([])
const inicializado = ref(false)
let promiseInicializacao: Promise<void> | null = null

export function useMembros(dependencies: MembrosDependencies = {}) {
  const repo = dependencies.membroRepository || defaultRepo
  const service = dependencies.membroService || defaultService

  const ativos = computed(() => membros.value.filter(m => m.ativo))

  const carregar = async () => {
    // Não faz fetch se não há tenant ativo
    if (tenantSessionService.isAuthenticated() && !tenantSessionService.getActiveTenantId()) {
      membros.value = []
      inicializado.value = true
      return
    }
    let lista = await repo.listarTodos()
    membros.value = lista
    inicializado.value = true
  }

  const inicializar = async () => {
    // Se já foi inicializado com sucesso, não refaz
    if (inicializado.value) return
    // Se há uma promise em andamento, aguarda ela
    if (promiseInicializacao) return promiseInicializacao
    promiseInicializacao = carregar().catch((err) => {
      // Em caso de erro, reseta para permitir retry
      promiseInicializacao = null
      throw err
    })
    return promiseInicializacao
  }

  const adicionarMembro = async (nome: string, username?: string, password?: string) => {
    await service.adicionarMembro(nome, username, password)
    await carregar()
  }

  const desativarMembro = async (id: string) => {
    const periodo = obterPeriodoSelecionado()
    await service.desativarMembro(id, periodo)
    await carregar()
  }

  const ativarMembro = async (id: string) => {
    await service.ativarMembro(id)
    await carregar()
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
