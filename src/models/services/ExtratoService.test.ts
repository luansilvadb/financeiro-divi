import { describe, it, expect } from 'vitest'
import { ExtratoService } from './ExtratoService'
import { Gasto } from '../entities/Gasto'
import { Dinheiro } from '../entities/Dinheiro'
import { DivisaoDeGasto } from '../entities/DivisaoDeGasto'

describe('ExtratoService', () => {
  it('deve calcular o extrato detalhado para um membro com saldo acumulado', () => {
    const g1 = new Gasto({
      id: '2026-05-01-001',
      faturaId: 'f1',
      descricao: 'Mercado',
      valorTotal: Dinheiro.deReais(100),
      compradorId: 'A',
      divisoes: [
        new DivisaoDeGasto('A', Dinheiro.deReais(50)),
        new DivisaoDeGasto('B', Dinheiro.deReais(50))
      ]
    })

    const g2 = new Gasto({
      id: '2026-05-02-002',
      faturaId: 'f1',
      descricao: 'Pizza',
      valorTotal: Dinheiro.deReais(60),
      compradorId: 'B',
      divisoes: [
        new DivisaoDeGasto('A', Dinheiro.deReais(30)),
        new DivisaoDeGasto('B', Dinheiro.deReais(30))
      ]
    })

    const extratoA = ExtratoService.obterExtratoMembro('A', [g1, g2])

    expect(extratoA).toHaveLength(2)

    expect(extratoA[0].id).toBe('2026-05-01-001')
    expect(extratoA[0].valorPago.centavos).toBe(10000)
    expect(extratoA[0].valorConsumido.centavos).toBe(5000)
    expect(extratoA[0].valorLiquido.centavos).toBe(5000)
    expect(extratoA[0].saldoAcumulado.centavos).toBe(5000)

    expect(extratoA[1].id).toBe('2026-05-02-002')
    expect(extratoA[1].valorPago.centavos).toBe(0)
    expect(extratoA[1].valorConsumido.centavos).toBe(3000)
    expect(extratoA[1].valorLiquido.centavos).toBe(-3000)
    expect(extratoA[1].saldoAcumulado.centavos).toBe(2000)
  })

  it('deve lidar com gastos parcelados exibindo apenas o valor da parcela proporcional', () => {
    const g1 = new Gasto({
      id: 'g-parcelado',
      faturaId: 'f1',
      descricao: 'Curso',
      valorTotal: Dinheiro.deReais(100),
      compradorId: 'A',
      installments: 1,
      totalInstallments: 2,
      divisoes: [
        new DivisaoDeGasto('A', Dinheiro.deReais(50)),
        new DivisaoDeGasto('B', Dinheiro.deReais(50))
      ]
    })

    const extratoA = ExtratoService.obterExtratoMembro('A', [g1])

    expect(extratoA[0].valorPago.centavos).toBe(5000)
    expect(extratoA[0].valorConsumido.centavos).toBe(2500)
    expect(extratoA[0].valorLiquido.centavos).toBe(2500)
  })

  it('deve lidar com empréstimos corretamente no extrato', () => {
    const g1 = new Gasto({
      id: 'loan-1',
      faturaId: 'f1',
      descricao: 'Empréstimo',
      valorTotal: Dinheiro.deReais(50),
      compradorId: 'A',
      isLoan: true,
      borrowerId: 'B',
      divisoes: [new DivisaoDeGasto('B', Dinheiro.deReais(50))]
    })

    const extratoA = ExtratoService.obterExtratoMembro('A', [g1])
    expect(extratoA[0].valorPago.centavos).toBe(5000)
    expect(extratoA[0].valorConsumido.centavos).toBe(0)
    expect(extratoA[0].valorLiquido.centavos).toBe(5000)

    const extratoB = ExtratoService.obterExtratoMembro('B', [g1])
    expect(extratoB[0].valorPago.centavos).toBe(0)
    expect(extratoB[0].valorConsumido.centavos).toBe(5000)
    expect(extratoB[0].valorLiquido.centavos).toBe(-5000)
  })

  it('não contabiliza acertos como despesa comum no breakdown', () => {
    const acerto = new Gasto({
      id: 'settlement-1',
      faturaId: null,
      descricao: 'Acerto mensal',
      valorTotal: Dinheiro.deReais(50),
      compradorId: 'A',
      isSettlement: true,
      settlementDetails: { fromMemberId: 'A', toMemberId: 'B', method: 'pix' },
      method: 'pix',
      divisoes: [new DivisaoDeGasto('B', Dinheiro.deReais(50))],
    })

    expect(ExtratoService.obterBreakdownGranular([{ id: 'A' }, { id: 'B' }], [acerto])).toEqual({
      A: { pixFez: 0, pixConsumo: 0, cardFez: 0, cardConsumo: 0, loanFez: 0, loanTomou: 0 },
      B: { pixFez: 0, pixConsumo: 0, cardFez: 0, cardConsumo: 0, loanFez: 0, loanTomou: 0 },
    })
  })
})
