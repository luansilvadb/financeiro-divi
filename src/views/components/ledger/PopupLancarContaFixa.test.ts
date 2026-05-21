import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import PopupLancarContaFixa from './PopupLancarContaFixa.vue'
import type { ContaFixa } from '../../../models/entities/ContaFixa'

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
      global: { stubs: { Teleport: true } }
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
      global: { stubs: { Teleport: true } }
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

  it('seleciona apenas os IDs compatíveis do template quando existem na casa', async () => {
    const billWithMixedIds: ContaFixa = {
      ...bill,
      defaultSplit: ['luan', 'id-inexistente']
    }
    
    const wrapper = mount(PopupLancarContaFixa, {
      props: {
        visible: true,
        bill: billWithMixedIds,
        membros,
      },
      global: { stubs: { Teleport: true } }
    })

    const splitLuan = wrapper.find('[data-testid="split-luan"]')
    const splitMaria = wrapper.find('[data-testid="split-maria"]')
    
    expect(splitLuan.classes()).toContain('bg-white') // Selecionado
    expect(splitMaria.classes()).not.toContain('bg-white') // Não selecionado
  })

  it('seleciona TODOS os moradores se nenhum ID do template for encontrado na casa', async () => {
    const billWithInvalidIds: ContaFixa = {
      ...bill,
      defaultSplit: ['id-1', 'id-2']
    }
    
    const wrapper = mount(PopupLancarContaFixa, {
      props: {
        visible: true,
        bill: billWithInvalidIds,
        membros,
      },
      global: { stubs: { Teleport: true } }
    })

    const splitLuan = wrapper.find('[data-testid="split-luan"]')
    const splitMaria = wrapper.find('[data-testid="split-maria"]')
    const splitJoao = wrapper.find('[data-testid="split-joao"]')
    
    expect(splitLuan.classes()).toContain('bg-white')
    expect(splitMaria.classes()).toContain('bg-white')
    expect(splitJoao.classes()).toContain('bg-white')
  })
})
