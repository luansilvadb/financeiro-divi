import { describe, it, expect, beforeEach } from 'vitest'
import { useContasFixas } from './useContasFixas'
import { Gasto } from '../core/domain/Gasto'
import { Dinheiro } from '../../../shared/primitives/Dinheiro'
import { DivisaoDeGasto } from '../core/domain/DivisaoDeGasto'

describe('useContasFixas', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('deve carregar contas fixas padrao ao inicializar', () => {
    const { contasFixas } = useContasFixas()
    expect(contasFixas.value.length).toBe(5)
    expect(contasFixas.value[0].id).toBe('aluguel')
  })

  it('deve cadastrar, atualizar e remover um template customizado', () => {
    const { contasFixas, salvarContaFixa, excluirContaFixa } = useContasFixas()
    
    salvarContaFixa({
      id: 'new_bill',
      name: 'Academia',
      icon: '💪',
      fixedValue: 100,
      defaultSplit: ['luciana']
    })

    expect(contasFixas.value.some(c => c.id === 'new_bill')).toBe(true)

    salvarContaFixa({
      id: 'new_bill',
      name: 'Academia VIP',
      icon: '💪',
      fixedValue: 150,
      defaultSplit: ['luciana']
    })
    expect(contasFixas.value.find(c => c.id === 'new_bill')?.name).toBe('Academia VIP')

    excluirContaFixa('new_bill')
    expect(contasFixas.value.some(c => c.id === 'new_bill')).toBe(false)
  })

  it('deve calcular dinamicamente o status de pagamento baseado em gastos reais', () => {
    const { verificarStatusPaga } = useContasFixas()
    
    const contaAluguel = {
      id: 'aluguel',
      name: 'Aluguel',
      icon: '🔑',
      fixedValue: 1500,
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
    expect(status?.valorReal).toBe(1500)
    expect(status?.pagoPor).toBe('luciana')
  })
})
