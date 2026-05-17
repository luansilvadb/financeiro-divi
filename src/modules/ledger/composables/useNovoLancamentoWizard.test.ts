import { describe, it, expect } from 'vitest'
import { useNovoLancamentoWizard } from './useNovoLancamentoWizard'

describe('useNovoLancamentoWizard', () => {
  it('deve iniciar com o estado padrão', () => {
    const { step, tipo, valor, descricao } = useNovoLancamentoWizard([])
    expect(step.value).toBe(1)
    expect(tipo.value).toBeNull()
    expect(valor.value).toBe(0)
    expect(descricao.value).toBe('')
  })
})
