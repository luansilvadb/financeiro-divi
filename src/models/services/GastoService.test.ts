import { describe, it, expect, vi } from 'vitest'
import { GastoService } from './GastoService'
import { Dinheiro } from '../entities/Dinheiro'
import { DivisaoDeGasto } from '../entities/DivisaoDeGasto'
import { Gasto } from '../entities/Gasto'

describe('GastoService', () => {
  it('deve lancar um gasto simples com sucesso', async () => {
    const mockGastoRepo = { salvar: vi.fn(), buscarPorFatura: vi.fn(), excluir: vi.fn(), listarTodos: vi.fn(), buscarPorId: vi.fn() }
    const mockFaturaRepo = { buscarPorId: vi.fn(), buscarPorCartaoEPeriodo: vi.fn(), salvar: vi.fn(), listarTodas: vi.fn() }
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
      borrowerId: null,
      periodo: { mes: 5, ano: 2026 }
    })

    expect(mockGastoRepo.salvar).toHaveBeenCalled()
  })

  it('deve lancar gasto de conta fixa com sucesso', async () => {
    const mockGastoRepo = { salvar: vi.fn(), buscarPorFatura: vi.fn(), excluir: vi.fn(), buscarPorId: vi.fn() }
    const mockFaturaRepo = { buscarPorId: vi.fn(), buscarPorCartaoEPeriodo: vi.fn(), salvar: vi.fn(), listarTodas: vi.fn() }
    const mockCartaoRepo = { buscarPorId: vi.fn(), salvar: vi.fn(), listarTodos: vi.fn(), excluir: vi.fn() }

    const service = new GastoService(mockGastoRepo, mockFaturaRepo, mockCartaoRepo)
    await service.lancarGastoContaFixa({
      faturaId: 'f1',
      conta: { id: 'aluguel', name: 'Aluguel' },
      valorTotal: 1200,
      compradorId: 'm1',
      participantes: ['m1', 'm2']
    })

    expect(mockGastoRepo.salvar).toHaveBeenCalledWith(expect.any(Object))
  })

  it('deve atualizar um gasto completo com sucesso', async () => {
    const mockGastoRepo = { salvar: vi.fn(), buscarPorFatura: vi.fn(), excluir: vi.fn(), buscarPorId: vi.fn() }
    const mockFaturaRepo = { buscarPorId: vi.fn(), buscarPorCartaoEPeriodo: vi.fn(), salvar: vi.fn(), listarTodas: vi.fn() }
    const mockCartaoRepo = { buscarPorId: vi.fn(), salvar: vi.fn(), listarTodos: vi.fn(), excluir: vi.fn() }

    const originalGasto = new Gasto({
      id: 'g1',
      faturaId: 'f1',
      descricao: 'Aluguel antigo',
      valorTotal: Dinheiro.deReais(1000),
      compradorId: 'm1',
      divisoes: [new DivisaoDeGasto('m1', Dinheiro.deReais(1000))],
      isLoan: false,
      borrowerId: null,
      recurringBillId: 'aluguel',
      isSettlement: false,
      settlementDetails: null
    })
    mockGastoRepo.buscarPorId.mockResolvedValue(originalGasto)

    const service = new GastoService(mockGastoRepo, mockFaturaRepo, mockCartaoRepo)
    await service.atualizarGastoCompleto('g1', {
      descricao: 'Aluguel atualizado',
      valorTotal: Dinheiro.deReais(1200),
      compradorId: 'm1',
      method: 'pix',
      cardOwner: null,
      divisoes: [new DivisaoDeGasto('m1', Dinheiro.deReais(1200))],
      installments: 1
    })

    expect(mockGastoRepo.salvar).toHaveBeenCalled()
  })
})
