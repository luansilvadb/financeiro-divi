import { describe, it, expect } from 'vitest'
import { Fatura } from './Fatura'

describe('Fatura', () => {
  it('fechar - deve retornar nova fatura FECHADA e permitir operação mesmo se já estiver FECHADA', () => {
    const fatura = new Fatura({ id: 'f1', cartaoId: 'c1', periodo: { mes: 5, ano: 2026 }, responsavelId: 'r1', status: 'FECHADA' })
    const dataPagamento = new Date('2026-05-20T10:00:00Z')
    const novaFechada = fatura.fechar({ dataPagamentoBanco: dataPagamento })
    
    expect(novaFechada.status).toBe('FECHADA')
    expect(novaFechada.dataPagamentoBanco).toBe(dataPagamento)
    expect(novaFechada).not.toBe(fatura)
  })

  it('reabrir - deve retornar nova fatura ABERTA mesmo se já estiver ABERTA', () => {
    const fatura = new Fatura({ id: 'f1', cartaoId: 'c1', periodo: { mes: 5, ano: 2026 }, responsavelId: 'r1', status: 'ABERTA' })
    const reaberta = fatura.reabrir()
    expect(reaberta.status).toBe('ABERTA')
    expect(reaberta.dataPagamentoBanco).toBeUndefined()
    expect(reaberta).not.toBe(fatura)
  })
})
