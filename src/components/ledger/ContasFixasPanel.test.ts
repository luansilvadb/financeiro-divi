import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import ContasFixasPanel from './ContasFixasPanel.vue'
import type { ContaFixa } from '../../modules/ledger/core/domain/ContaFixa'
import { Gasto } from '../../modules/ledger/core/domain/Gasto'
import { DivisaoDeGasto } from '../../modules/ledger/core/domain/DivisaoDeGasto'
import { Dinheiro } from '../../shared/primitives/Dinheiro'

const contasFixas: ContaFixa[] = [
  {
    id: 'aluguel',
    name: 'Aluguel',
    icon: '🏠',
    fixedValue: 1200,
    defaultSplit: ['luan', 'maria'],
  },
  {
    id: 'energia',
    name: 'Energia',
    icon: '💡',
    fixedValue: null,
    defaultSplit: ['luan', 'maria'],
  },
]

const gastos = [
  new Gasto({
    id: 'gasto-aluguel',
    faturaId: 'fatura-aberta',
    descricao: 'Aluguel',
    valorTotal: Dinheiro.deReais(1200),
    compradorId: 'luan',
    recurringBillId: 'aluguel',
    divisoes: [
      new DivisaoDeGasto('luan', Dinheiro.deReais(600)),
      new DivisaoDeGasto('maria', Dinheiro.deReais(600)),
    ],
  }),
]

const membros = [
  { id: 'luan', nome: 'Luan' },
  { id: 'maria', nome: 'Maria' },
]

describe('ContasFixasPanel', () => {
  it('renderiza o card utilitario seguindo o design system Family', () => {
    const wrapper = mount(ContasFixasPanel, {
      props: {
        contasFixas,
        gastos,
        membros,
        isMonthLocked: false,
      },
    })

    expect(wrapper.classes()).toContain('contas-fixas-card')
    expect(wrapper.classes()).not.toContain('glass-card')
    expect(wrapper.text()).toContain('Contas fixas')
    expect(wrapper.text()).toContain('Recorrentes do mes.')
    expect(wrapper.text()).not.toContain('Lancamentos recorrentes do mes.')
    expect(wrapper.text()).toContain('1/2 pagas')
    expect(wrapper.text()).toContain('Aluguel')
    expect(wrapper.text()).toContain('R$ 1200,00 por Luan')
    expect(wrapper.text()).toContain('Energia')
    expect(wrapper.text()).toContain('Aguardando talao')
    expect(wrapper.find('[data-testid="configurar-conta-aluguel"]').attributes('aria-label')).toBe('Configurar Aluguel')
  })

  it('mantem os eventos de lancar, configurar e novo', async () => {
    const wrapper = mount(ContasFixasPanel, {
      props: {
        contasFixas,
        gastos,
        membros,
        isMonthLocked: false,
      },
    })

    await wrapper.find('[data-testid="lancar-conta-energia"]').trigger('click')
    await wrapper.find('[data-testid="configurar-conta-aluguel"]').trigger('click')
    await wrapper.find('[data-testid="nova-conta-fixa"]').trigger('click')

    expect(wrapper.emitted('lancar')?.[0]).toEqual([contasFixas[1]])
    expect(wrapper.emitted('configurar')?.[0]).toEqual([contasFixas[0]])
    expect(wrapper.emitted('novo')).toHaveLength(1)
  })
})
