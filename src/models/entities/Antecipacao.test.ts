import { describe, it, expect } from 'vitest'
import { Antecipacao } from './Antecipacao'
import { Dinheiro } from './Dinheiro'

describe('Antecipacao', () => {
  it('deve criar antecipacao corretamente', () => {
    const a = new Antecipacao({ id: 'a1', faturaId: 'f1', membroId: 'm1', valor: Dinheiro.deCentavos(5000), data: new Date() })
    expect(a.valor.centavos).toBe(5000)
  })

  it('deve lançar erro se o valor for menor ou igual a zero', () => {
    expect(() => {
      new Antecipacao({ id: 'a2', faturaId: 'f1', membroId: 'm1', valor: Dinheiro.deCentavos(0), data: new Date() })
    }).toThrow('Valor da antecipação deve ser maior que zero')
    
    expect(() => {
      new Antecipacao({ id: 'a3', faturaId: 'f1', membroId: 'm1', valor: Dinheiro.deCentavos(-1000), data: new Date() })
    }).toThrow('Valor da antecipação deve ser maior que zero')
  })
})