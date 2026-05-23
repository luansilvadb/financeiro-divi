import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createApp, defineComponent, ref } from 'vue'
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
    sessionStorage.clear()
    vi.useRealTimers()
  })

  it('deve inicializar com o estado padrão sênior', () => {
    const [{ step, totalSteps, wizFlow, wizPayment, installments, borrowerId }] = withSetup(() => useNovoLancamentoWizard([]))
    expect(step.value).toBe(1)
    expect(totalSteps.value).toBe(5)
    expect(wizFlow.value).toBeNull()
    expect(wizPayment.value).toBeNull()
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
    expect(canAdvance.value).toBe(false) // Sem fluxo, não avança
    wizFlow.value = 'loan'
    expect(canAdvance.value).toBe(true) // Com fluxo, avança
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
    expect(canAdvance.value).toBe(false) // Sem fluxo, não avança
    wizFlow.value = 'expense'
    expect(canAdvance.value).toBe(true) // Com fluxo, avança
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

    const { LocalStorageGastoRepository } = await import('../models/repositories/local/LocalStorageGastoRepository')
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

  it('deve delegar a criacao de gasto para o GastoService injetado', async () => {
    const mockGastoService = {
      lancarGastoOuEmprestimo: vi.fn()
    }
    const [{ wizFlow, wizPayment, compradorSelecionadoId, valor, finalizarGastoOuEmprestimo }] = withSetup(() => 
      useNovoLancamentoWizard(['luan'].map(id => ({ id, nome: id })), {
        gastoService: mockGastoService as any
      })
    )

    wizFlow.value = 'expense'
    wizPayment.value = 'pix'
    compradorSelecionadoId.value = 'luan'
    valor.value = 100

    await finalizarGastoOuEmprestimo()

    expect(mockGastoService.lancarGastoOuEmprestimo).toHaveBeenCalledWith(expect.objectContaining({
      flow: 'expense',
      paymentMethod: 'pix',
      compradorId: 'luan',
      valor: 100
    }))
  })

  it('deve salvar e carregar rascunho de lancamento usando o rascunhoWizardStorage', async () => {
    vi.useFakeTimers()
    const [{ wizFlow, compradorSelecionadoId, valor }, app] = withSetup(() => 
      useNovoLancamentoWizard(['luan'].map(id => ({ id, nome: id })))
    )

    wizFlow.value = 'expense'
    compradorSelecionadoId.value = 'luan'
    valor.value = 100

    // Aguardar o watcher do Vue rodar para agendar o setTimeout
    await Promise.resolve()

    // Esperar rodar o watch e o timeout
    vi.advanceTimersByTime(600)

    // Desmontar para simular nova sessão
    app.unmount()
    vi.useRealTimers()

    // Instanciar novo
    const [{ wizFlow: wizFlow2, compradorSelecionadoId: compradorSelecionadoId2, valor: valor2 }] = withSetup(() => 
      useNovoLancamentoWizard(['luan'].map(id => ({ id, nome: id })))
    )

    // Aguardar Mounted tick
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(wizFlow2.value).toBe('expense')
    expect(compradorSelecionadoId2.value).toBe('luan')
    expect(valor2.value).toBe(100)
  })

  it('deve salvar e carregar rascunho incluindo divisoes customizadas e modo de divisao', async () => {
    vi.useFakeTimers()
    const [{ wizFlow, compradorSelecionadoId, valor, modoDivisaoWizard, participantesDivisao, valoresDivisaoWizard }, app] = withSetup(() => 
      useNovoLancamentoWizard(['luan', 'maria'].map(id => ({ id, nome: id })))
    )

    wizFlow.value = 'expense'
    compradorSelecionadoId.value = 'luan'
    valor.value = 100
    modoDivisaoWizard.value = 'MANUAL'
    participantesDivisao.value = ['luan', 'maria']
    valoresDivisaoWizard.value = { luan: 40, maria: 60 }

    // Aguardar o watcher do Vue rodar para agendar o setTimeout
    await Promise.resolve()

    // Esperar rodar o watch e o timeout
    vi.advanceTimersByTime(600)

    // Desmontar para simular nova sessão
    app.unmount()
    vi.useRealTimers()

    // Instanciar novo
    const [{ 
      wizFlow: wizFlow2, 
      compradorSelecionadoId: compradorSelecionadoId2, 
      valor: valor2,
      modoDivisaoWizard: modoDivisaoWizard2,
      participantesDivisao: participantesDivisao2,
      valoresDivisaoWizard: valoresDivisaoWizard2
    }] = withSetup(() => 
      useNovoLancamentoWizard(['luan', 'maria'].map(id => ({ id, nome: id })))
    )

    // Aguardar Mounted tick
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(wizFlow2.value).toBe('expense')
    expect(compradorSelecionadoId2.value).toBe('luan')
    expect(valor2.value).toBe(100)
    expect(modoDivisaoWizard2.value).toBe('MANUAL')
    expect(participantesDivisao2.value).toEqual(['luan', 'maria'])
    expect(valoresDivisaoWizard2.value).toEqual({ luan: 40, maria: 60 })
  })

  it('deve tolerar diferenca de ate 1 centavo por arredondamento em divisao manual', () => {
    const [{ step, wizFlow, compradorSelecionadoId, valor, descricao, modoDivisaoWizard, participantesDivisao, valoresDivisaoWizard, canAdvance }] = withSetup(() => 
      useNovoLancamentoWizard(['luan', 'maria', 'joao'].map(id => ({ id, nome: id })))
    )

    wizFlow.value = 'expense'
    compradorSelecionadoId.value = 'luan'
    valor.value = 10.00
    descricao.value = 'Lanche'
    modoDivisaoWizard.value = 'MANUAL'
    participantesDivisao.value = ['luan', 'maria', 'joao']
    
    // Divisão de R$ 10.00 por 3 pessoas = R$ 3.33 + R$ 3.33 + R$ 3.34 = R$ 10.00
    valoresDivisaoWizard.value = { luan: 3.33, maria: 3.33, joao: 3.34 }

    step.value = 5 // Passo de rateio
    expect(canAdvance.value).toBe(true)

    // Divisão com arredondamento divergente em 1 centavo a menos (R$ 3.33 + R$ 3.33 + R$ 3.33 = R$ 9.99)
    valoresDivisaoWizard.value = { luan: 3.33, maria: 3.33, joao: 3.33 }
    expect(canAdvance.value).toBe(true) // Tolerância de 1 centavo

    // Divisão com arredondamento divergente em 2 centavos (R$ 3.32 + R$ 3.32 + R$ 3.32 = R$ 9.96)
    valoresDivisaoWizard.value = { luan: 3.32, maria: 3.32, joao: 3.32 }
    expect(canAdvance.value).toBe(false) // Fora da tolerância
  })

  it('deve sincronizar dinamicamente a prop de membros e higienizar deletados', async () => {
    const membrosRef = ref<{ id: string; nome: string }[]>([])
    const [{ participantesDivisao }] = withSetup(() => useNovoLancamentoWizard(() => membrosRef.value))

    // Inicia vazia
    expect(participantesDivisao.value.length).toBe(0)

    // Simula membros carregados assincronamente
    membrosRef.value = ['luan', 'maria'].map(id => ({ id, nome: id }))
    await Promise.resolve() // Watch tick do Vue
    expect(participantesDivisao.value).toEqual(['luan', 'maria'])

    // Simula remoção de um membro (higienização)
    membrosRef.value = [{ id: 'luan', nome: 'luan' }]
    await Promise.resolve() // Watch tick do Vue
    expect(participantesDivisao.value).toEqual(['luan'])
  })

  it('deve bloquear chamadas simultaneas concorrentes de finalizacao (double-submit)', async () => {
    const mockGastoService = {
      lancarGastoOuEmprestimo: vi.fn(() => new Promise(resolve => setTimeout(resolve, 100)))
    }
    const [hookInstance] = withSetup(() => 
      useNovoLancamentoWizard(['luan'].map(id => ({ id, nome: id })), {
        gastoService: mockGastoService as any
      })
    )

    hookInstance.wizFlow.value = 'expense'
    hookInstance.wizPayment.value = 'pix'
    hookInstance.compradorSelecionadoId.value = 'luan'
    hookInstance.valor.value = 100

    // Dispara em paralelo
    const p1 = hookInstance.finalizarGastoOuEmprestimo()
    const p2 = hookInstance.finalizarGastoOuEmprestimo()
    
    expect(hookInstance.isSubmitting.value).toBe(true)
    
    await Promise.all([p1, p2])
    
    expect(mockGastoService.lancarGastoOuEmprestimo).toHaveBeenCalledTimes(1)
    expect(hookInstance.isSubmitting.value).toBe(false)
  })

  it('nao deve salvar rascunho com dados vazios no localStorage apos a chamada do reset', async () => {
    vi.useFakeTimers()
    const [{ wizFlow, compradorSelecionadoId, valor, reset }] = withSetup(() => 
      useNovoLancamentoWizard(['luan'].map(id => ({ id, nome: id })))
    )

    wizFlow.value = 'expense'
    compradorSelecionadoId.value = 'luan'
    valor.value = 100

    await Promise.resolve() // watch tick
    reset()

    // Avança timers
    vi.advanceTimersByTime(600)
    
    const { obterRascunhoWizard } = await import('../shared/utils/rascunhoWizardStorage')
    expect(obterRascunhoWizard()).toBeNull()
    vi.useRealTimers()
  })
})


