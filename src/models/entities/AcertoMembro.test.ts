import { describe, it, expect } from 'vitest'
import { AcertoMembro } from './AcertoMembro'
import { Dinheiro } from './Dinheiro'

describe('AcertoMembro', () => {
  it('deve calcular corretamente os valores iniciais de um acerto', () => {
    const acerto = new AcertoMembro({
      id: 'ac1', faturaId: 'f1', membroId: 'm1',
      totalConsumido: Dinheiro.deCentavos(10000)
    })
    expect(acerto.tipo).toBe('MEMBRO_PAGA')
    expect(acerto.valorAcerto.centavos).toBe(10000)
    expect(acerto.pago).toBe(false)
    expect(acerto.valorPago.centavos).toBe(0)
  })

  it('deve registrar reembolso parcial e quitar quando atingir valor total', () => {
    const acerto = new AcertoMembro({
      id: 'ac4',
      faturaId: 'f1',
      membroId: 'm1',
      totalConsumido: Dinheiro.deCentavos(10000)
    }) // Valor acerto = 10000
    expect(acerto.pago).toBe(false)
    expect(acerto.valorPago.centavos).toBe(0)
    expect(acerto.dataPagamento).toBeUndefined()

    acerto.registrarReembolso(Dinheiro.deCentavos(5000), new Date('2026-05-18T10:00:00Z'))
    expect(acerto.pago).toBe(false)
    expect(acerto.valorPago.centavos).toBe(5000)

    acerto.registrarReembolso(Dinheiro.deCentavos(5000), new Date('2026-05-19T10:00:00Z'))
    expect(acerto.pago).toBe(true)
    expect(acerto.valorPago.centavos).toBe(10000)
    expect(acerto.dataPagamento).toEqual(new Date('2026-05-19T10:00:00Z'))
  })

  it('deve marcar como pago automaticamente se o valor pago inicial for suficiente', () => {
    const acerto = new AcertoMembro({
      id: 'ac5',
      faturaId: 'f1',
      membroId: 'm1',
      totalConsumido: Dinheiro.deCentavos(5000),
      valorPago: Dinheiro.deCentavos(5000)
    })
    expect(acerto.pago).toBe(true)
    expect(acerto.valorPago.centavos).toBe(5000)
  })
})
