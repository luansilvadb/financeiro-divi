import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useCargos } from './useCargos'
import { Cargo } from '../models/entities/Cargo'

vi.mock('../shared/container', () => ({
  cargoRepository: {
    listarTodos: vi.fn().mockResolvedValue([]),
    salvar: vi.fn(),
    excluir: vi.fn()
  },
  tenantSessionService: {
    isAuthenticated: () => true,
    getActiveTenantId: () => 't1'
  }
}))

import { cargoRepository } from '../shared/container'

describe('useCargos', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve iniciar vazio se o repositório estiver vazio', async () => {
    const { cargos, carregar } = useCargos()
    await carregar()

    expect(cargos.value.length).toBe(0)
    expect(cargoRepository.listarTodos).toHaveBeenCalled()
  })

  it('deve salvar um novo cargo delegando ao cargoRepository', async () => {
    let listCounter = 0
    vi.mocked(cargoRepository.listarTodos).mockImplementation(async () => {
      listCounter++
      if (listCounter > 1) {
        return [new Cargo({ id: 'c1', nome: 'Financeiro', cor: '#fff', permissoes: ['gastos'] })]
      }
      return []
    })

    const { cargos, salvarCargo, carregar } = useCargos()
    await carregar()

    await salvarCargo('Financeiro', ['gastos'], '#fff')

    expect(cargoRepository.salvar).toHaveBeenCalledWith(
      expect.objectContaining({
        nome: 'Financeiro',
        cor: '#fff',
        permissoes: ['gastos']
      })
    )
    expect(cargos.value.length).toBe(1)
    expect(cargos.value[0].nome).toBe('Financeiro')
  })

  it('deve excluir um cargo delegando ao cargoRepository', async () => {
    const cargo = new Cargo({ id: 'c1', nome: 'Financeiro', cor: '#fff', permissoes: ['gastos'] })
    let listCounter = 0
    vi.mocked(cargoRepository.listarTodos).mockImplementation(async () => {
      listCounter++
      if (listCounter > 1) {
        return []
      }
      return [cargo]
    })

    const { cargos, excluirCargo, carregar } = useCargos()
    await carregar()
    expect(cargos.value.length).toBe(1)

    await excluirCargo('c1')

    expect(cargoRepository.excluir).toHaveBeenCalledWith('c1')
    expect(cargos.value.length).toBe(0)
  })
})
