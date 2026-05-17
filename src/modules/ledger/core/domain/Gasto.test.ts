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

  it('deve lançar erro se a soma das divisões não for igual ao valor total', () => {
    const total = Dinheiro.deCentavos(10000)
    const divisoes = [new DivisaoDeGasto('m1', Dinheiro.deCentavos(5000))]
    
    expect(() => {
      new Gasto({ id: 'g1', faturaId: 'f1', descricao: 'Mercado', valorTotal: total, divisoes })
    }).toThrow('A soma das divisões deve ser igual ao valor total do gasto')
  })

  it('deve lançar erro se o gasto for criado sem divisões', () => {
    const total = Dinheiro.deCentavos(0)
    const divisoes: DivisaoDeGasto[] = []
    
    expect(() => {
      new Gasto({ id: 'g1', faturaId: 'f1', descricao: 'Mercado', valorTotal: total, divisoes })
    }).toThrow('Um gasto deve ter pelo menos uma divisão')
  })
})
