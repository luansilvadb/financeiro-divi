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
    // Não faz fetch se não há tenant ativo
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

  return {
    membros,
    ativos,
    currentMembro,
    adicionarMembro,
    desativarMembro,
    ativarMembro,
    atualizarCargoMembro,
    inicializar,
    carregar
  }
}
