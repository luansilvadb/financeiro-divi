import { describe, it, expect } from 'vitest'
import { DivisaoDeGasto } from './DivisaoDeGasto'
import { Dinheiro } from './Dinheiro'

describe('DivisaoDeGasto', () => {
  it('deve criar uma divisão de gasto corretamente', () => {
    const valor = Dinheiro.deCentavos(5000)
    const divisao = new DivisaoDeGasto('m1', valor)
    
    expect(divisao.membroId).toBe('m1')
    expect(divisao.valor.centavos).toBe(5000)
  })
})
