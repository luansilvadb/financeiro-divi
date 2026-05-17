import { describe, it, expect } from 'vitest'
import { Antecipacao } from './Antecipacao'
import { Dinheiro } from '../../../../shared/primitives/Dinheiro'

describe('Antecipacao', () => {
  it('deve criar antecipacao corretamente', () => {
    const a = new Antecipacao({ id: 'a1', faturaId: 'f1', membroId: 'm1', valor: Dinheiro.deCentavos(5000), data: new Date() })
    expect(a.valor.centavos).toBe(5000)
  })
})