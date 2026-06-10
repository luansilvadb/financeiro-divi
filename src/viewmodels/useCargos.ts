import { ref } from 'vue'
import { Cargo } from '../models/entities/Cargo'
import { cargoRepository, tenantSessionService } from '../shared/container'
import { createLockingInitializer } from '../shared/utils/initializer'

const cargos = ref<Cargo[]>([])

const { inicializado, inicializar, carregar } = createLockingInitializer(async () => {
  if (tenantSessionService.isAuthenticated() && !tenantSessionService.getActiveTenantId()) {
    cargos.value = []
    return
  }
  cargos.value = await cargoRepository.listarTodos()
})

export function useCargos() {
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
