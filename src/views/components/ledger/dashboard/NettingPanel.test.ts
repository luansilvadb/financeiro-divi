import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import NettingPanel from './NettingPanel.vue'

describe('NettingPanel', () => {
  it('renderiza lista de transferencias e permite abrir o modal de registro', async () => {
    const transferencia = { from: 'm1', to: 'm2', val: 42 }
    const wrapper = mount(NettingPanel, {
      props: {
        nettingTransferencias: [transferencia],
        faturaSelecionadaFechada: false,
        getMembroNome: vi.fn((id: string) => id === 'm1' ? 'Luan' : 'Maria')
      }
    })
    expect(wrapper.text()).toContain('Luan')
    expect(wrapper.text()).toContain('Maria')
    expect(wrapper.text()).toContain('42,00')

    const button = wrapper.find('button')
    expect(button.exists()).toBe(true)
    await button.trigger('click')
    
    expect(wrapper.emitted('abrirNetting')).toBeTruthy()
  })
})
