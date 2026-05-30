import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useCartoesEFaturas } from './useCartoesEFaturas'

vi.mock('../shared/container', () => ({
  cartaoRepository: { listarTodos: vi.fn().mockResolvedValue([]) },
  gastoRepository: { listarTodos: vi.fn().mockResolvedValue([]) },
  faturaService: { assegurarFaturasAbertas: vi.fn().mockResolvedValue([]) },
  gastoService: {}
}))

describe('useCartoesEFaturas', () => {
  beforeEach(() => {
    const { resetar } = useCartoesEFaturas()
    resetar()
  })

  it('deve inicializar e carregar dados', async () => {
    const { inicializar, cartoes, gastos } = useCartoesEFaturas()
    await inicializar()
    expect(cartoes.value).toEqual([])
    expect(gastos.value).toEqual([])
  })
})
