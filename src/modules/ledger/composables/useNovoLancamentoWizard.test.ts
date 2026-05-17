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

  it('deve alternar totalSteps e validar canAdvance no passo 5 com divisao igual ou manual', () => {
    const [{ step, tipo, querDividirAgora, totalSteps, canAdvance, participantesDivisao, modoDivisaoWizard, valoresDivisaoWizard, valor, compradorSelecionadoId }] = withSetup(() => useNovoLancamentoWizard([]))
    
    tipo.value = 'GASTO'
    compradorSelecionadoId.value = 'm1'
    valor.value = 100
    
    expect(totalSteps.value).toBe(4) // Sem divisao imediata, sao 4 passos
    
    querDividirAgora.value = true
    expect(totalSteps.value).toBe(5) // Com divisao imediata, sao 5 passos
    
    step.value = 5
    
    // Modo IGUAL: canAdvance e falso se nao houver participantes
    expect(canAdvance.value).toBe(false)
    
    participantesDivisao.value = ['m1', 'm2']
    expect(canAdvance.value).toBe(true) // Agora tem participantes
    
    // Modo MANUAL: canAdvance e falso se a soma dos valores nao bater
    modoDivisaoWizard.value = 'MANUAL'
    valoresDivisaoWizard.value = { m1: 50, m2: 40 }
    expect(canAdvance.value).toBe(false) // 50 + 40 = 90 (total = 100) -> Diferente!
    
    valoresDivisaoWizard.value = { m1: 50, m2: 50 }
    expect(canAdvance.value).toBe(true) // 50 + 50 = 100 -> Perfeito!
  })
})
