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
        isMonthLocked: false,
      },
    })

    // 1. Simula tap rápido no card da conta energia (não paga) -> deve emitir 'lancar'
    const cardEnergia = wrapper.find('[data-testid="conta-fixa-card-energia"]')
    await cardEnergia.trigger('pointerdown')
    await cardEnergia.trigger('pointerup')
    // Avança o tempo para completar a animação do tap rápido (300ms)
    await vi.advanceTimersByTimeAsync(300)

    // 2. Simula tap rápido no card da conta aluguel (já paga) -> deve emitir 'estornar'
    const cardAluguel = wrapper.find('[data-testid="conta-fixa-card-aluguel"]')
    await cardAluguel.trigger('pointerdown')
    await cardAluguel.trigger('pointerup')
    // Avança o tempo para completar o tap rápido (300ms)
    await vi.advanceTimersByTimeAsync(300)

    // 3. Simula long press no card da conta aluguel -> deve emitir 'configurar'
    await cardAluguel.trigger('pointerdown')
    // Avança o tempo simulado para acionar o long press (1000ms)
    await vi.advanceTimersByTimeAsync(1000)

    // 4. Clica no botão de adicionar nova conta
    await wrapper.find('[data-testid="nova-conta-fixa"]').trigger('click')

    expect(wrapper.emitted('lancar')?.[0]).toEqual([contasFixas[1]])
    expect(wrapper.emitted('estornar')?.[0]).toEqual([contasFixas[0]])
    expect(wrapper.emitted('configurar')?.[0]).toEqual([contasFixas[0]])
    expect(wrapper.emitted('novo')).toHaveLength(1)

    vi.useRealTimers()
  })
})
