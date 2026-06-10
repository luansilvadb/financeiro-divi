import { describe, it, expect, vi } from 'vitest'
import { GastoService } from './GastoService'
import { Gasto } from '../entities/Gasto'
import { Dinheiro } from '../entities/Dinheiro'
import { DivisaoDeGasto } from '../entities/DivisaoDeGasto'
import type { IGastoRepository } from '../repositories/IGastoRepository'
import type { IFaturaRepository } from '../repositories/IFaturaRepository'
import type { ICartaoRepository } from '../repositories/ICartaoRepository'

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

describe('GastoService Performance', () => {
  it('removerAssociacaoContaFixa optimized performance', async () => {
    const NUM_GASTOS = 50
    const LATENCY = 10 // ms

    const gastos: Gasto[] = []
    for (let i = 0; i < NUM_GASTOS; i++) {
      gastos.push(new Gasto({
        id: `g${i}`,
        faturaId: 'f1',
        descricao: `Gasto ${i}`,
        valorTotal: Dinheiro.deReais(10),
        compradorId: 'm1',
        divisoes: [new DivisaoDeGasto('m1', Dinheiro.deReais(10))],
        recurringBillId: 'fixed1'
      }))
    }

    const mockGastoRepo: IGastoRepository = {
      listarTodos: vi.fn().mockResolvedValue(gastos),
      salvar: vi.fn(async () => {
        await delay(LATENCY)
      }),
      salvarMuitos: vi.fn(async () => {
        await delay(LATENCY) // Batch save should take about the same as one single save
      }),
      buscarPorId: vi.fn(),
      excluir: vi.fn(),
      excluirMuitos: vi.fn()
    }

    const mockFaturaRepo: IFaturaRepository = {
      buscarPorId: vi.fn(),
      buscarPorCartaoEPeriodo: vi.fn(),
      salvar: vi.fn(),
      salvarMuitas: vi.fn(),
      listarTodas: vi.fn(),
      assegurarObterOuCriarFatura: vi.fn()
    }

    const mockCartaoRepo: ICartaoRepository = {
      buscarPorId: vi.fn(),
      salvar: vi.fn(),
      listarTodos: vi.fn(),
      excluir: vi.fn()
    }

    const service = new GastoService(mockGastoRepo, mockFaturaRepo, mockCartaoRepo)

    const start = performance.now()
    await service.removerAssociacaoContaFixa('fixed1')
    const end = performance.now()
    const duration = end - start

    console.log(`Execution time with ${NUM_GASTOS} items and ${LATENCY}ms latency: ${duration.toFixed(2)}ms`)

    expect(mockGastoRepo.salvarMuitos).toHaveBeenCalledTimes(1)
    expect(mockGastoRepo.salvar).not.toHaveBeenCalled()
    expect(duration).toBeLessThan(NUM_GASTOS * LATENCY / 2)
  })
})
