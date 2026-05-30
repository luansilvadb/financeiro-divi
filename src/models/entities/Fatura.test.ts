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

  it('deve permitir operacoes quando fatura nao esta ABERTA', () => {
    const fatura = new Fatura({ id: 'f1', cartaoId: 'c1', periodo: { mes: 5, ano: 2026 }, responsavelId: 'r1', status: 'FECHADA' })
    expect(() => fatura.validarOperacaoPermitida()).not.toThrow()
  })

  it('fechar - deve retornar nova fatura FECHADA e preservar a data de pagamento', () => {
    const fatura = new Fatura({ id: 'f1', cartaoId: 'c1', periodo: { mes: 5, ano: 2026 }, responsavelId: 'r1', status: 'ABERTA' })
    const dataPagamento = new Date('2026-05-20T10:00:00Z')
    const fechada = fatura.fechar({ dataPagamentoBanco: dataPagamento })
    
    // Nova instância com status FECHADA
    expect(fechada.status).toBe('FECHADA')
    expect(fechada.dataPagamentoBanco).toBe(dataPagamento)
    expect(fechada).not.toBe(fatura)
    
    // Original inalterada
    expect(fatura.status).toBe('ABERTA')
  })

  it('fechar - deve falhar se a fatura nao estiver ABERTA', () => {
    const fatura = new Fatura({ id: 'f1', cartaoId: 'c1', periodo: { mes: 5, ano: 2026 }, responsavelId: 'r1', status: 'FECHADA' })
    expect(() => fatura.fechar({ dataPagamentoBanco: new Date() })).toThrow('Apenas faturas ABERTAS podem ser fechadas')
  })

  it('marcarAcertada - deve retornar nova fatura ACERTADA', () => {
    const fatura = new Fatura({ id: 'f1', cartaoId: 'c1', periodo: { mes: 5, ano: 2026 }, responsavelId: 'r1', status: 'FECHADA' })
    const acertada = fatura.marcarAcertada()
    
    expect(acertada.status).toBe('ACERTADA')
    expect(acertada).not.toBe(fatura)
    expect(fatura.status).toBe('FECHADA')
  })

  it('marcarAcertada - deve falhar se a fatura nao estiver FECHADA', () => {
    const fatura = new Fatura({ id: 'f1', cartaoId: 'c1', periodo: { mes: 5, ano: 2026 }, responsavelId: 'r1', status: 'ABERTA' })
    expect(() => fatura.marcarAcertada()).toThrow('Apenas faturas FECHADAS podem ser acertadas')
  })

  it('determinarPeriodoFatura - compra feita perto do final do dia local deve usar o dia local', () => {
    // 21 de Maio às 23:00 (hora local da máquina).
    const dataGasto = new Date(2026, 4, 21, 23, 0, 0) // Mês 4 é Maio (0-indexed)
    const periodo = determinarPeriodoFatura(dataGasto, 22)
    expect(periodo.mes).toBe(5)
    expect(periodo.ano).toBe(2026)
  })

  it('deve determinar o mesmo periodo de fatura independente do timezone local do dispositivo', () => {
    // 2026-05-20T02:30:00Z -> equivale a 19/05/2026 23:30 em Brasília (UTC-3)
    const dataGasto = new Date('2026-05-20T02:30:00.000Z')
    const periodo = determinarPeriodoFatura(dataGasto, 20)
    
    // Como em Brasília é dia 19, e 19 < 20, deve cair em Maio (mês 5)
    expect(periodo.mes).toBe(5)
    expect(periodo.ano).toBe(2026)
  })

  it('reabrir - deve retornar nova fatura ABERTA a partir de FECHADA', () => {
    const fatura = new Fatura({ id: 'f1', cartaoId: 'c1', periodo: { mes: 5, ano: 2026 }, responsavelId: 'r1', status: 'FECHADA', dataPagamentoBanco: new Date() })
    const reaberta = fatura.reabrir()
    
    expect(reaberta.status).toBe('ABERTA')
    expect(reaberta.dataPagamentoBanco).toBeUndefined()
    expect(reaberta).not.toBe(fatura)
    expect(fatura.status).toBe('FECHADA')
  })

  it('reabrir - deve retornar nova fatura ABERTA a partir de ACERTADA', () => {
    const fatura = new Fatura({ id: 'f1', cartaoId: 'c1', periodo: { mes: 5, ano: 2026 }, responsavelId: 'r1', status: 'ACERTADA', dataPagamentoBanco: new Date() })
    const reaberta = fatura.reabrir()
    
    expect(reaberta.status).toBe('ABERTA')
    expect(reaberta.dataPagamentoBanco).toBeUndefined()
    expect(reaberta).not.toBe(fatura)
  })

  it('reabrir - deve falhar se a fatura ja estiver ABERTA', () => {
    const fatura = new Fatura({ id: 'f1', cartaoId: 'c1', periodo: { mes: 5, ano: 2026 }, responsavelId: 'r1', status: 'ABERTA' })
    expect(() => fatura.reabrir()).toThrow('Apenas faturas FECHADAS ou ACERTADAS podem ser reabertas')
  })

  it('desmarcarAcertada - deve retornar nova fatura FECHADA quando ACERTADA', () => {
    const fatura = new Fatura({ id: 'f1', cartaoId: 'c1', periodo: { mes: 5, ano: 2026 }, responsavelId: 'r1', status: 'ACERTADA' })
    const fechada = fatura.desmarcarAcertada()
    
    expect(fechada.status).toBe('FECHADA')
    expect(fechada).not.toBe(fatura)
  })

  it('desmarcarAcertada - deve retornar a mesma instância quando não é ACERTADA', () => {
    const fatura = new Fatura({ id: 'f1', cartaoId: 'c1', periodo: { mes: 5, ano: 2026 }, responsavelId: 'r1', status: 'FECHADA' })
    const resultado = fatura.desmarcarAcertada()
    
    expect(resultado).toBe(fatura)
  })
})