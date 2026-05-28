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

  it('deve verificar se é positivo', () => {
    expect(Dinheiro.deCentavos(10).isPositivo()).toBe(true)
    expect(Dinheiro.deCentavos(0).isPositivo()).toBe(false)
  })

  describe('Allocation', () => {
    it('deve lançar erro ao tentar distribuir por zero ou negativo', () => {
      const d = Dinheiro.deReais(10)
      expect(() => d.distribuir(0)).toThrow('Número de partes deve ser maior que zero')
      expect(() => d.distribuir(-1)).toThrow('Número de partes deve ser maior que zero')
    })

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



    describe('Property-Based Constraints (Invariantes)', () => {
      const cenarios = [
        { total: 1000, partes: 3 },   // R$ 10,00 por 3
        { total: 5, partes: 3 },      // R$ 0,05 por 3
        { total: -1000, partes: 3 },  // Estorno de R$ 10,00 por 3
        { total: -5, partes: 3 },     // Estorno de R$ 0,05 por 3
        { total: 100, partes: 1 },    // Individual
        { total: 100, partes: 10 }    // Divisão exata
      ]

      cenarios.forEach(({ total, partes: n }) => {
        it(`deve respeitar invariantes para total ${total} e n=${n}`, () => {
          const d = Dinheiro.deCentavos(total)
          const resultados = d.distribuir(n)

          // Propriedade 1: A soma das partes deve ser EXATAMENTE igual ao total original
          const soma = resultados.reduce((acc, p) => acc + p.centavos, 0)
          expect(soma).toBe(total)

          // Propriedade 2: A diferença entre a maior e a menor parte deve ser no máximo 1 centavo
          // Isso garante que a distribuição foi a mais justa possível (sem favoritismo excessivo)
          const centavos = resultados.map(p => p.centavos)
          const max = Math.max(...centavos)
          const min = Math.min(...centavos)
          expect(max - min).toBeLessThanOrEqual(1)
        })
      })
    })
  })
})
