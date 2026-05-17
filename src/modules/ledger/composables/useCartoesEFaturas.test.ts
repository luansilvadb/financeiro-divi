import { describe, it, expect, beforeEach } from 'vitest'
import { useCartoesEFaturas } from './useCartoesEFaturas'
import { Cartao } from '../core/domain/Cartao'

describe('useCartoesEFaturas', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('deve criar uma fatura aberta automaticamente para um cartao recem-salvo', async () => {
    const { cartoes, faturas, inicializar, salvarCartaoManual } = useCartoesEFaturas()
    await inicializar()
    
    const novoCard = new Cartao({ id: 'c3', nome: 'Novo Nubank', diaFechamento: 15, responsavelPadraoId: 'm1' })
    await salvarCartaoManual(novoCard)
    
    expect(cartoes.value.some(c => c.id === 'c3')).toBe(true)
    expect(faturas.value.some(f => f.cartaoId === 'c3' && f.status === 'ABERTA')).toBe(true)
  })
})
