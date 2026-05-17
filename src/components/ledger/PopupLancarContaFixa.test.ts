import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import PopupLancarContaFixa from './PopupLancarContaFixa.vue'
import type { ContaFixa } from '../../modules/ledger/core/domain/ContaFixa'

const bill: ContaFixa = {
  id: 'energia',
  name: 'Energia',
  icon: 'kW',
  fixedValue: null,
  defaultSplit: ['luan', 'maria'],
}

const membros = [
  { id: 'luan', nome: 'Luan' },
  { id: 'maria', nome: 'Maria' },
  { id: 'joao', nome: 'Joao' },
]

describe('PopupLancarContaFixa', () => {
  it('renderiza a UI compacta seguindo o design system Family', () => {
    const wrapper = mount(PopupLancarContaFixa, {
      props: {
        visible: true,
        bill,
        membros,
      },
    })

    expect(wrapper.text()).toContain('Lancar Energia')
    expect(wrapper.text()).toContain('Valor do talao')
    expect(wrapper.text()).toContain('Quem pagou?')
    expect(wrapper.text()).toContain('Dividir com quem?')
    expect(wrapper.text()).toContain('Resumo da divisao')
    expect(wrapper.text()).toContain('Lancar conta')
  })

  it('mantem o evento confirm com valor, comprador e divisao', async () => {
    const wrapper = mount(PopupLancarContaFixa, {
      props: {
        visible: true,
        bill,
        membros,
      },
    })

    await wrapper.find('[data-testid="valor-conta-fixa"]').setValue(300)
    await wrapper.find('[data-testid="pagador-maria"]').trigger('click')
    await wrapper.find('[data-testid="split-joao"]').trigger('click')
    await wrapper.find('[data-testid="confirmar-conta-fixa"]').trigger('click')

    expect(wrapper.emitted('confirm')?.[0]).toEqual([
      {
        valorReal: 300,
        compradorId: 'maria',
        splitIds: ['luan', 'maria', 'joao'],
      },
    ])
  })
})
