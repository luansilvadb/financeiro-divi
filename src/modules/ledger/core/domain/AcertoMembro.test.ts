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
})