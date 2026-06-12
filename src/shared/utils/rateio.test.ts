import { describe, expect, it } from 'vitest'
import { calcularRateioProporcionalCentavos, obterMembrosSelecionadosSemRenda } from './rateio'

describe('rateio proporcional', () => {
  it('fecha exatamente o total em centavos', () => {
    const valores = calcularRateioProporcionalCentavos(10001, [
      { id: 'a', rendaCentavos: 300 },
      { id: 'b', rendaCentavos: 200 },
    ])

    expect(Object.values(valores).reduce((total, valor) => total + valor, 0)).toBe(10001)
  })

  it('desempata o resto por id quando as rendas são iguais', () => {
    expect(calcularRateioProporcionalCentavos(1, [
      { id: 'b', rendaCentavos: 100 },
      { id: 'a', rendaCentavos: 100 },
    ])).toEqual({ a: 1, b: 0 })
  })

  it('considera somente participantes selecionados sem renda positiva', () => {
    expect(obterMembrosSelecionadosSemRenda([
      { id: 'a', rendaCentavos: 100 },
      { id: 'b' },
      { id: 'c' },
    ], ['a', 'b'])).toEqual([{ id: 'b' }])
  })
})
