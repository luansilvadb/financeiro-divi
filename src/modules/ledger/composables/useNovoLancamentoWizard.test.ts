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
    const [{ wizFlow, compradorSelecionadoId, borrowerId, valor, descricao, canAdvance, next }] = withSetup(() => useNovoLancamentoWizard([]))
    
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
    const [{ wizFlow, compradorSelecionadoId, valor, descricao, participantesDivisao, canAdvance, next }] = withSetup(() => useNovoLancamentoWizard(['luan', 'maria'].map(id => ({ id, nome: id }))))
    
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

  it('deve projetar parcelas futuras imediatamente ao salvar um gasto parcelado no cartão', async () => {
    const [{ wizFlow, wizPayment, wizCardOwner, compradorSelecionadoId, valor, descricao, installments, finalizarGastoOuEmprestimo }] = withSetup(() => 
      useNovoLancamentoWizard(['luan', 'maria'].map(id => ({ id, nome: id })))
    )

    // Configura o wizard para gasto parcelado no cartão
    wizFlow.value = 'expense'
    wizPayment.value = 'card'
    wizCardOwner.value = 'c1' // ID do cartão
    compradorSelecionadoId.value = 'luan'
    valor.value = 300
    descricao.value = 'Geladeira'
    installments.value = 3 // 3 parcelas de R$ 100,00

    await finalizarGastoOuEmprestimo()

    const { LocalStorageGastoRepository } = await import('../adapters/LocalStorageGastoRepository')
    const gRepo = new LocalStorageGastoRepository()
    const todosGastos = await gRepo.listarTodos()

    // Como o repositório é limpo em cada teste, devemos ter exatamente 3 parcelas projetadas
    expect(todosGastos.length).toBe(3)

    // Todas as parcelas devem compartilhar o mesmo grupoParcelasId
    const g1 = todosGastos[0]
    const g2 = todosGastos[1]
    const g3 = todosGastos[2]

    expect(g1.grupoParcelasId).not.toBeNull()
    expect(g2.grupoParcelasId).toBe(g1.grupoParcelasId)
    expect(g3.grupoParcelasId).toBe(g1.grupoParcelasId)

    // Verificar installments decrescentes (3, 2, 1)
    expect(g1.installments).toBe(3)
    expect(g2.installments).toBe(2)
    expect(g3.installments).toBe(1)

    // Verificar totalInstallments constante (3)
    expect(g1.totalInstallments).toBe(3)
    expect(g2.totalInstallments).toBe(3)
    expect(g3.totalInstallments).toBe(3)
  })
})
