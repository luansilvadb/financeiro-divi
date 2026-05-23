import { describe, it, expect, vi } from 'vitest'
import { GastoService } from './GastoService'
import { Dinheiro } from '../entities/Dinheiro'
import { DivisaoDeGasto } from '../entities/DivisaoDeGasto'
import { Gasto } from '../entities/Gasto'

describe('GastoService F-05 Fix', () => {
  it('deve lancar erro ao tentar atualizar parcelamento quando fatura original nao existe', async () => {
    const mockGastoRepo = { salvar: vi.fn(), salvarMuitos: vi.fn(), buscarPorFatura: vi.fn(), excluir: vi.fn(), excluirMuitos: vi.fn(), listarTodos: vi.fn(), buscarPorId: vi.fn() }
    const mockFaturaRepo = { buscarPorId: vi.fn(), buscarPorCartaoEPeriodo: vi.fn(), salvar: vi.fn(), salvarMuitas: vi.fn(), listarTodas: vi.fn(), executarMigracoesEDesduplicacao: vi.fn() }
    const mockCartaoRepo = { buscarPorId: vi.fn(), salvar: vi.fn(), listarTodos: vi.fn(), excluir: vi.fn() }

    const g1 = new Gasto({
      id: 'g1',
      faturaId: 'f1_missing',
      descricao: 'Original 1/2',
      valorTotal: Dinheiro.deReais(100),
      compradorId: 'm1',
      divisoes: [new DivisaoDeGasto('m1', Dinheiro.deCentavos(10000))],
      method: 'card',
      cardOwner: 'm1',
      installments: 2,
      totalInstallments: 2,
      grupoParcelasId: 'grupo-x'
    })

    const g2 = new Gasto({
      id: 'g2',
      faturaId: 'f2_missing',
      descricao: 'Original 2/2',
      valorTotal: Dinheiro.deReais(100),
      compradorId: 'm1',
      divisoes: [new DivisaoDeGasto('m1', Dinheiro.deCentavos(10000))],
      method: 'card',
      cardOwner: 'm1',
      installments: 1,
      totalInstallments: 2,
      grupoParcelasId: 'grupo-x'
    })

    mockGastoRepo.buscarPorId.mockResolvedValue(g1)
    mockGastoRepo.listarTodos.mockResolvedValue([g1, g2])
    mockFaturaRepo.buscarPorId.mockResolvedValue(null) // Fatura não encontrada

    const service = new GastoService(mockGastoRepo as any, mockFaturaRepo as any, mockCartaoRepo as any)

    await expect(service.atualizarGastoCompleto('g1', {
      descricao: 'Atualizado',
      valorTotal: Dinheiro.deReais(120),
      compradorId: 'm1',
      method: 'card',
      cardOwner: 'c1',
      divisoes: [new DivisaoDeGasto('m1', Dinheiro.deCentavos(12000))],
      installments: 3 // Mudança de parcelamento força relançamento
    })).rejects.toThrow('Fatura original não encontrada para o gasto g1')
  })

  it('deve lancar erro ao tentar tornar parcelado um gasto simples cuja fatura original nao existe', async () => {
    const mockGastoRepo = { salvar: vi.fn(), salvarMuitos: vi.fn(), buscarPorFatura: vi.fn(), excluir: vi.fn(), excluirMuitos: vi.fn(), listarTodos: vi.fn(), buscarPorId: vi.fn() }
    const mockFaturaRepo = { buscarPorId: vi.fn(), buscarPorCartaoEPeriodo: vi.fn(), salvar: vi.fn(), salvarMuitas: vi.fn(), listarTodas: vi.fn(), executarMigracoesEDesduplicacao: vi.fn() }
    const mockCartaoRepo = { buscarPorId: vi.fn(), salvar: vi.fn(), listarTodos: vi.fn(), excluir: vi.fn() }

    const original = new Gasto({
      id: 'g_simples',
      faturaId: 'f_missing',
      descricao: 'Simples',
      valorTotal: Dinheiro.deReais(100),
      compradorId: 'm1',
      divisoes: [new DivisaoDeGasto('m1', Dinheiro.deCentavos(10000))],
      method: 'card',
      cardOwner: 'm1',
      installments: 1,
      totalInstallments: 1
    })

    mockGastoRepo.buscarPorId.mockResolvedValue(original)
    mockFaturaRepo.buscarPorId.mockResolvedValue(null) // Fatura não encontrada

    const service = new GastoService(mockGastoRepo as any, mockFaturaRepo as any, mockCartaoRepo as any)

    await expect(service.atualizarGastoCompleto('g_simples', {
      descricao: 'Agora parcelado',
      valorTotal: Dinheiro.deReais(100),
      compradorId: 'm1',
      method: 'card',
      cardOwner: 'c1',
      divisoes: [new DivisaoDeGasto('m1', Dinheiro.deCentavos(10000))],
      installments: 2 // Torna parcelado
    })).rejects.toThrow('Fatura original não encontrada para o gasto g_simples')
  })
})
