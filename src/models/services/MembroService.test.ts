import { describe, it, expect, vi } from 'vitest'
import { MembroService } from './MembroService'
import { Membro } from '../entities/Membro'

describe('MembroService', () => {
  it('deve adicionar um membro com sucesso', async () => {
    const mockMembroRepo = {
      salvar: vi.fn().mockResolvedValue(undefined),
      listarTodos: vi.fn(),
      buscarPorId: vi.fn()
    }

    const service = new MembroService(mockMembroRepo)
    const nome = 'Luan Silva'
    const novoMembro = await service.adicionarMembro(nome)

    expect(novoMembro).toBeInstanceOf(Membro)
    expect(novoMembro.nome).toBe(nome)
    expect(novoMembro.ativo).toBe(true)
    expect(mockMembroRepo.salvar).toHaveBeenCalledWith(novoMembro)
  })

  it('deve desativar um membro com sucesso', async () => {
    const membroExistente = new Membro({
      id: 'membro-1',
      nome: 'Membro Teste',
      ativo: true
    })

    const mockMembroRepo = {
      salvar: vi.fn().mockResolvedValue(undefined),
      listarTodos: vi.fn(),
      buscarPorId: vi.fn().mockResolvedValue(membroExistente)
    }

    const service = new MembroService(mockMembroRepo)
    await service.desativarMembro('membro-1')

    expect(mockMembroRepo.buscarPorId).toHaveBeenCalledWith('membro-1')
    expect(mockMembroRepo.salvar).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'membro-1',
        nome: 'Membro Teste',
        ativo: false
      })
    )
  })

  it('deve ativar um membro com sucesso', async () => {
    const membroExistente = new Membro({
      id: 'membro-2',
      nome: 'Membro Inativo',
      ativo: false
    })

    const mockMembroRepo = {
      salvar: vi.fn().mockResolvedValue(undefined),
      listarTodos: vi.fn(),
      buscarPorId: vi.fn().mockResolvedValue(membroExistente)
    }

    const service = new MembroService(mockMembroRepo)
    await service.ativarMembro('membro-2')

    expect(mockMembroRepo.buscarPorId).toHaveBeenCalledWith('membro-2')
    expect(mockMembroRepo.salvar).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'membro-2',
        nome: 'Membro Inativo',
        ativo: true
      })
    )
  })

  it('deve lancar erro ao tentar desativar membro inexistente', async () => {
    const mockMembroRepo = {
      salvar: vi.fn(),
      listarTodos: vi.fn(),
      buscarPorId: vi.fn().mockResolvedValue(null)
    }

    const service = new MembroService(mockMembroRepo)
    await expect(service.desativarMembro('membro-invalido')).rejects.toThrow('Membro não encontrado')
  })
})
