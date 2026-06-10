import { describe, it, expect } from 'vitest'
import { formatarMesAno, NOMES_MESES } from './meses'

describe('meses utils', () => {
  describe('NOMES_MESES', () => {
    it('deve ter 12 meses', () => {
      expect(NOMES_MESES).toHaveLength(12)
    })

    it('deve conter os nomes dos meses em português', () => {
      expect(NOMES_MESES[0]).toBe('Janeiro')
      expect(NOMES_MESES[11]).toBe('Dezembro')
    })
  })

  describe('formatarMesAno', () => {
    it('deve formatar Janeiro de 2024 corretamente', () => {
      expect(formatarMesAno(1, 2024)).toBe('Janeiro 2024')
    })

    it('deve formatar Dezembro de 2023 corretamente', () => {
      expect(formatarMesAno(12, 2023)).toBe('Dezembro 2023')
    })

    it('deve formatar um mês no meio do ano corretamente', () => {
      expect(formatarMesAno(6, 2025)).toBe('Junho 2025')
    })

    it('deve formatar Março corretamente (caractere especial)', () => {
      expect(formatarMesAno(3, 2024)).toBe('Março 2024')
    })
  })
})
