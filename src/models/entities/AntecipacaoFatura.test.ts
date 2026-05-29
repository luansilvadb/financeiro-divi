import { describe, expect, it } from 'vitest'
import { AntecipacaoFatura } from './AntecipacaoFatura'
import { Dinheiro } from './Dinheiro'

describe('AntecipacaoFatura', () => {
  it('deve exigir valor positivo', () => {
    expect(() => new AntecipacaoFatura({
      id: 'ant-1',
      faturaId: 'fat-1',
      membroId: 'm2',
      responsavelId: 'm1',
      valor: Dinheiro.deCentavos(0),
      data: new Date('2026-05-29T12:00:00Z')
    })).toThrow('Valor da antecipacao deve ser maior que zero')
  })

  it('deve guardar a antecipacao vinculada a fatura, membro e responsavel', () => {
    const ant = new AntecipacaoFatura({
      id: 'ant-1',
      faturaId: 'fat-1',
      membroId: 'm2',
      responsavelId: 'm1',
      valor: Dinheiro.deCentavos(10000),
      data: new Date('2026-05-29T12:00:00Z'),
      observacao: 'Liberar limite'
    })

    expect(ant.faturaId).toBe('fat-1')
    expect(ant.membroId).toBe('m2')
    expect(ant.responsavelId).toBe('m1')
    expect(ant.valor.centavos).toBe(10000)
    expect(ant.observacao).toBe('Liberar limite')
  })
})
