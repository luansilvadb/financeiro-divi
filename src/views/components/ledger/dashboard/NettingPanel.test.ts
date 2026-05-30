import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import NettingPanel from './NettingPanel.vue'

describe('NettingPanel', () => {
  it('permite confirmar pix mesmo quando a fatura esta marcada como fechada', async () => {
    const transferencia = { from: 'm1', to: 'm2', val: 42 }
    const wrapper = mount(NettingPanel, {
      props: {
        nettingTransferencias: [transferencia],
        faturaSelecionadaFechada: true,
        getMembroNome: vi.fn((id: string) => id === 'm1' ? 'Luan' : 'Maria')
      }
    })

    const button = wrapper.find('button')
    expect(button.attributes('disabled')).toBeUndefined()
    expect(button.attributes('aria-disabled')).toBeUndefined()
    expect(wrapper.text()).not.toContain('Reabra o mês')

    await button.trigger('click')

    expect(wrapper.emitted('abrirNetting')?.[0]).toEqual([transferencia])
  })
})
