import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ContasFixasPanel from './ContasFixasPanel.vue'
import type { ContaFixa } from '../../../models/entities/ContaFixa'
import { Gasto } from '../../../models/entities/Gasto'
import { DivisaoDeGasto } from '../../../models/entities/DivisaoDeGasto'
import { Dinheiro } from '../../../models/entities/Dinheiro'

const contasFixas: ContaFixa[] = [
  {
    id: 'aluguel',
    name: 'Aluguel',
    icon: '🏠',
    fixedValueCentavos: 120000,
    defaultSplit: ['luan', 'maria'],
  },
  {
    id: 'energia',
    name: 'Energia',
    icon: '💡',
    fixedValueCentavos: null,
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
        isMonthClosed: false,
      },
    })

    expect(wrapper.classes()).not.toContain('glass-card')
    expect(wrapper.text()).toContain('Contas Fixas')
    expect(wrapper.text()).toContain('Recorrentes do mês')
    expect(wrapper.text()).not.toContain('Lancamentos recorrentes do mês')
    expect(wrapper.text()).toContain('Aluguel')
    expect(wrapper.text()).toContain('R$ 1200,00 por Luan')
    expect(wrapper.text()).toContain('Energia')
    expect(wrapper.text()).not.toContain('Aguardando talão')
  })

  it('mantem os eventos de lancar, estornar, configurar e novo', async () => {
    vi.useFakeTimers()

    const wrapper = mount(ContasFixasPanel, {
      props: {
        contasFixas,
        gastos,
        membros,
        isMonthClosed: false,
      },
    })

    const cardEnergia = wrapper.find('[data-testid="conta-fixa-card-energia"]')
    await cardEnergia.trigger('pointerdown')
    await cardEnergia.trigger('pointerup')
    await vi.advanceTimersByTimeAsync(300)

    const cardAluguel = wrapper.find('[data-testid="conta-fixa-card-aluguel"]')
    await cardAluguel.trigger('pointerdown')
    await cardAluguel.trigger('pointerup')
    await vi.advanceTimersByTimeAsync(300)

    await cardAluguel.trigger('pointerdown')
    await vi.advanceTimersByTimeAsync(1000)

    await wrapper.find('[data-testid="nova-conta-fixa"]').trigger('click')

    expect(wrapper.emitted('lancar')?.[0]).toEqual([contasFixas[1]])
    expect(wrapper.emitted('estornar')?.[0]).toEqual([contasFixas[0]])
    expect(wrapper.emitted('configurar')?.[0]).toEqual([contasFixas[0]])
    expect(wrapper.emitted('novo')).toHaveLength(1)

    vi.useRealTimers()
  })

  it('mantem eventos de contas fixas disponiveis quando o periodo esta fechado', async () => {
    vi.useFakeTimers()

    const wrapper = mount(ContasFixasPanel, {
      props: {
        contasFixas,
        gastos,
        membros,
        isMonthClosed: true,
      },
    })

    const cardEnergia = wrapper.find('[data-testid="conta-fixa-card-energia"]')
    await cardEnergia.trigger('pointerdown')
    await cardEnergia.trigger('pointerup')
    await vi.advanceTimersByTimeAsync(300)

    await wrapper.find('[data-testid="nova-conta-fixa"]').trigger('click')

    expect(wrapper.emitted('lancar')?.[0]).toEqual([contasFixas[1]])
    expect(wrapper.emitted('novo')).toHaveLength(1)
    expect(wrapper.text()).not.toContain('Reabra o mês')

    vi.useRealTimers()
  })
})
