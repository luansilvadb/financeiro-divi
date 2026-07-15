import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import BottomSheetConfigurarContaFixa from './BottomSheetConfigurarContaFixa.vue'
import type { ContaFixa } from '../../../models/entities/ContaFixa'

const bill: ContaFixa = {
  id: 'energia',
  name: 'Energia',
  icon: '💡',
  fixedValueCentavos: 12000,
  defaultSplit: [{ membroId: 'luan', valorCentavos: 0 }, { membroId: 'maria', valorCentavos: 0 }],
}

const membrosAtivos = [
  { id: 'luan', nome: 'Luan' },
  { id: 'maria', nome: 'Maria' },
]

describe('BottomSheetConfigurarContaFixa', () => {
  it('renderiza os moradores ativos e o status de seleção padrão', () => {
    const wrapper = mount(BottomSheetConfigurarContaFixa, {
      props: {
        visible: true,
        bill,
        membros: membrosAtivos,
      },
      global: { stubs: { Teleport: true } }
    })

    expect(wrapper.text()).toContain('Configurar Conta Fixa')
    expect(wrapper.text()).toContain('Luan')
    expect(wrapper.text()).toContain('Maria')
  })

  it('filtra moradores inativos (inexistentes na prop membros) do defaultSplit ao carregar a conta', async () => {
    const billWithInactive: ContaFixa = {
      ...bill,
      defaultSplit: [{ membroId: 'luan', valorCentavos: 0 }, { membroId: 'joao', valorCentavos: 0 }]
    }

    const wrapper = mount(BottomSheetConfigurarContaFixa, {
      props: {
        visible: true,
        bill: billWithInactive,
        membros: membrosAtivos,
      },
      global: { stubs: { Teleport: true } }
    })

    const saveButton = wrapper.findAll('button').find(btn => btn.text().includes('Salvar'))
    await saveButton?.trigger('click')

    const saveEvents = wrapper.emitted('save')
    expect(saveEvents).toBeTruthy()
    expect(saveEvents?.[0][0]).toEqual({
      id: 'energia',
      name: 'Energia',
      icon: '💡',
      fixedValueCentavos: 12000,
      defaultSplit: [{ membroId: 'luan', valorCentavos: 0 }] // 'joao' foi removido porque não está na prop membros
    })
  })

  it('abre a tela de seleção de ícone ao clicar no card de emoji representativo e permite selecionar um novo emoji', async () => {
    const wrapper = mount(BottomSheetConfigurarContaFixa, {
      props: {
        visible: true,
        bill,
        membros: membrosAtivos,
      },
      global: { stubs: { Teleport: true } }
    })

    expect(wrapper.text()).not.toContain('Selecione o Ícone')

    const cardAlterarEmoji = wrapper.find('button[class*="text-left group cursor-pointer"]')
    expect(cardAlterarEmoji.exists()).toBe(true)
    await cardAlterarEmoji.trigger('click')

    expect(wrapper.text()).toContain('Selecione o Ícone')
    expect(wrapper.text()).toContain('Coleção de Ícones')

    const emojiButtons = wrapper.findAll('button').filter(btn => btn.text() === '💰')
    expect(emojiButtons.length).toBeGreaterThan(0)
    await emojiButtons[0].trigger('click')

    expect(wrapper.text()).not.toContain('Selecione o Ícone')
    
    expect(wrapper.text()).toContain('💰')
  })

  it('permite inserir um emoji personalizado e confirmá-lo', async () => {
    const wrapper = mount(BottomSheetConfigurarContaFixa, {
      props: {
        visible: true,
        bill,
        membros: membrosAtivos,
      },
      global: { stubs: { Teleport: true } }
    })

    const cardAlterarEmoji = wrapper.find('button[class*="text-left group cursor-pointer"]')
    await cardAlterarEmoji.trigger('click')

    const customOptionButton = wrapper.findAll('button').find(btn => btn.text().includes('Emoji Personalizado'))
    expect(customOptionButton?.exists()).toBe(true)
    await customOptionButton?.trigger('click')

    const customInput = wrapper.find('input[placeholder="Cole ou digite um emoji..."]')
    expect(customInput.exists()).toBe(true)

    await customInput.setValue('🚀')

    const confirmButton = wrapper.findAll('button').find(btn => btn.text().includes('Confirmar'))
    expect(confirmButton?.exists()).toBe(true)
    await confirmButton?.trigger('click')

    expect(wrapper.text()).not.toContain('Selecione o Ícone')
    expect(wrapper.text()).toContain('🚀')
  })
})


