import { mount } from '@vue/test-utils'
import { nextTick, ref } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import NovoLancamentoWizard from './NovoLancamentoWizard.vue'

const mocks = vi.hoisted(() => ({ salvar: vi.fn(), toast: vi.fn() }))

vi.mock('../../shared/container', () => ({
  gastoService: { lancarGastoOuEmprestimo: mocks.salvar },
}))

vi.mock('../../viewmodels/useCartoesEFaturas', () => ({
  useCartoesEFaturas: () => ({
    cartoes: ref([]),
    faturasFechadas: ref([]),
    inicializar: vi.fn(),
  }),
}))

vi.mock('../../composables/useToast', () => ({
  useToast: () => ({ show: mocks.toast }),
}))

const componentStub = (name: string) => ({ name, template: '<div />' })

describe('NovoLancamentoWizard', () => {
  it('não permite confirmar rateio proporcional com renda ausente', async () => {
    const wrapper = mount(NovoLancamentoWizard, {
      props: {
        membros: [
          { id: 'm1', nome: 'Ana', rendaCentavos: 500000 },
          { id: 'm2', nome: 'Bruno' },
        ],
      },
      global: {
        stubs: {
          StepFlowSelection: componentStub('StepFlowSelection'),
          StepMemberSelection: componentStub('StepMemberSelection'),
          StepValueInput: componentStub('StepValueInput'),
          StepDescriptionInput: componentStub('StepDescriptionInput'),
          StepSplitSelector: componentStub('StepSplitSelector'),
          Button: { props: ['disabled'], template: '<button :disabled="disabled"><slot /></button>' },
        },
      },
    })

    wrapper.getComponent({ name: 'StepFlowSelection' }).vm.$emit('select', {
      flow: 'expense', payment: 'pix', cardOwner: null,
    })
    await nextTick()
    wrapper.getComponent({ name: 'StepMemberSelection' }).vm.$emit('select', 'm1')
    await nextTick()
    wrapper.getComponent({ name: 'StepValueInput' }).vm.$emit('update:valor', 100)
    await nextTick()
    await wrapper.findAll('button').at(-1)!.trigger('click')
    wrapper.getComponent({ name: 'StepDescriptionInput' }).vm.$emit('update:descricao', 'Mercado')
    await nextTick()
    await wrapper.findAll('button').at(-1)!.trigger('click')
    wrapper.getComponent({ name: 'StepSplitSelector' }).vm.$emit('update:splitType', 'proportional')
    await nextTick()

    expect(wrapper.findAll('button').at(-1)!.attributes('disabled')).toBeDefined()
    expect(mocks.salvar).not.toHaveBeenCalled()
  })
})
