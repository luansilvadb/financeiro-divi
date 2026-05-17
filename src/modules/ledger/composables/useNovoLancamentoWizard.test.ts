import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createApp, defineComponent } from 'vue'
import { useNovoLancamentoWizard } from './useNovoLancamentoWizard'

// Helper para testar composables que usam hooks de ciclo de vida
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

describe('useNovoLancamentoWizard', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useRealTimers()
  })

  it('deve iniciar com o estado padrão', () => {
    const [{ step, tipo, valor, descricao }] = withSetup(() => useNovoLancamentoWizard([]))
    expect(step.value).toBe(1)
    expect(tipo.value).toBeNull()
    expect(valor.value).toBe(0)
    expect(descricao.value).toBe('')
  })

  it('deve avançar e retroceder passos', () => {
    const [{ step, next, prev }] = withSetup(() => useNovoLancamentoWizard([]))
    next()
    expect(step.value).toBe(2)
    prev()
    expect(step.value).toBe(1)
  })

  it('deve avançar automaticamente ao selecionar tipo', async () => {
    vi.useFakeTimers()
    const [{ step, selecionarTipo }] = withSetup(() => useNovoLancamentoWizard([]))
    
    selecionarTipo('gasto')
    expect(step.value).toBe(1) // Ainda no 1 imediatamente
    
    vi.advanceTimersByTime(60) // Avança mais que 50ms
    expect(step.value).toBe(2)
  })

  it('deve persistir no localStorage ao mudar estado', async () => {
    vi.useFakeTimers()
    const [{ tipo }] = withSetup(() => useNovoLancamentoWizard([]))
    
    tipo.value = 'gasto'
    
    // Aguarda o próximo tick para o watcher disparar
    await Promise.resolve()
    
    // Avança o tempo para o debounce de 500ms
    vi.advanceTimersByTime(600)
    
    const saved = JSON.parse(localStorage.getItem('divi_rascunho_novo_lancamento') || '{}')
    expect(saved.tipo).toBe('gasto')
  })

  it('deve restaurar rascunho do localStorage no onMounted', () => {
    const data = {
      tipo: 'ganho',
      step: 2,
      valor: 150,
      descricao: 'Venda',
      beneficiarios_selecionados: ['1'],
      pagamentos: { '1': 150 }
    }
    localStorage.setItem('divi_rascunho_novo_lancamento', JSON.stringify(data))

    const [{ tipo, step, valor, descricao }] = withSetup(() => useNovoLancamentoWizard([]))
    
    expect(tipo.value).toBe('ganho')
    expect(step.value).toBe(2)
    expect(valor.value).toBe(150)
    expect(descricao.value).toBe('Venda')
  })

  it('deve restaurar valor 0 e descrição vazia do rascunho', () => {
    const data = {
      tipo: 'gasto',
      step: 3,
      valor: 0,
      descricao: '',
      beneficiarios_selecionados: [],
      pagamentos: {}
    }
    localStorage.setItem('divi_rascunho_novo_lancamento', JSON.stringify(data))

    const [{ valor, descricao }] = withSetup(() => useNovoLancamentoWizard([]))
    
    expect(valor.value).toBe(0)
    expect(descricao.value).toBe('')
  })

  it('deve limpar timeouts no onUnmounted', () => {
    vi.useFakeTimers()
    const spyClearTimeout = vi.spyOn(window, 'clearTimeout')
    
    const [, app] = withSetup(() => useNovoLancamentoWizard([]))
    
    app.unmount()
    
    // Deve chamar clearTimeout pelo menos para saveTimeout e transitionTimeout
    expect(spyClearTimeout).toHaveBeenCalled()
    
    spyClearTimeout.mockRestore()
  })

  it('deve gerar uma transação válida ao finalizar', () => {
    const membros = [{ id: '1', nome: 'M1' }]
    const [wizard] = withSetup(() => useNovoLancamentoWizard(membros))
    wizard.tipo.value = 'gasto'
    wizard.valor.value = 100
    wizard.descricao.value = 'Teste'
    wizard.beneficiarios_selecionados.value = ['1']
    wizard.pagamentos.value = { '1': 100 }

    // @ts-ignore - finalizar ainda não existe
    const transacao = wizard.finalizar()
    expect(transacao.descricao).toBe('Teste')
    expect(transacao.total.centavos).toBe(10000)
  })

  it('deve lidar com ganhos (negativando o total)', () => {
    const membros = [{ id: '1', nome: 'M1' }]
    const [wizard] = withSetup(() => useNovoLancamentoWizard(membros))
    wizard.tipo.value = 'ganho'
    wizard.valor.value = 100
    wizard.descricao.value = 'Venda'
    wizard.beneficiarios_selecionados.value = ['1']
    wizard.pagamentos.value = { '1': 100 }

    const transacao = wizard.finalizar()
    expect(transacao.total.centavos).toBe(-10000)
    expect(transacao.divisoes[0].valor.centavos).toBe(-10000)
    expect(transacao.pagamentos[0].valor.centavos).toBe(-10000)
  })
})
