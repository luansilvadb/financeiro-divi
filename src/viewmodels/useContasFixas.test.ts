import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useContasFixas } from './useContasFixas'
import { Gasto } from '../models/entities/Gasto'
import { Dinheiro } from '../models/entities/Dinheiro'
import { DivisaoDeGasto } from '../models/entities/DivisaoDeGasto'
import type { ContaFixa } from '../models/entities/ContaFixa'

describe('useContasFixas', () => {
  let mockContas: ContaFixa[] = []
  const mockRepo = {
    listarTodas: vi.fn().mockImplementation(async () => mockContas),
    salvar: vi.fn().mockImplementation(async (conta) => {
      const idx = mockContas.findIndex(c => c.id === conta.id)
      if (idx > -1) mockContas[idx] = conta
      else mockContas.push(conta)
    }),
    excluir: vi.fn().mockImplementation(async (id) => {
      mockContas = mockContas.filter(c => c.id !== id)
    })
  }

  const mockGastoService = {
    lancarGastoContaFixa: vi.fn(),
    lancarGastoOuEmprestimo: vi.fn(),
    excluirGasto: vi.fn(),
    registrarAcertoNetting: vi.fn(),
    removerAssociacaoContaFixa: vi.fn()
  }

  beforeEach(() => {
    localStorage.clear()
    mockContas = []
    const { resetar } = useContasFixas({
      contaFixaRepository: mockRepo,
      gastoService: mockGastoService as any
    })
    resetar()
    vi.clearAllMocks()
  })

  const esperarTick = () => new Promise(resolve => setTimeout(resolve, 0))

  it('deve carregar contas fixas padrao ao inicializar se vazio', async () => {
    const { contasFixas, carregarTemplates } = useContasFixas({
      contaFixaRepository: mockRepo,
      gastoService: mockGastoService as any
    })
    await carregarTemplates()
    expect(contasFixas.value.length).toBe(5)
    expect(contasFixas.value[0].id).toBe('aluguel')
  })

  it('deve cadastrar, atualizar e remover um template customizado', async () => {
    const { contasFixas, salvarContaFixa, excluirContaFixa, carregarTemplates } = useContasFixas({
      contaFixaRepository: mockRepo,
      gastoService: mockGastoService as any
    })
    await carregarTemplates()
    
    await salvarContaFixa({
      id: 'new_bill',
      name: 'Academia',
      icon: '💪',
      fixedValueCentavos: 10000,
      defaultSplit: ['luciana']
    })

    expect(contasFixas.value.some(c => c.id === 'new_bill')).toBe(true)

    await salvarContaFixa({
      id: 'new_bill',
      name: 'Academia VIP',
      icon: '💪',
      fixedValueCentavos: 15000,
      defaultSplit: ['luciana']
    })
    expect(contasFixas.value.find(c => c.id === 'new_bill')?.name).toBe('Academia VIP')

    await excluirContaFixa('new_bill')
    expect(contasFixas.value.some(c => c.id === 'new_bill')).toBe(false)
  })

  it('deve calcular dinamicamente o status de pagamento baseado em gastos reais', async () => {
    const { verificarStatusPaga } = useContasFixas({ contaFixaRepository: mockRepo })
    await esperarTick()
    
    const contaAluguel = {
      id: 'aluguel',
      name: 'Aluguel',
      icon: '🔑',
      fixedValueCentavos: 150000,
      defaultSplit: ['luciana', 'luan', 'joao']
    }

    // Sem gastos associados
    expect(verificarStatusPaga(contaAluguel, [])).toBeNull()

    // Com gasto associado
    const gastoAluguel = new Gasto({
      id: 'g1',
      faturaId: 'f1',
      descricao: 'Talão: Aluguel',
      valorTotal: Dinheiro.deReais(1500),
      compradorId: 'luciana',
      divisoes: [new DivisaoDeGasto('luciana', Dinheiro.deReais(1500))],
      recurringBillId: 'aluguel'
    })

    const status = verificarStatusPaga(contaAluguel, [gastoAluguel])
    expect(status).not.toBeNull()
    expect(status?.valorCentavos).toBe(150000)
    expect(status?.pagoPor).toBe('luciana')
  })

  it('deve lancar gasto de conta fixa delegando ao GastoService', async () => {
    const mockGastoService = {
      lancarGastoContaFixa: vi.fn(),
      lancarGastoOuEmprestimo: vi.fn(),
      excluirGasto: vi.fn(),
      registrarAcertoNetting: vi.fn()
    }
    const { lancarGastoContaFixa } = useContasFixas({
      contaFixaRepository: mockRepo,
      gastoService: mockGastoService as any
    })
    await esperarTick()

    const contaAluguel = {
      id: 'aluguel',
      name: 'Aluguel',
      icon: '🔑',
      fixedValueCentavos: 150000,
      defaultSplit: ['luciana', 'luan']
    }

    await lancarGastoContaFixa('f1', contaAluguel, 150000, 'luciana', ['luciana', 'luan'])

    expect(mockGastoService.lancarGastoContaFixa).toHaveBeenCalledWith({
      faturaId: 'f1',
      conta: contaAluguel,
      valorCentavos: 150000,
      compradorId: 'luciana',
      participantes: ['luciana', 'luan']
    })
  })

  it('deve chamar removerAssociacaoContaFixa do GastoService ao excluir um template de conta fixa', async () => {
    const mockGastoService = {
      lancarGastoContaFixa: vi.fn(),
      removerAssociacaoContaFixa: vi.fn()
    }
    const { excluirContaFixa } = useContasFixas({
      contaFixaRepository: mockRepo,
      gastoService: mockGastoService as any
    })
    await esperarTick()

    await excluirContaFixa('aluguel')
    expect(mockGastoService.removerAssociacaoContaFixa).toHaveBeenCalledWith('aluguel')
  })
})
