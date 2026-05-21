import { describe, it, expect } from 'vitest'
import { Gasto } from './Gasto'
import { Dinheiro } from '../../../../shared/primitives/Dinheiro'
import { DivisaoDeGasto } from './DivisaoDeGasto'

describe('Gasto', () => {
  it('deve criar um gasto com compradorId e divisoes validas', () => {
    const total = Dinheiro.deCentavos(10000)
    const divisoes = [new DivisaoDeGasto('m1', Dinheiro.deCentavos(10000))]
    const gasto = new Gasto({ id: 'g1', faturaId: 'f1', descricao: 'Mercado', valorTotal: total, compradorId: 'm1', divisoes })
    expect(gasto.compradorId).toBe('m1')
    expect(gasto.valorTotal.centavos).toBe(10000)
  })

  it('deve lançar erro se a soma das divisões não for igual ao valor total', () => {
    const total = Dinheiro.deCentavos(10000)
    const divisoes = [new DivisaoDeGasto('m1', Dinheiro.deCentavos(5000))]
    
    expect(() => {
      new Gasto({ id: 'g1', faturaId: 'f1', descricao: 'Mercado', valorTotal: total, compradorId: 'm1', divisoes })
    }).toThrow('A soma das divisões deve ser igual ao valor total do gasto')
  })

  it('deve lançar erro se o gasto for criado sem divisões', () => {
    const total = Dinheiro.deCentavos(0)
    const divisoes: DivisaoDeGasto[] = []
    
    expect(() => {
      new Gasto({ id: 'g1', faturaId: 'f1', descricao: 'Mercado', valorTotal: total, compradorId: 'm1', divisoes })
    }).toThrow('Um gasto deve ter pelo menos uma divisão')
  })

  it('deve inicializar com campos padrão de parcelamento e empréstimo se não informados', () => {
    const total = Dinheiro.deCentavos(10000)
    const divisoes = [new DivisaoDeGasto('m1', Dinheiro.deCentavos(10000))]
    const gasto = new Gasto({
      id: 'g1',
      faturaId: 'f1',
      descricao: 'Mercado',
      valorTotal: total,
      compradorId: 'm1',
      divisoes
    })
    expect(gasto.installments).toBe(1)
    expect(gasto.isLoan).toBe(false)
    expect(gasto.borrowerId).toBeNull()
  })

  it('deve aceitar e preservar valores customizados de parcelamento e empréstimo', () => {
    const total = Dinheiro.deCentavos(10000)
    const divisoes = [new DivisaoDeGasto('m2', Dinheiro.deCentavos(10000))]
    const gasto = new Gasto({
      id: 'g1',
      faturaId: 'f1',
      descricao: 'Empréstimo',
      valorTotal: total,
      compradorId: 'm1',
      divisoes,
      installments: 3,
      isLoan: true,
      borrowerId: 'm2'
    })
    expect(gasto.installments).toBe(3)
    expect(gasto.isLoan).toBe(true)
    expect(gasto.borrowerId).toBe('m2')
  })

  it('deve aceitar e preservar os novos campos sênior v18', () => {
    const total = Dinheiro.deCentavos(10000)
    const divisoes = [new DivisaoDeGasto('m1', Dinheiro.deCentavos(10000))]
    const gasto = new Gasto({
      id: 'g_senior',
      faturaId: 'f1',
      descricao: 'Talão: Aluguel',
      valorTotal: total,
      compradorId: 'm1',
      divisoes,
      recurringBillId: 'aluguel',
      isSettlement: true,
      settlementDetails: {
        fromMemberId: 'm2',
        toMemberId: 'm1',
        method: 'pix'
      }
    })
    expect(gasto.recurringBillId).toBe('aluguel')
    expect(gasto.isSettlement).toBe(true)
    expect(gasto.settlementDetails).toEqual({
      fromMemberId: 'm2',
      toMemberId: 'm1',
      method: 'pix'
    })
  })
})
