import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useNovoLancamentoWizard } from './useNovoLancamentoWizard'

describe('useNovoLancamentoWizard', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useRealTimers()
  })

  it('deve iniciar com o estado padrão', () => {
    const { step, tipo, valor, descricao } = useNovoLancamentoWizard([])
    expect(step.value).toBe(1)
    expect(tipo.value).toBeNull()
    expect(valor.value).toBe(0)
    expect(descricao.value).toBe('')
  })

  it('deve avançar e retroceder passos', () => {
    const { step, next, prev } = useNovoLancamentoWizard([])
    next()
    expect(step.value).toBe(2)
    prev()
    expect(step.value).toBe(1)
  })

  it('deve avançar automaticamente ao selecionar tipo', async () => {
    vi.useFakeTimers()
    const { step, selecionarTipo } = useNovoLancamentoWizard([])
    
    selecionarTipo('gasto')
    expect(step.value).toBe(1) // Ainda no 1 imediatamente
    
    vi.advanceTimersByTime(60) // Avança mais que 50ms
    expect(step.value).toBe(2)
  })

  it('deve persistir no localStorage ao mudar estado', async () => {
    vi.useFakeTimers()
    const { tipo, selecionarTipo } = useNovoLancamentoWizard([])
    
    tipo.value = 'gasto'
    
    // Aguarda o próximo tick para o watcher disparar
    await Promise.resolve()
    
    // Avança o tempo para o debounce de 500ms
    vi.advanceTimersByTime(600)
    
    const saved = JSON.parse(localStorage.getItem('divi_rascunho_novo_lancamento') || '{}')
    expect(saved.tipo).toBe('gasto')
  })
})
