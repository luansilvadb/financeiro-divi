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

  describe('Comparisons', () => {
    it('deve verificar maiorQue', () => {
      const d1 = Dinheiro.deReais(20)
      const d2 = Dinheiro.deReais(10)
      expect(d1.maiorQue(d2)).toBe(true)
      expect(d2.maiorQue(d1)).toBe(false)
    })

    it('deve verificar menorQue', () => {
      const d1 = Dinheiro.deReais(10)
      const d2 = Dinheiro.deReais(20)
      expect(d1.menorQue(d2)).toBe(true)
      expect(d2.menorQue(d1)).toBe(false)
    })

    it('deve verificar se é zero', () => {
      expect(Dinheiro.deCentavos(0).isZero()).toBe(true)
      expect(Dinheiro.deCentavos(1).isZero()).toBe(false)
    })

    it('deve verificar se é positivo ou negativo', () => {
      expect(Dinheiro.deCentavos(10).isPositivo()).toBe(true)
      expect(Dinheiro.deCentavos(-10).isNegativo()).toBe(true)
    })
  })

  it('deve multiplicar por um fator (arredondando centavos)', () => {
    // 10.55 * 0.5 = 5.275 -> 5.28
    const d = Dinheiro.deReais(10.55)
    expect(d.multiplicar(0.5).centavos).toBe(528)
  })

  describe('Allocation', () => {
    it('deve distribuir o valor proporcionalmente sem perder centavos', () => {
      // R$ 0,05 distribuído em 3 partes iguais
      // 5 centavos / 3 = 1.666...
      // Deve resultar em [2, 2, 1] ou [2, 1, 2] etc, totalizando 5.
      const d = Dinheiro.deCentavos(5)
      const partes = d.distribuir(3)
      
      expect(partes.length).toBe(3)
      const soma = partes.reduce((acc, p) => acc + p.centavos, 0)
      expect(soma).toBe(5)
      expect(partes[0].centavos).toBe(2)
      expect(partes[1].centavos).toBe(2)
      expect(partes[2].centavos).toBe(1)
    })

    it('deve distribuir por pesos', () => {
      // R$ 1,00 (100 centavos) com pesos 70 e 30
      const d = Dinheiro.deReais(1)
      const partes = d.distribuirPorPesos([70, 30])
      expect(partes[0].centavos).toBe(70)
      expect(partes[1].centavos).toBe(30)
    })

    it('deve distribuir por pesos com centavos órfãos', () => {
      // R$ 0,05 distribuído com pesos 1, 1, 1 (33.3% cada)
      // 5 / 3 = 1.666...
      // Deve resultar em [2, 2, 1]
      const d = Dinheiro.deCentavos(5)
      const partes = d.distribuirPorPesos([1, 1, 1])
      expect(partes[0].centavos).toBe(2)
      expect(partes[1].centavos).toBe(2)
      expect(partes[2].centavos).toBe(1)
      expect(partes.reduce((acc, p) => acc + p.centavos, 0)).toBe(5)
    })
  })
})
