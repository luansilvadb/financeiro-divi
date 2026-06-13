import { describe, it, expect } from 'vitest'
import { formatarBRL, formatarCentavosParaBRL, aplicarMascaraBRLText } from './formatarMoeda'

describe('formatarMoeda', () => {
  describe('formatarBRL', () => {
    it('deve formatar valor com símbolo R$ por padrão', () => {
      // Usamos regex ou replace pois toLocaleString pode ter espaços normais ou non-breaking spaces
      const formatado = formatarBRL(1250.5).replace(/\s/g, ' ')
      expect(formatado).toBe('R$ 1.250,50')
    })

    it('deve formatar valor sem símbolo R$ se solicitado', () => {
      expect(formatarBRL(1250.5, false)).toBe('1.250,50')
    })

    it('deve formatar valores negativos corretamente', () => {
      const formatado = formatarBRL(-45.99).replace(/\s/g, ' ')
      expect(formatado).toContain('-R$')
      expect(formatado).toContain('45,99')
    })
  })

  describe('formatarCentavosParaBRL', () => {
    it('deve converter centavos para reais e formatar com símbolo', () => {
      const formatado = formatarCentavosParaBRL(125050).replace(/\s/g, ' ')
      expect(formatado).toBe('R$ 1.250,50')
    })

    it('deve converter centavos para reais e formatar sem símbolo', () => {
      expect(formatarCentavosParaBRL(125050, false)).toBe('1.250,50')
    })

    it('deve aceitar BigInt como entrada', () => {
      const formatado = formatarCentavosParaBRL(125050n).replace(/\s/g, ' ')
      expect(formatado).toBe('R$ 1.250,50')
    })
  })

  describe('aplicarMascaraBRLText', () => {
    it('deve formatar digitação de números sequenciais', () => {
      expect(aplicarMascaraBRLText('1')).toBe('0,01')
      expect(aplicarMascaraBRLText('12')).toBe('0,12')
      expect(aplicarMascaraBRLText('123')).toBe('1,23')
      expect(aplicarMascaraBRLText('1234')).toBe('12,34')
      expect(aplicarMascaraBRLText('12345')).toBe('123,45')
      expect(aplicarMascaraBRLText('123456')).toBe('1.234,56')
    })

    it('deve ignorar caracteres não numéricos', () => {
      expect(aplicarMascaraBRLText('R$ 12a3')).toBe('1,23')
    })

    it('deve retornar vazio se não houver dígitos', () => {
      expect(aplicarMascaraBRLText('')).toBe('')
      expect(aplicarMascaraBRLText('abc')).toBe('')
    })

    it('deve limitar quantidade de caracteres de acordo com maxDigitos', () => {
      // Limite padrão é 10 dígitos -> 99.999.999,99
      expect(aplicarMascaraBRLText('1234567890123')).toBe('12.345.678,90')
      // Limite customizado de 5 dígitos -> 999,99
      expect(aplicarMascaraBRLText('1234567', 5)).toBe('123,45')
    })
  })
})
