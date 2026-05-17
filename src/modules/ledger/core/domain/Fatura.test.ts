import { describe, it, expect } from 'vitest'
import { Fatura, determinarPeriodoFatura } from './Fatura'

describe('Fatura', () => {
  it('determinarPeriodoFatura - gasto antes do fechamento pertence a fatura do mes de fechamento', () => {
    // Fechamento dia 10. Gasto dia 8/Maio (08/05/2026) -> Fatura com periodo { mes: 5, ano: 2026 } (Maio)
    const dataGasto = new Date('2026-05-08T10:00:00Z')
    const periodo = determinarPeriodoFatura(dataGasto, 10)
    expect(periodo).toEqual({ mes: 5, ano: 2026 })
  })

  it('determinarPeriodoFatura - gasto no dia exato do fechamento pertence ao proximo mes', () => {
    // Gasto dia 10/Maio -> Fatura Junho (mes 6)
    const dataGasto = new Date('2026-05-10T10:00:00Z')
    const periodo = determinarPeriodoFatura(dataGasto, 10)
    expect(periodo).toEqual({ mes: 6, ano: 2026 })
  })
  
  it('determinarPeriodoFatura - vira o ano corretamente', () => {
    // Gasto 10/Dez -> Fatura Janeiro ano seguinte
    const dataGasto = new Date('2026-12-10T10:00:00Z')
    const periodo = determinarPeriodoFatura(dataGasto, 10)
    expect(periodo).toEqual({ mes: 1, ano: 2027 })
  })

  it('deve rejeitar operacoes quando fatura nao esta ABERTA', () => {
    const fatura = new Fatura({ id: 'f1', cartaoId: 'c1', periodo: { mes: 5, ano: 2026 }, responsavelId: 'r1', status: 'FECHADA' })
    expect(() => fatura.validarOperacaoPermitida()).toThrow('Fatura não está ABERTA')
  })
})
