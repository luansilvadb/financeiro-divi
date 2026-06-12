import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import StepSplitSelector from './StepSplitSelector.vue'

describe('StepSplitSelector', () => {
  it('expõe o bloqueio quando um participante não possui renda válida', () => {
    const wrapper = mount(StepSplitSelector, {
      props: {
        membros: [
          { id: 'm1', nome: 'Ana', rendaCentavos: 500000 },
          { id: 'm2', nome: 'Bruno' },
        ],
        participantesDivisao: ['m1', 'm2'],
        compradorSelecionadoId: 'm1',
        splitType: 'proportional',
        valorTotal: 100,
      },
      global: { stubs: { MembroAvatar: true } },
    })

    expect(wrapper.get('[role="alert"]').text()).toContain('Bruno')
    expect(wrapper.text()).not.toContain('100%')
  })

  it('calcula proporções somente com rendas positivas informadas', () => {
    const wrapper = mount(StepSplitSelector, {
      props: {
        membros: [
          { id: 'm1', nome: 'Ana', rendaCentavos: 300000 },
          { id: 'm2', nome: 'Bruno', rendaCentavos: 100000 },
        ],
        participantesDivisao: ['m1', 'm2'],
        compradorSelecionadoId: 'm1',
        splitType: 'proportional',
        valorTotal: 100,
      },
      global: { stubs: { MembroAvatar: true } },
    })

    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('75%')
    expect(wrapper.text()).toContain('25%')
  })
})
