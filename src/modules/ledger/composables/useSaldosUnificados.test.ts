import { describe, it, expect } from 'vitest'
import { useSaldosUnificados } from './useSaldosUnificados'
import { Gasto } from '../core/domain/Gasto'
import { Dinheiro } from '../../../shared/primitives/Dinheiro'
import { DivisaoDeGasto } from '../core/domain/DivisaoDeGasto'

describe('useSaldosUnificados', () => {
  it('deve calcular saldos em tempo real unificando Pix, Cartões e Empréstimos Pessoais', () => {
    const membros = [
      { id: 'luciana', nome: 'Luciana' },
      { id: 'luan', nome: 'Luan' },
      { id: 'joao', nome: 'João' }
    ]

    // Luan gasta R$ 120,00 no cartão (Nubank de Luan), dividido igualmente com Luciana e João
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

    // Luciana empresta R$ 50,00 para João (Empréstimo Pessoal)
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
    const { calcularSaldosUnificados, calcularTransacoesNetting } = useSaldosUnificados()

    const saldos = calcularSaldosUnificados(membros, gastosList)
    
    // Luciana: +R$ 50,00 (do empréstimo) - R$ 40,00 (do mercado) = +R$ 10,00
    expect(saldos['luciana']).toBeCloseTo(10.00, 2)
    // Luan: +R$ 120,00 (pago no cartão) - R$ 40,00 (consumo próprio) = +R$ 80,00
    expect(saldos['luan']).toBeCloseTo(80.00, 2)
    // João: -R$ 40,00 (mercado) - R$ 50,00 (empréstimo) = -R$ 90,00
    expect(saldos['joao']).toBeCloseTo(-90.00, 2)

    const transferencias = calcularTransacoesNetting(saldos)
    expect(transferencias.length).toBe(2)
    // João deve pagar R$ 80,00 para Luan e R$ 10,00 para Luciana
    expect(transferencias.some(t => t.from === 'joao' && t.to === 'luan' && Math.abs(t.val - 80) < 0.01)).toBe(true)
    expect(transferencias.some(t => t.from === 'joao' && t.to === 'luciana' && Math.abs(t.val - 10) < 0.01)).toBe(true)
  })
})
