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

  it('determinarPeriodoFatura - deve falhar se diaFechamento for invalido', () => {
    const dataGasto = new Date('2026-05-10T10:00:00Z')
    expect(() => determinarPeriodoFatura(dataGasto, 0)).toThrow('diaFechamento deve ser entre 1 e 31')
    expect(() => determinarPeriodoFatura(dataGasto, 32)).toThrow('diaFechamento deve ser entre 1 e 31')
  })

  it('deve rejeitar operacoes quando fatura nao esta ABERTA', () => {
    const fatura = new Fatura({ id: 'f1', cartaoId: 'c1', periodo: { mes: 5, ano: 2026 }, responsavelId: 'r1', status: 'FECHADA' })
    expect(() => fatura.validarOperacaoPermitida()).toThrow('Fatura não está ABERTA')
  })

  it('fechar - deve fechar a fatura corretamente e salvar a data de pagamento', () => {
    const fatura = new Fatura({ id: 'f1', cartaoId: 'c1', periodo: { mes: 5, ano: 2026 }, responsavelId: 'r1', status: 'ABERTA' })
    const dataPagamento = new Date('2026-05-20T10:00:00Z')
    fatura.fechar({ dataPagamentoBanco: dataPagamento })
    expect(fatura.status).toBe('FECHADA')
    expect(fatura.dataPagamentoBanco).toBe(dataPagamento)
  })

  it('fechar - deve falhar se a fatura nao estiver ABERTA', () => {
    const fatura = new Fatura({ id: 'f1', cartaoId: 'c1', periodo: { mes: 5, ano: 2026 }, responsavelId: 'r1', status: 'FECHADA' })
    expect(() => fatura.fechar()).toThrow('Apenas faturas ABERTAS podem ser fechadas')
  })

  it('marcarAcertada - deve marcar a fatura como ACERTADA', () => {
    const fatura = new Fatura({ id: 'f1', cartaoId: 'c1', periodo: { mes: 5, ano: 2026 }, responsavelId: 'r1', status: 'FECHADA' })
    fatura.marcarAcertada()
    expect(fatura.status).toBe('ACERTADA')
  })

  it('marcarAcertada - deve falhar se a fatura nao estiver FECHADA', () => {
    const fatura = new Fatura({ id: 'f1', cartaoId: 'c1', periodo: { mes: 5, ano: 2026 }, responsavelId: 'r1', status: 'ABERTA' })
    expect(() => fatura.marcarAcertada()).toThrow('Apenas faturas FECHADAS podem ser acertadas')
  })
})