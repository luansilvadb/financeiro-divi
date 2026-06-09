import { describe, it, expect } from 'vitest'
import { calcularContextoParcela, valorParcelaAtual } from './ParcelaCalculator'
import { Dinheiro } from './Dinheiro'

describe('ParcelaCalculator', () => {
  describe('calcularContextoParcela', () => {
    it('deve usar totalInstallments como divisor quando disponível', () => {
      const resultado = calcularContextoParcela(3, 6)
      expect(resultado.divisor).toBe(6)
      expect(resultado.index).toBe(3) // 6 - 3
    })

    it('deve usar installments como fallback quando totalInstallments é 0', () => {
      const resultado = calcularContextoParcela(4, 0)
      expect(resultado.divisor).toBe(4)
      expect(resultado.index).toBe(0) // 4 - 4
    })

    it('deve retornar divisor 1 quando ambos são 0', () => {
      const resultado = calcularContextoParcela(0, 0)
      expect(resultado.divisor).toBe(1)
      expect(resultado.index).toBe(1) // Math.max(0, 1 - 0) — fora do range, valorParcelaAtual retornaria 0
    })

    it('deve clampar index em 0 quando installments > divisor', () => {
      const resultado = calcularContextoParcela(10, 3)
      expect(resultado.divisor).toBe(3)
      expect(resultado.index).toBe(0) // Math.max(0, 3 - 10) = 0
    })

    it('deve calcular corretamente a primeira parcela', () => {
      const resultado = calcularContextoParcela(3, 3)
      expect(resultado.divisor).toBe(3)
      expect(resultado.index).toBe(0)
    })

    it('deve calcular corretamente a última parcela', () => {
      const resultado = calcularContextoParcela(1, 3)
      expect(resultado.divisor).toBe(3)
      expect(resultado.index).toBe(2)
    })
  })

  describe('valorParcelaAtual', () => {
    it('deve distribuir R$100 em 3 parcelas e retornar a primeira', () => {
      const valor = Dinheiro.deReais(100) // 10000 centavos
      const resultado = valorParcelaAtual(valor, 3, 3)
      expect(resultado.centavos).toBe(3334)
    })

    it('deve distribuir R$100 em 3 parcelas e retornar a última', () => {
      const valor = Dinheiro.deReais(100)
      const resultado = valorParcelaAtual(valor, 1, 3)
      expect(resultado.centavos).toBe(3333)
    })

    it('deve retornar o valor total para parcela única', () => {
      const valor = Dinheiro.deReais(50)
      const resultado = valorParcelaAtual(valor, 1, 1)
      expect(resultado.centavos).toBe(5000)
    })

    it('deve retornar 0 quando index está fora do range', () => {
      const valor = Dinheiro.deReais(100)
      const resultado = valorParcelaAtual(valor, 0, 3)
      expect(resultado.centavos).toBe(0)
    })

    it('deve funcionar com fallback quando totalInstallments é 0', () => {
      const valor = Dinheiro.deReais(200)
      const resultado = valorParcelaAtual(valor, 1, 0)
      expect(resultado.centavos).toBe(20000)
    })
  })
})
