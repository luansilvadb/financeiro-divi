import { describe, it, expect, vi } from 'vitest'
import { GastoService } from './GastoService'
import { Gasto } from '../entities/Gasto'
import { Dinheiro } from '../entities/Dinheiro'
import { DivisaoDeGasto } from '../entities/DivisaoDeGasto'
import { logger } from '../../shared/utils/logger'
import type { LancamentoService } from './LancamentoService'

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

    const mockGastoRepo = {
      listarTodos: vi.fn().mockResolvedValue(gastos),
      salvar: vi.fn(async () => {
        await delay(LATENCY)
      }),
      salvarMuitos: vi.fn(async () => {
        await delay(LATENCY)
      }),
      atualizar: vi.fn(async () => {
        await delay(LATENCY)
      }),
      buscarPorId: vi.fn(),
      excluir: vi.fn(),
      excluirMuitos: vi.fn()
    }

    const mockLancamento = { lancarGastoOuEmprestimo: vi.fn(), lancarGastoContaFixa: vi.fn(), obterOuCriarFaturaMemoria: vi.fn() } as unknown as LancamentoService

    const service = new GastoService(mockGastoRepo as any, {} as any, {} as any, mockLancamento)

    const start = performance.now()
    await service.removerAssociacaoContaFixa('fixed1')
    const end = performance.now()
    const duration = end - start

    logger.info(`Execution time with ${NUM_GASTOS} items and ${LATENCY}ms latency: ${duration.toFixed(2)}ms`)

    // Uses individual atualizar calls in parallel (Promise.all), not batch salvarMuitos
    expect(mockGastoRepo.atualizar).toHaveBeenCalledTimes(NUM_GASTOS)
    expect(mockGastoRepo.salvarMuitos).not.toHaveBeenCalled()
    expect(mockGastoRepo.salvar).not.toHaveBeenCalled()
    expect(duration).toBeLessThan(NUM_GASTOS * LATENCY / 2)
  })
})
