import { describe, it, expect } from 'vitest'
import { calcularSaldosUnificados, calcularTransacoesNetting } from './NettingService'
import { Gasto } from '../domain/Gasto'
import { Dinheiro } from '../../../../shared/primitives/Dinheiro'
import { DivisaoDeGasto } from '../domain/DivisaoDeGasto'

describe('NettingService', () => {
  it('deve calcular saldos unificando Pix, Cartões e Empréstimos Pessoais', () => {
    const membros = [
      { id: 'luciana', nome: 'Luciana' },
      { id: 'luan', nome: 'Luan' },
      { id: 'joao', nome: 'João' }
    ]

    const gastoCartao = new Gasto({
      id: 'g1',
      faturaId: 'f1',
      descricao: 'Mercado',
      valorTotal: Dinheiro.deReais(120),
      compradorId: 'luan',
      method: 'card',
      cardOwner: 'luan',
      installments: 1,
      isLoan: false,
      divisoes: [
        new DivisaoDeGasto('luciana', Dinheiro.deReais(40)),
        new DivisaoDeGasto('luan', Dinheiro.deReais(40)),
        new DivisaoDeGasto('joao', Dinheiro.deReais(40))
      ]
    })

    const emprestimo = new Gasto({
      id: 'g2',
      faturaId: 'f1',
      descricao: 'Empréstimo Uber',
      valorTotal: Dinheiro.deReais(50),
      compradorId: 'luciana',
      installments: 1,
      isLoan: true,
      borrowerId: 'joao',
      divisoes: [
        new DivisaoDeGasto('joao', Dinheiro.deReais(50))
      ]
    })

    const gastosList = [gastoCartao, emprestimo]

    const saldos = calcularSaldosUnificados(membros, gastosList)
    
    expect(saldos['luciana']).toBeCloseTo(10.00, 2)
    expect(saldos['luan']).toBeCloseTo(80.00, 2)
    expect(saldos['joao']).toBeCloseTo(-90.00, 2)

    const transferencias = calcularTransacoesNetting(saldos)
    expect(transferencias.length).toBe(2)
    expect(transferencias.some(t => t.from === 'joao' && t.to === 'luan' && Math.abs(t.val - 80) < 0.01)).toBe(true)
    expect(transferencias.some(t => t.from === 'joao' && t.to === 'luciana' && Math.abs(t.val - 10) < 0.01)).toBe(true)
  })

  it('deve retornar transferencias vazias quando todos os saldos são zero', () => {
    const saldos = { 'a': 0, 'b': 0 }
    const transferencias = calcularTransacoesNetting(saldos)
    expect(transferencias).toEqual([])
  })
})
