import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createApp, defineComponent } from 'vue'
import { useNovoLancamentoWizard } from './useNovoLancamentoWizard'

function withSetup<T>(composable: () => T) {
  let result: T
  const app = createApp(defineComponent({
    setup() {
      result = composable()
      return () => {}
    }
  }))
  app.mount(document.createElement('div'))
  return [result!, app] as const
}

describe('useNovoLancamentoWizard - Sênior v18', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useRealTimers()
  })

  it('deve inicializar com o estado padrão sênior', () => {
    const [{ step, totalSteps, wizFlow, wizPayment, installments, borrowerId }] = withSetup(() => useNovoLancamentoWizard([]))
    expect(step.value).toBe(1)
    expect(totalSteps.value).toBe(5)
    expect(wizFlow.value).toBe('expense')
    expect(wizPayment.value).toBe('pix')
    expect(installments.value).toBe(1)
    expect(borrowerId.value).toBeNull()
  })

  it('deve avançar e retroceder passos corretamente', () => {
    const [{ step, next, prev }] = withSetup(() => useNovoLancamentoWizard([]))
    expect(step.value).toBe(1)
    next()
    expect(step.value).toBe(2)
    prev()
    expect(step.value).toBe(1)
  })

  it('deve validar canAdvance nos passos do fluxo de Empréstimo', () => {
    const [{ step, wizFlow, compradorSelecionadoId, borrowerId, valor, descricao, canAdvance, next }] = withSetup(() => useNovoLancamentoWizard([]))
    
    // Passo 1: Escolha do fluxo
    wizFlow.value = 'loan'
    expect(canAdvance.value).toBe(true)
    next()

    // Passo 2: Lender
    expect(canAdvance.value).toBe(false)
    compradorSelecionadoId.value = 'luan'
    expect(canAdvance.value).toBe(true)
    next()

    // Passo 3: Borrower
    expect(canAdvance.value).toBe(false)
    borrowerId.value = 'joao'
    expect(canAdvance.value).toBe(true)
    next()

    // Passo 4: Valor
    expect(canAdvance.value).toBe(false)
    valor.value = 500
    expect(canAdvance.value).toBe(true)
    next()

    // Passo 5: Descrição/Lembrete
    expect(canAdvance.value).toBe(false)
    descricao.value = 'Empréstimo do Aluguel'
    expect(canAdvance.value).toBe(true)
  })

  it('deve validar canAdvance nos passos do fluxo de Gasto Comum', () => {
    const [{ step, wizFlow, compradorSelecionadoId, valor, descricao, participantesDivisao, canAdvance, next }] = withSetup(() => useNovoLancamentoWizard(['luan', 'maria'].map(id => ({ id, nome: id }))))
    
    // Passo 1: Escolha do fluxo (Gasto)
    wizFlow.value = 'expense'
    expect(canAdvance.value).toBe(true)
    next()

    // Passo 2: Quem pagou?
    expect(canAdvance.value).toBe(false)
    compradorSelecionadoId.value = 'luan'
    expect(canAdvance.value).toBe(true)
    next()

    // Passo 3: Qual foi o valor?
    expect(canAdvance.value).toBe(false)
    valor.value = 250
    expect(canAdvance.value).toBe(true)
    next()

    // Passo 4: Descrição
    expect(canAdvance.value).toBe(false)
    descricao.value = 'Churrasco'
    expect(canAdvance.value).toBe(true)
    next()

    // Passo 5: Divisão rateio
    expect(canAdvance.value).toBe(true) // Padrão seleciona todos, então pode avançar
    participantesDivisao.value = []
    expect(canAdvance.value).toBe(false) // Se ninguém, não pode avançar
  })
})
