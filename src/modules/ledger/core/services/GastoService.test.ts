import { describe, it, expect, vi } from 'vitest'
import { GastoService } from './GastoService'
import { Dinheiro } from '../../../../shared/primitives/Dinheiro'
import { Gasto } from '../domain/Gasto'

describe('GastoService', () => {
  it('deve lancar um gasto simples com sucesso', async () => {
    const mockGastoRepo = { salvar: vi.fn(), buscarPorFatura: vi.fn(), excluir: vi.fn(), listarTodos: vi.fn() }
    const mockFaturaRepo = { buscarPorId: vi.fn(), salvar: vi.fn(), listarTodas: vi.fn(), excluirPorFatura: vi.fn() }
    const mockCartaoRepo = { buscarPorId: vi.fn(), salvar: vi.fn(), listarTodos: vi.fn(), excluir: vi.fn() }

    mockCartaoRepo.listarTodos.mockResolvedValue([{ id: 'c1', responsavelPadraoId: 'm1' }])
    mockFaturaRepo.listarTodas.mockResolvedValue([{ id: 'f1', cartaoId: 'c1', periodo: { mes: 5, ano: 2026 }, responsavelId: 'm1', status: 'ABERTA' }])

    const service = new GastoService(mockGastoRepo, mockFaturaRepo, mockCartaoRepo)
    await service.lancarGastoOuEmprestimo({
      flow: 'expense',
      paymentMethod: 'pix',
      compradorId: 'm1',
      valor: 100,
      descricao: 'Almoço',
      divisoes: [{ membroId: 'm1', valor: Dinheiro.deReais(100) }],
      installments: 1,
      cardOwnerId: null,
      borrowerId: null
    })

    expect(mockGastoRepo.salvar).toHaveBeenCalled()
  })
})
