import { ref, computed } from 'vue'
import { Membro, type MembroRole } from '../models/entities/Membro'

import { membroRepository, membroService, tenantSessionService } from '../shared/container'
const membros = ref<Membro[]>([])
const inicializado = ref(false)
let promiseInicializacao: Promise<void> | null = null

export function useMembros() {

  const ativos = computed(() => membros.value.filter(m => m.ativo))

  const currentMembro = computed(() => {
    const currentUserId = tenantSessionService.getCurrentUserId()
    return membros.value.find(m => m.userId === currentUserId)
  })

  const carregar = async () => {
    if (tenantSessionService.isAuthenticated() && !tenantSessionService.getActiveTenantId()) {
      membros.value = []
      inicializado.value = true
      return
    }
    let lista = await membroRepository.listarTodos()
    membros.value = lista
    inicializado.value = true
  }

  const inicializar = async () => {
    if (inicializado.value) return
    if (promiseInicializacao) return promiseInicializacao
    promiseInicializacao = carregar().catch((err) => {
      promiseInicializacao = null
      throw err
    })
    return promiseInicializacao
  }

  const adicionarMembro = async (nome: string, username?: string, password?: string) => {
    await membroService.adicionarMembro(nome, username, password)
    await carregar()
  }

  const desativarMembro = async (id: string) => {
    await membroService.desativarMembro(id)
    await carregar()
  }

  const ativarMembro = async (id: string) => {
    await membroService.ativarMembro(id)
    await carregar()
  }

  const atualizarCargoMembro = async (id: string, role: MembroRole, cargoId?: string) => {
    await membroService.atualizarCargoMembro(id, role, cargoId)
    await carregar()
  }

  const atualizarNomeMembro = async (id: string, nome: string) => {
    await membroService.atualizarNomeMembro(id, nome)
    await carregar()
  }

  return {
    membros,
    ativos,
    currentMembro,
    adicionarMembro,
    desativarMembro,
    ativarMembro,
    atualizarCargoMembro,
    atualizarNomeMembro,
    inicializar,
    carregar
  }
}
