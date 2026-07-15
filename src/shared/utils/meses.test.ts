import { describe, it, expect } from 'vitest'
import { NOMES_MESES, formatarMesAno } from './meses'

describe('meses utils', () => {
  describe('NOMES_MESES', () => {
    it('deve conter 12 meses', () => {
      expect(NOMES_MESES).toHaveLength(12)
    })

    it('deve ter os nomes corretos em português', () => {
      const mesesEsperados = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
      ]
      expect(NOMES_MESES).toEqual(mesesEsperados)
    })
  })

  describe('formatarMesAno', () => {
    it('deve formatar corretamente Janeiro de 2024', () => {
      expect(formatarMesAno(1, 2024)).toBe('Janeiro 2024')
    })

    it('deve formatar corretamente Dezembro de 2023', () => {
      expect(formatarMesAno(12, 2023)).toBe('Dezembro 2023')
    })

    it('deve formatar corretamente um mês no meio do ano', () => {
      expect(formatarMesAno(6, 2025)).toBe('Junho 2025')
    })

    it('deve lidar com anos bissextos ou futuros sem problemas de lógica de data (pois é apenas formatação de string)', () => {
      expect(formatarMesAno(2, 2024)).toBe('Fevereiro 2024')
      expect(formatarMesAno(2, 2025)).toBe('Fevereiro 2025')
    })
  })
})
