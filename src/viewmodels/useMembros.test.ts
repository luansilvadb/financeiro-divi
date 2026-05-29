import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useMembros } from './useMembros'
import { Membro } from '../models/entities/Membro'

describe('useMembros', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve iniciar vazio se o repositório estiver vazio', async () => {
    const mockRepo = {
      listarTodos: vi.fn().mockResolvedValue([]),
      salvar: vi.fn(),
      buscarPorId: vi.fn()
    }
    const mockService = {
      adicionarMembro: vi.fn(),
      desativarMembro: vi.fn(),
      ativarMembro: vi.fn()
    }

    const { membros, carregar } = useMembros({ membroRepository: mockRepo, membroService: mockService as any })
    await carregar()

    expect(membros.value.length).toBe(0)
    expect(mockRepo.listarTodos).toHaveBeenCalled()
  })

  it('deve adicionar um novo membro delegando ao MembroService', async () => {
    const mockRepo = {
      listarTodos: vi.fn().mockResolvedValue([]),
      salvar: vi.fn(),
      buscarPorId: vi.fn()
    }
    const mockService = {
      adicionarMembro: vi.fn().mockResolvedValue(new Membro({ id: 'm1', nome: 'Novo Membro' })),
      desativarMembro: vi.fn(),
      ativarMembro: vi.fn()
    }

    // Na primeira chamada, carregar inicializa. Simulamos listarTodos retornando o membro após adição.
    let listCounter = 0
    mockRepo.listarTodos.mockImplementation(async () => {
      listCounter++
      if (listCounter > 1) {
        return [new Membro({ id: 'm1', nome: 'Novo Membro' })]
      }
      return []
    })

    const { membros, adicionarMembro, carregar } = useMembros({ membroRepository: mockRepo, membroService: mockService as any })
    await carregar()

    await adicionarMembro('Novo Membro')

    expect(mockService.adicionarMembro).toHaveBeenCalledWith('Novo Membro', undefined, undefined)
    expect(membros.value.length).toBe(1)
    expect(membros.value[0].nome).toBe('Novo Membro')
  })

  it('deve desativar um membro delegando ao MembroService', async () => {
    const membroAtivo = new Membro({ id: 'm-ativo', nome: 'Membro Ativo', ativo: true })
    const mockRepo = {
      listarTodos: vi.fn().mockResolvedValue([membroAtivo]),
      salvar: vi.fn(),
      buscarPorId: vi.fn()
    }
    const mockService = {
      adicionarMembro: vi.fn(),
      desativarMembro: vi.fn().mockResolvedValue(undefined),
      ativarMembro: vi.fn()
    }

    let listCounter = 0
    mockRepo.listarTodos.mockImplementation(async () => {
      listCounter++
      if (listCounter > 1) {
        return [new Membro({ id: 'm-ativo', nome: 'Membro Ativo', ativo: false })]
      }
      return [membroAtivo]
    })

    const { ativos, desativarMembro, carregar } = useMembros({ membroRepository: mockRepo, membroService: mockService as any })
    await carregar()

    expect(ativos.value.length).toBe(1)

    await desativarMembro('m-ativo')

    expect(mockService.desativarMembro).toHaveBeenCalledWith('m-ativo', expect.any(Object))
    expect(ativos.value.length).toBe(0)
  })
})
