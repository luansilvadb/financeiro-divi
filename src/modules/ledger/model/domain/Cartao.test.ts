import { describe, it, expect } from 'vitest'
import { Cartao } from './Cartao'

describe('Cartao', () => {
  it('deve criar um cartao valido', () => {
    const cartao = new Cartao({ id: 'c1', nome: 'Nubank', diaFechamento: 10, responsavelPadraoId: 'm1' })
    expect(cartao.id).toBe('c1')
    expect(cartao.diaFechamento).toBe(10)
  })
  
  it('deve rejeitar dia de fechamento invalido', () => {
    expect(() => new Cartao({ id: 'c1', nome: 'Nubank', diaFechamento: 32, responsavelPadraoId: 'm1' }))
      .toThrow('Dia de fechamento deve ser entre 1 e 28')
  })
})
