import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useContasFixas } from './useContasFixas'
import { Gasto } from '../models/entities/Gasto'
import { Dinheiro } from '../models/entities/Dinheiro'
import { DivisaoDeGasto } from '../models/entities/DivisaoDeGasto'

describe('useContasFixas', () => {
  beforeEach(() => {
    localStorage.clear()
    const { resetar } = useContasFixas()
    resetar()
  })

  const esperarTick = () => new Promise(resolve => setTimeout(resolve, 0))

  it('deve carregar contas fixas padrao ao inicializar', async () => {
    const { contasFixas, carregarTemplates } = useContasFixas()
    await carregarTemplates()
    expect(contasFixas.value.length).toBe(5)
    expect(contasFixas.value[0].id).toBe('aluguel')
  })

  it('deve cadastrar, atualizar e remover um template customizado', async () => {
    const { contasFixas, salvarContaFixa, excluirContaFixa, carregarTemplates } = useContasFixas()
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
    const { verificarStatusPaga } = useContasFixas()
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
    const { lancarGastoContaFixa } = useContasFixas({ gastoService: mockGastoService as any })
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
    const { excluirContaFixa } = useContasFixas({ gastoService: mockGastoService as any })
    await esperarTick()

    await excluirContaFixa('aluguel')
    expect(mockGastoService.removerAssociacaoContaFixa).toHaveBeenCalledWith('aluguel')
  })
})
