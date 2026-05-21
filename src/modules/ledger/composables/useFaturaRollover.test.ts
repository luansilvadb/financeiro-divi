import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useFaturaRollover } from './useFaturaRollover'
import { Fatura } from '../core/domain/Fatura'
import { FaturaRolloverService } from '../core/services/FaturaRolloverService'

describe('useFaturaRollover', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('deve delegar executarRolloverPeriodo ao service', async () => {
    const mockService = {
      executarRolloverPeriodo: vi.fn(),
      processarRolloverParcelas: vi.fn(),
      gerarTransacoesNettingSaldoInicial: vi.fn()
    } as unknown as FaturaRolloverService

    const { executarRolloverPeriodo } = useFaturaRollover({
      faturaRolloverService: mockService
    })

    const fatura = new Fatura({
      id: 'f1', cartaoId: 'c1', periodo: { mes: 5, ano: 2026 },
      responsavelId: 'm1', status: 'ABERTA'
    })

    await executarRolloverPeriodo('Junho 2026', [fatura], [{ id: 'c1' }], { m1: 0 }, 'Maio 2026')

    expect(mockService.executarRolloverPeriodo).toHaveBeenCalledWith({
      nomeNovoPeriodo: 'Junho 2026',
      faturasAbertas: [fatura],
      cartoes: [{ id: 'c1' }],
      saldosAcumulados: { m1: 0 },
      nomePeriodoAnterior: 'Maio 2026'
    })
  })
})
