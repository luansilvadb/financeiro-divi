import { ref } from 'vue'
import { Cargo } from '../models/entities/Cargo'
import { cargoRepository, tenantSessionService } from '../shared/container'

const cargos = ref<Cargo[]>([])
const inicializado = ref(false)
let promiseInicializacao: Promise<void> | null = null

export function useCargos() {
  const carregar = async () => {
    if (tenantSessionService.isAuthenticated() && !tenantSessionService.getActiveTenantId()) {
      cargos.value = []
      inicializado.value = true
      return
    }
    const lista = await cargoRepository.listarTodos()
    cargos.value = lista
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

  const salvarCargo = async (nome: string, permissoes: string[], cor?: string, id?: string) => {
    const cargo = new Cargo({
      id: id || '',
      nome,
      permissoes,
      cor
    })
    await cargoRepository.salvar(cargo)
    await carregar()
  }

  const excluirCargo = async (id: string) => {
    await cargoRepository.excluir(id)
    await carregar()
  }

  return {
    cargos,
    inicializado,
    inicializar,
    carregar,
    salvarCargo,
    excluirCargo
  }
}
