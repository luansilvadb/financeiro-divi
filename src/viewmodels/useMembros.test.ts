import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useMembros } from './useMembros'
import { Membro } from '../models/entities/Membro'

vi.mock('../shared/container', () => ({
  membroRepository: {
    listarTodos: vi.fn().mockResolvedValue([]),
    salvar: vi.fn(),
    buscarPorId: vi.fn()
  },
  membroService: {
    adicionarMembro: vi.fn(),
    desativarMembro: vi.fn(),
    ativarMembro: vi.fn(),
    atualizarCargoMembro: vi.fn()
  },
  tenantSessionService: {
    isAuthenticated: () => true,
    getActiveTenantId: () => 't1'
  }
}))

import { membroRepository, membroService } from '../shared/container'

describe('useMembros', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve iniciar vazio se o repositório estiver vazio', async () => {
    const { membros, carregar } = useMembros()
    await carregar()

    expect(membros.value.length).toBe(0)
    expect(membroRepository.listarTodos).toHaveBeenCalled()
  })

  it('deve adicionar um novo membro delegando ao MembroService', async () => {
    let listCounter = 0
    vi.mocked(membroRepository.listarTodos).mockImplementation(async () => {
      listCounter++
      if (listCounter > 1) {
        return [new Membro({ id: 'm1', nome: 'Novo Membro' })]
      }
      return []
    })

    const { membros, adicionarMembro, carregar } = useMembros()
    await carregar()

    await adicionarMembro('Novo Membro')

    expect(membroService.adicionarMembro).toHaveBeenCalledWith('Novo Membro', undefined, undefined)
    expect(membros.value.length).toBe(1)
    expect(membros.value[0].nome).toBe('Novo Membro')
  })

  it('deve desativar um membro delegando ao MembroService', async () => {
    const membroAtivo = new Membro({ id: 'm-ativo', nome: 'Membro Ativo', ativo: true })
    let listCounter = 0
    vi.mocked(membroRepository.listarTodos).mockImplementation(async () => {
      listCounter++
      if (listCounter > 1) {
        return [new Membro({ id: 'm-ativo', nome: 'Membro Ativo', ativo: false })]
      }
      return [membroAtivo]
    })

    const { ativos, desativarMembro, carregar } = useMembros()
    await carregar()

    expect(ativos.value.length).toBe(1)

    await desativarMembro('m-ativo')

    expect(membroService.desativarMembro).toHaveBeenCalledWith('m-ativo')
    expect(ativos.value.length).toBe(0)
  })

  it('deve atualizar o cargo de um membro delegando ao MembroService', async () => {
    const membro = new Membro({ id: 'm1', nome: 'Membro', role: 'MORADOR' })
    let listCounter = 0
    vi.mocked(membroRepository.listarTodos).mockImplementation(async () => {
      listCounter++
      if (listCounter > 1) {
        return [new Membro({ id: 'm1', nome: 'Membro', role: 'ADMIN' })]
      }
      return [membro]
    })

    const { membros, atualizarCargoMembro, carregar } = useMembros()
    await carregar()

    await atualizarCargoMembro('m1', 'ADMIN')

    expect(membroService.atualizarCargoMembro).toHaveBeenCalledWith('m1', 'ADMIN', undefined)
    expect(membros.value[0].role).toBe('ADMIN')
  })
})
