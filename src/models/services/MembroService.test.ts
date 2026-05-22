import { describe, it, expect, vi } from 'vitest'
import { MembroService } from './MembroService'
import { Membro } from '../entities/Membro'
import { Gasto } from '../entities/Gasto'
import { Dinheiro } from '../entities/Dinheiro'
import { DivisaoDeGasto } from '../entities/DivisaoDeGasto'

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

  it('deve lancar erro se o membro for responsavel por algum cartao ativo', async () => {
    const membro = new Membro({ id: 'membro-cartao', nome: 'Membro com Cartão', ativo: true })
    const mockMembroRepo = { salvar: vi.fn(), listarTodos: vi.fn(), buscarPorId: vi.fn().mockResolvedValue(membro) }
    const mockCartaoRepo = {
      listarTodos: vi.fn().mockResolvedValue([
        { id: 'c1', responsavelPadraoId: 'membro-cartao' }
      ]),
      buscarPorId: vi.fn(), salvar: vi.fn(), excluir: vi.fn()
    }

    const service = new MembroService(mockMembroRepo, mockCartaoRepo as any)
    await expect(service.desativarMembro('membro-cartao')).rejects.toThrow(
      'Não é possível desativar um morador que é responsável por um cartão.'
    )
  })

  it('deve lancar erro se o membro for participante de parcelamento ativo com parcelas futuras', async () => {
    const membro = new Membro({ id: 'membro-parcela', nome: 'Membro com Parcela', ativo: true })
    const mockMembroRepo = { salvar: vi.fn(), listarTodos: vi.fn(), buscarPorId: vi.fn().mockResolvedValue(membro) }
    const mockFaturaRepo = {
      listarTodas: vi.fn().mockResolvedValue([
        { id: 'f1', status: 'ABERTA' }
      ]),
      buscarPorId: vi.fn(), buscarPorCartaoEPeriodo: vi.fn(), salvar: vi.fn(), executarMigracoesEDesduplicacao: vi.fn()
    }
    const mockGastoRepo = {
      listarTodos: vi.fn().mockResolvedValue([
        new Gasto({
          id: 'g1',
          faturaId: 'f1',
          descricao: 'Gasto parcelado',
          valorTotal: Dinheiro.deReais(150),
          compradorId: 'membro-parcela',
          divisoes: [new DivisaoDeGasto('membro-parcela', Dinheiro.deReais(150))],
          installments: 2,
          totalInstallments: 3
        })
      ]),
      buscarPorFatura: vi.fn(), buscarPorId: vi.fn(), salvar: vi.fn(), excluir: vi.fn()
    }

    const service = new MembroService(mockMembroRepo, undefined, mockGastoRepo as any, mockFaturaRepo as any)
    await expect(service.desativarMembro('membro-parcela')).rejects.toThrow(
      'Não é possível desativar um morador participante de parcelamento ativo com parcelas futuras pendentes.'
    )
  })

  it('deve lancar erro se o membro tiver saldo ativo diferente de zero no periodo atual', async () => {
    const membro = new Membro({ id: 'membro-saldo', nome: 'Membro com Saldo', ativo: true })
    const mockMembroRepo = {
      salvar: vi.fn(),
      listarTodos: vi.fn().mockResolvedValue([membro, { id: 'outro' }]),
      buscarPorId: vi.fn().mockResolvedValue(membro)
    }
    const mockFaturaRepo = {
      listarTodas: vi.fn().mockResolvedValue([
        { id: 'f1', status: 'ABERTA', periodo: { mes: 5, ano: 2026 } }
      ]),
      buscarPorId: vi.fn(), buscarPorCartaoEPeriodo: vi.fn(), salvar: vi.fn(), executarMigracoesEDesduplicacao: vi.fn()
    }
    const mockGastoRepo = {
      listarTodos: vi.fn().mockResolvedValue([
        new Gasto({
          id: 'g1',
          faturaId: 'f1',
          descricao: 'Gasto comum',
          valorTotal: Dinheiro.deReais(100),
          compradorId: 'membro-saldo',
          divisoes: [new DivisaoDeGasto('outro', Dinheiro.deReais(100))],
          installments: 1
        })
      ]),
      buscarPorFatura: vi.fn(), buscarPorId: vi.fn(), salvar: vi.fn(), excluir: vi.fn()
    }

    const service = new MembroService(mockMembroRepo, undefined, mockGastoRepo as any, mockFaturaRepo as any)
    await expect(
      service.desativarMembro('membro-saldo', { mes: 5, ano: 2026 })
    ).rejects.toThrow('Não é possível desativar um morador com saldo ativo diferente de zero no período atual.')
  })
})
