import { describe, it, expect } from 'vitest'
import { calcularSaldosUnificados, calcularTransacoesNetting } from './NettingService'
import { Gasto } from '../entities/Gasto'
import { Dinheiro } from '../entities/Dinheiro'
import { DivisaoDeGasto } from '../entities/DivisaoDeGasto'

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
    
    expect(saldos['luciana']).toBe(1000)
    expect(saldos['luan']).toBe(8000)
    expect(saldos['joao']).toBe(-9000)

    const transferencias = calcularTransacoesNetting(saldos)
    expect(transferencias.length).toBe(2)
    expect(transferencias.some(t => t.from === 'joao' && t.to === 'luan' && Math.abs(t.val - 80) < 0.01)).toBe(true)
    expect(transferencias.some(t => t.from === 'joao' && t.to === 'luciana' && Math.abs(t.val - 10) < 0.01)).toBe(true)
  })

  it('deve calcular saldos unificados de gastos parcelados no segundo mês usando totalInstallments', () => {
    const membros = [
      { id: 'luan', nome: 'Luan' },
      { id: 'joao', nome: 'João' }
    ]

    const gastoParcelado = new Gasto({
      id: 'g-parcelado',
      faturaId: 'f2',
      descricao: 'Curso',
      valorTotal: Dinheiro.deReais(100),
      compradorId: 'luan',
      method: 'card',
      cardOwner: 'luan',
      installments: 1, // 2ª parcela (resta 1)
      totalInstallments: 2, // parcelado em 2x
      isLoan: false,
      divisoes: [
        new DivisaoDeGasto('luan', Dinheiro.deReais(50)),
        new DivisaoDeGasto('joao', Dinheiro.deReais(50))
      ]
    })

    const saldos = calcularSaldosUnificados(membros, [gastoParcelado])

    // Deve cobrar/creditar apenas o valor da parcela (R$ 50) e suas divisões (R$ 25 cada) em centavos
    expect(saldos['luan']).toBe(2500)
    expect(saldos['joao']).toBe(-2500)
  })

  it('deve retornar transferencias vazias quando todos os saldos são zero', () => {
    const saldos = { 'a': 0, 'b': 0 }
    const transferencias = calcularTransacoesNetting(saldos)
    expect(transferencias).toEqual([])
  })

  it('deve garantir que a soma dos saldos unificados seja exatamente zero mesmo com divisões que geram dízimas e restos de centavos', () => {
    const membros = [{ id: 'A' }, { id: 'B' }, { id: 'C' }]
    
    // Gasto de R$ 1,00 pago por A, dividido em partes de 34, 33 e 33 centavos, parcelado em 2x.
    // Primeira parcela (installments = 2, totalInstallments = 2)
    const gasto1 = new Gasto({
      id: 'g1',
      faturaId: 'f1',
      descricao: 'Gasto Dizima 1',
      valorTotal: Dinheiro.deReais(1),
      compradorId: 'A',
      method: 'card',
      cardOwner: 'A',
      installments: 2,
      totalInstallments: 2,
      isLoan: false,
      divisoes: [
        new DivisaoDeGasto('A', Dinheiro.deCentavos(34)),
        new DivisaoDeGasto('B', Dinheiro.deCentavos(33)),
        new DivisaoDeGasto('C', Dinheiro.deCentavos(33))
      ]
    })

    const saldos1 = calcularSaldosUnificados(membros, [gasto1])
    const soma1 = Object.values(saldos1).reduce((acc, v) => acc + v, 0)
    expect(soma1).toBe(0) // Deve ser exatamente 0 em centavos
    expect(saldos1['A']).toBe(34) // Crédito de 34 centavos
    expect(saldos1['B']).toBe(-17)
    expect(saldos1['C']).toBe(-17)

    // Segunda parcela (installments = 1, totalInstallments = 2)
    const gasto2 = new Gasto({
      id: 'g2',
      faturaId: 'f1',
      descricao: 'Gasto Dizima 2',
      valorTotal: Dinheiro.deReais(1),
      compradorId: 'A',
      method: 'card',
      cardOwner: 'A',
      installments: 1,
      totalInstallments: 2,
      isLoan: false,
      divisoes: [
        new DivisaoDeGasto('A', Dinheiro.deCentavos(34)),
        new DivisaoDeGasto('B', Dinheiro.deCentavos(33)),
        new DivisaoDeGasto('C', Dinheiro.deCentavos(33))
      ]
    })

    const saldos2 = calcularSaldosUnificados(membros, [gasto2])
    const soma2 = Object.values(saldos2).reduce((acc, v) => acc + v, 0)
    expect(soma2).toBe(0) // Deve ser exatamente 0 em centavos
    expect(saldos2['A']).toBe(32) // Crédito de 32 centavos
    expect(saldos2['B']).toBe(-16)
    expect(saldos2['C']).toBe(-16)
  })

  it('deve lidar com indices invalidos (installments > totalInstallments) sem quebrar e tratar como 0', () => {
    const membros = [{ id: 'A' }, { id: 'B' }]
    const gastoInvalido = new Gasto({
      id: 'g-invalido',
      faturaId: 'f1',
      descricao: 'Gasto Invalido',
      valorTotal: Dinheiro.deReais(10),
      compradorId: 'A',
      installments: 3,       // parcelas restantes maior que total
      totalInstallments: 2,  // total
      divisoes: [new DivisaoDeGasto('B', Dinheiro.deReais(10))]
    })

    // Não deve lançar erro
    const saldos = calcularSaldosUnificados(membros, [gastoInvalido])
    expect(saldos['A']).toBe(500)
    expect(saldos['B']).toBe(-500)
  })

  it('deve lidar com membros ausentes ou desativados inicializando-os na lista de saldos para evitar NaN', () => {
    const membrosAtivos = [{ id: 'A' }] // B está desativado/ausente da lista de membros ativos passados
    const gasto = new Gasto({
      id: 'g1',
      faturaId: 'f1',
      descricao: 'Gasto Com Membro Ausente',
      valorTotal: Dinheiro.deReais(10),
      compradorId: 'A',
      installments: 1,
      divisoes: [new DivisaoDeGasto('B', Dinheiro.deReais(10))]
    })

    const saldos = calcularSaldosUnificados(membrosAtivos, [gasto])
    expect(saldos['A']).toBe(1000)
    expect(saldos['B']).toBe(-1000) // B foi inserido dinamicamente no mapa de saldos sem gerar NaN
  })
})
