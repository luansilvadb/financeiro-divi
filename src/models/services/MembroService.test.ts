import { describe, it, expect, vi } from 'vitest'
import { MembroService } from './MembroService'
import { Membro } from '../entities/Membro'

describe('MembroService', () => {
  it('deve adicionar um membro com sucesso', async () => {
    const mockMembroRepo = {
      salvar: vi.fn().mockResolvedValue(undefined),
      atualizar: vi.fn(),
      listarTodos: vi.fn(),
      buscarPorId: vi.fn()
    }
    const service = new MembroService(mockMembroRepo as any)
    const nome = 'Luan Silva'
    const novoMembro = await service.adicionarMembro(nome)

    expect(novoMembro).toBeInstanceOf(Membro)
    expect(novoMembro.nome).toBe(nome)
    expect(novoMembro.ativo).toBe(true)
    expect(mockMembroRepo.salvar).toHaveBeenCalled()
  })

  it('deve desativar um membro com sucesso', async () => {
    const mockMembroRepo = {
      salvar: vi.fn().mockResolvedValue(undefined),
      atualizar: vi.fn().mockResolvedValue(undefined),
      buscarPorId: vi.fn()
    }
    const service = new MembroService(mockMembroRepo as any)
    await service.desativarMembro('membro-1')

    expect(mockMembroRepo.atualizar).toHaveBeenCalledWith('membro-1', {
      nome: undefined,
      ativo: false,
      role: undefined,
      rendaCentavos: undefined
    })
  })

  it('deve ativar um membro com sucesso', async () => {
    const mockMembroRepo = {
      salvar: vi.fn().mockResolvedValue(undefined),
      atualizar: vi.fn().mockResolvedValue(undefined),
      buscarPorId: vi.fn()
    }
    const service = new MembroService(mockMembroRepo as any)
    await service.ativarMembro('membro-2')

    expect(mockMembroRepo.atualizar).toHaveBeenCalledWith('membro-2', {
      nome: undefined,
      ativo: true,
      role: undefined,
      rendaCentavos: undefined
    })
  })

  it('deve propagar erro do repositorio ao tentar desativar membro inexistente', async () => {
    const mockMembroRepo = {
      atualizar: vi.fn().mockRejectedValue(new Error('membro não encontrado'))
    }
    const service = new MembroService(mockMembroRepo as any)
    await expect(service.desativarMembro('membro-invalido')).rejects.toThrow('membro não encontrado')
  })

  it('deve atualizar o nome de um membro com sucesso', async () => {
    const mockMembroRepo = {
      salvar: vi.fn().mockResolvedValue(undefined),
      atualizar: vi.fn().mockResolvedValue(undefined),
      buscarPorId: vi.fn()
    }
    const service = new MembroService(mockMembroRepo as any)
    await service.atualizarNomeMembro('membro-3', 'Nome Novo')

    expect(mockMembroRepo.atualizar).toHaveBeenCalledWith('membro-3', {
      nome: 'Nome Novo',
      ativo: undefined,
      role: undefined,
      rendaCentavos: undefined
    })
  })

  it('deve propagar erro ao tentar atualizar nome de membro inexistente', async () => {
    const mockMembroRepo = {
      atualizar: vi.fn().mockRejectedValue(new Error('membro não encontrado'))
    }
    const service = new MembroService(mockMembroRepo as any)
    await expect(service.atualizarNomeMembro('membro-invalido', 'Nome Novo')).rejects.toThrow('membro não encontrado')
  })
})
