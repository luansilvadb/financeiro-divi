import { describe, it, expect } from 'vitest'
import { gastoPertenceAoPeriodo } from './gastoPeriodo'
import { Gasto } from '../../models/entities/Gasto'
import { Fatura } from '../../models/entities/Fatura'
import { Dinheiro } from '../../models/entities/Dinheiro'

describe('gastoPertenceAoPeriodo', () => {
  const mes = 5
  const ano = 2024

  const criarGasto = (faturaId: string) => new Gasto({
    id: 'g1',
    faturaId,
    descricao: 'Teste',
    valorTotal: Dinheiro.deReais(10),
    compradorId: 'c1',
    divisoes: []
  })

  it('deve retornar true quando a fatura existe e o período coincide', () => {
    const fatura = new Fatura({
      id: 'f1',
      cartaoId: 'c1',
      periodo: { mes, ano },
      responsavelId: 'r1',
      status: 'ABERTA'
    })
    const gasto = criarGasto('f1')
    expect(gastoPertenceAoPeriodo(gasto, mes, ano, [fatura])).toBe(true)
  })

  it('deve retornar false quando a fatura existe mas o período não coincide', () => {
    const fatura = new Fatura({
      id: 'f1',
      cartaoId: 'c1',
      periodo: { mes: 6, ano: 2024 },
      responsavelId: 'r1',
      status: 'ABERTA'
    })
    const gasto = criarGasto('f1')
    expect(gastoPertenceAoPeriodo(gasto, mes, ano, [fatura])).toBe(false)
  })

  it('deve retornar true quando a fatura não existe mas o período virtual no faturaId coincide', () => {
    const gasto = criarGasto(`prefix-${mes}-${ano}`)
    expect(gastoPertenceAoPeriodo(gasto, mes, ano, [])).toBe(true)
  })

  it('deve retornar false quando a fatura não existe e o período virtual no faturaId não coincide', () => {
    const gasto = criarGasto(`prefix-6-2024`)
    expect(gastoPertenceAoPeriodo(gasto, mes, ano, [])).toBe(false)
  })

  it('deve retornar false quando a fatura não existe e o faturaId é inválido para extração de período', () => {
    const gasto = criarGasto('fatura-invalida')
    expect(gastoPertenceAoPeriodo(gasto, mes, ano, [])).toBe(false)
  })
})
