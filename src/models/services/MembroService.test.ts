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
    const service = new MembroService(mockMembroRepo as any)
    const nome = 'Luan Silva'
    const novoMembro = await service.adicionarMembro(nome)

    expect(novoMembro).toBeInstanceOf(Membro)
    expect(novoMembro.nome).toBe(nome)
    expect(novoMembro.ativo).toBe(true)
    expect(mockMembroRepo.salvar).toHaveBeenCalled()
  })

  it('deve desativar um membro com sucesso', async () => {
    const membroExistente = new Membro({ id: 'membro-1', nome: 'Membro Teste', ativo: true })
    const mockMembroRepo = {
      salvar: vi.fn().mockResolvedValue(undefined),
      buscarPorId: vi.fn().mockResolvedValue(membroExistente)
    }
    const service = new MembroService(mockMembroRepo as any)
    await service.desativarMembro('membro-1')

    expect(mockMembroRepo.salvar).toHaveBeenCalledWith(expect.objectContaining({ id: 'membro-1', ativo: false }))
  })

  it('deve ativar um membro com sucesso', async () => {
    const membroExistente = new Membro({ id: 'membro-2', nome: 'Membro Inativo', ativo: false })
    const mockMembroRepo = {
      salvar: vi.fn().mockResolvedValue(undefined),
      buscarPorId: vi.fn().mockResolvedValue(membroExistente)
    }
    const service = new MembroService(mockMembroRepo as any)
    await service.ativarMembro('membro-2')

    expect(mockMembroRepo.salvar).toHaveBeenCalledWith(expect.objectContaining({ id: 'membro-2', ativo: true }))
  })

  it('deve lancar erro ao tentar desativar membro inexistente', async () => {
    const mockMembroRepo = { buscarPorId: vi.fn().mockResolvedValue(null) }
    const service = new MembroService(mockMembroRepo as any)
    await expect(service.desativarMembro('membro-invalido')).rejects.toThrow('Membro não encontrado')
  })

  it('deve atualizar o nome de um membro com sucesso', async () => {
    const membroExistente = new Membro({ id: 'membro-3', nome: 'Nome Antigo', ativo: true })
    const mockMembroRepo = {
      salvar: vi.fn().mockResolvedValue(undefined),
      buscarPorId: vi.fn().mockResolvedValue(membroExistente)
    }
    const service = new MembroService(mockMembroRepo as any)
    await service.atualizarNomeMembro('membro-3', 'Nome Novo')

    expect(mockMembroRepo.salvar).toHaveBeenCalledWith(expect.objectContaining({ id: 'membro-3', nome: 'Nome Novo' }))
  })

  it('deve lancar erro ao tentar atualizar nome de membro inexistente', async () => {
    const mockMembroRepo = { buscarPorId: vi.fn().mockResolvedValue(null) }
    const service = new MembroService(mockMembroRepo as any)
    await expect(service.atualizarNomeMembro('membro-invalido', 'Nome Novo')).rejects.toThrow('Membro não encontrado')
  })
})
