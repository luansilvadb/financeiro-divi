import { describe, it, expect } from 'vitest'
import { Dinheiro } from './Dinheiro'

describe('Dinheiro Value Object', () => {
  it('deve criar uma instância com valor centesimal', () => {
    const d = Dinheiro.deReais(10.50)
    expect(d.centavos).toBe(1050)
  })

  it('deve formatar para PT-BR', () => {
    const d = Dinheiro.deReais(10.50)
    expect(d.formatar()).toBe('R$\u00a010,50')
  })

  it('deve somar dois valores', () => {
    const d1 = Dinheiro.deReais(10)
    const d2 = Dinheiro.deReais(20)
    expect(d1.somar(d2).centavos).toBe(3000)
  })

  it('deve verificar igualdade', () => {
    const d1 = Dinheiro.deReais(10)
    const d2 = Dinheiro.deReais(10)
    const d3 = Dinheiro.deReais(20)
    expect(d1.equals(d2)).toBe(true)
    expect(d1.equals(d3)).toBe(false)
  })

  it('deve subtrair dois valores', () => {
    const d1 = Dinheiro.deReais(20)
    const d2 = Dinheiro.deReais(5.50)
    expect(d1.subtrair(d2).centavos).toBe(1450)
  })
})
