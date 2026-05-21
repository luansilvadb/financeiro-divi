import { describe, it, expect, vi } from 'vitest'
import { gerarListaMesesSeletor } from './meses'

describe('meses util', () => {
  it('deve gerar lista de 25 meses centrada no mês atual', () => {
    vi.useFakeTimers()
    // Fixa a data hoje para 15/05/2024
    vi.setSystemTime(new Date(2024, 4, 15))

    const faturasFechadas = [
      { periodo: { mes: 4, ano: 2024 } }
    ]

    const lista = gerarListaMesesSeletor(faturasFechadas)

    expect(lista).toHaveLength(25) // -12 a +12 inclusive = 25
    expect(lista[12].mes).toBe(5) // Mês atual
    expect(lista[12].ano).toBe(2024)
    expect(lista[12].status).toBe('ABERTA')
    
    // Mês anterior (Abril) deve estar fechado conforme o mock
    expect(lista[11].mes).toBe(4)
    expect(lista[11].status).toBe('FECHADA')

    vi.useRealTimers()
  })
})
