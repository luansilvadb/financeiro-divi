import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import BottomSheetConfigurarContaFixa from './BottomSheetConfigurarContaFixa.vue'
import type { ContaFixa } from '../../../models/entities/ContaFixa'

const bill: ContaFixa = {
  id: 'energia',
  name: 'Energia',
  icon: '💡',
  fixedValueCentavos: 12000,
  defaultSplit: ['luan', 'maria'],
}

// Apenas moradores ativos passados para a prop membros
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
    // Conta com defaultSplit contendo um ID inativo ('joao')
    const billWithInactive: ContaFixa = {
      ...bill,
      defaultSplit: ['luan', 'joao']
    }

    const wrapper = mount(BottomSheetConfigurarContaFixa, {
      props: {
        visible: true,
        bill: billWithInactive,
        membros: membrosAtivos,
      },
      global: { stubs: { Teleport: true } }
    })

    // Busca o botão com texto "Salvar" especificamente
    const saveButton = wrapper.findAll('button').find(btn => btn.text().includes('Salvar'))
    await saveButton?.trigger('click')

    const saveEvents = wrapper.emitted('save')
    expect(saveEvents).toBeTruthy()
    expect(saveEvents?.[0][0]).toEqual({
      id: 'energia',
      name: 'Energia',
      icon: '💡',
      fixedValueCentavos: 12000,
      defaultSplit: ['luan'] // 'joao' foi removido porque não está na prop membros
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

    // No estado inicial, a tela de seleção de ícone não deve estar ativa
    expect(wrapper.text()).not.toContain('Selecione o Ícone')

    // Encontra o botão/card clicável para alterar o emoji
    const cardAlterarEmoji = wrapper.find('button[class*="text-left group cursor-pointer"]')
    expect(cardAlterarEmoji.exists()).toBe(true)
    await cardAlterarEmoji.trigger('click')

    // Deve estar na tela de seleção de ícone agora
    expect(wrapper.text()).toContain('Selecione o Ícone')
    expect(wrapper.text()).toContain('Coleção de Ícones')

    // Encontra o botão do emoji "💰" na grade e clica nele
    const emojiButtons = wrapper.findAll('button').filter(btn => btn.text() === '💰')
    expect(emojiButtons.length).toBeGreaterThan(0)
    await emojiButtons[0].trigger('click')

    // Clicar em um emoji da grade deve setá-lo e voltar para a tela principal
    expect(wrapper.text()).not.toContain('Selecione o Ícone')
    
    // O card de emoji deve refletir o emoji novo selecionado
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

    // Entra na tela de seleção de ícone
    const cardAlterarEmoji = wrapper.find('button[class*="text-left group cursor-pointer"]')
    await cardAlterarEmoji.trigger('click')

    // Clica para expandir a opção de emoji personalizado
    const customOptionButton = wrapper.findAll('button').find(btn => btn.text().includes('Emoji Personalizado'))
    expect(customOptionButton?.exists()).toBe(true)
    await customOptionButton?.trigger('click')

    // Deve renderizar o campo de texto
    const customInput = wrapper.find('input[placeholder="Cole ou digite um emoji..."]')
    expect(customInput.exists()).toBe(true)

    // Insere o emoji personalizado "🚀"
    await customInput.setValue('🚀')

    // Clica em confirmar
    const confirmButton = wrapper.findAll('button').find(btn => btn.text().includes('Confirmar'))
    expect(confirmButton?.exists()).toBe(true)
    await confirmButton?.trigger('click')

    // Deve retornar para a tela do formulário e ter atualizado o emoji para "🚀"
    expect(wrapper.text()).not.toContain('Selecione o Ícone')
    expect(wrapper.text()).toContain('🚀')
  })
})


