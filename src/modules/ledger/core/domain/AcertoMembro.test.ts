import { describe, it, expect } from 'vitest'
import { AcertoMembro } from './AcertoMembro'
import { Dinheiro } from '../../../../shared/primitives/Dinheiro'

describe('AcertoMembro', () => {
  it('deve calcular tipo MEMBRO_PAGA quando consumo > antecipado', () => {
    const acerto = new AcertoMembro({
      id: 'ac1', faturaId: 'f1', membroId: 'm1',
      totalConsumido: Dinheiro.deCentavos(10000),
      totalAntecipado: Dinheiro.deCentavos(2000)
    })
    expect(acerto.tipo).toBe('MEMBRO_PAGA')
    expect(acerto.valorAcerto.centavos).toBe(8000)
  })

  it('deve calcular tipo RESPONSAVEL_PAGA quando antecipado > consumo', () => {
    const acerto = new AcertoMembro({
      id: 'ac2', faturaId: 'f1', membroId: 'm1',
      totalConsumido: Dinheiro.deCentavos(5000),
      totalAntecipado: Dinheiro.deCentavos(12000)
    })
    expect(acerto.tipo).toBe('RESPONSAVEL_PAGA')
    expect(acerto.valorAcerto.centavos).toBe(7000)
  })

  it('deve calcular corretamente quando o total consumido for igual ao antecipado', () => {
    const acerto = new AcertoMembro({
      id: 'ac3', faturaId: 'f1', membroId: 'm1',
      totalConsumido: Dinheiro.deCentavos(5000),
      totalAntecipado: Dinheiro.deCentavos(5000)
    })
    expect(acerto.tipo).toBe('MEMBRO_PAGA')
    expect(acerto.valorAcerto.centavos).toBe(0)
  })

  it('deve marcar o acerto como pago', () => {
    const acerto = new AcertoMembro({
      id: 'ac4', faturaId: 'f1', membroId: 'm1',
      totalConsumido: Dinheiro.deCentavos(10000),
      totalAntecipado: Dinheiro.deCentavos(2000)
    })
    expect(acerto.pago).toBe(false)
    expect(acerto.dataPagamento).toBeUndefined()

    const dataPagamento = new Date('2026-05-18T10:00:00Z')
    acerto.marcarComoPago(dataPagamento)
    
    expect(acerto.pago).toBe(true)
    expect(acerto.dataPagamento).toEqual(dataPagamento)
  })
})