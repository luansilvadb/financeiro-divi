import { describe, it, expect } from 'vitest'
import { Gasto } from './Gasto'
import { Dinheiro } from '../../../../shared/primitives/Dinheiro'
import { DivisaoDeGasto } from './DivisaoDeGasto'

describe('Gasto', () => {
  it('deve criar um gasto com divisoes validas', () => {
    const total = Dinheiro.deCentavos(10000)
    const divisoes = [new DivisaoDeGasto('m1', Dinheiro.deCentavos(10000))]
    const gasto = new Gasto({ id: 'g1', faturaId: 'f1', descricao: 'Mercado', valorTotal: total, divisoes })
    expect(gasto.valorTotal.centavos).toBe(10000)
  })
})
