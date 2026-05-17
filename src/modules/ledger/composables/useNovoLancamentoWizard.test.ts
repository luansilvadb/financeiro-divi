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

describe('useNovoLancamentoWizard - Fluxo de Cartão', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useRealTimers()
  })

  it('deve iniciar com o estado padrão para cartões', () => {
    const [{ step, valor, descricao, cartaoSelecionadoId }] = withSetup(() => useNovoLancamentoWizard([]))
    expect(step.value).toBe(1)
    expect(valor.value).toBe(0)
    expect(descricao.value).toBe('')
    expect(cartaoSelecionadoId.value).toBe('')
  })

  it('deve avançar e retroceder passos', () => {
    const [{ step, next, prev }] = withSetup(() => useNovoLancamentoWizard([]))
    next()
    expect(step.value).toBe(2)
    prev()
    expect(step.value).toBe(1)
  })

  it('deve selecionar comprador', () => {
    const [{ compradorSelecionadoId }] = withSetup(() => useNovoLancamentoWizard([]))
    expect(compradorSelecionadoId.value).toBe('')
    compradorSelecionadoId.value = 'm1'
    expect(compradorSelecionadoId.value).toBe('m1')
  })

  it('deve alternar o fluxo entre Gasto e Adiantamento corretamente', () => {
    const [{ tipo, step, canAdvance }] = withSetup(() => useNovoLancamentoWizard([]))
    expect(tipo.value).toBe('GASTO')
    expect(step.value).toBe(1)
    
    // No passo 1 (escolha de ação), sempre podemos avançar
    expect(canAdvance.value).toBe(true)

    tipo.value = 'ADIANTAMENTO'
    expect(tipo.value).toBe('ADIANTAMENTO')
  })
})
