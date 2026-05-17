import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import NovoLancamentoWizard from './NovoLancamentoWizard.vue'

describe('NovoLancamentoWizard - Sênior v18', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const membros = [
    { id: 'm1', nome: 'Luan' },
    { id: 'm2', nome: 'Maria' }
  ]

  it('deve iniciar no Passo 1/5 perguntando como foi feito o lançamento', () => {
    const wrapper = mount(NovoLancamentoWizard, {
      props: { membros }
    })
    expect(wrapper.text()).toContain('Passo 1/5')
    expect(wrapper.text()).toContain('Como você pagou ou fez o lançamento?')
  })

  it('deve avançar para o Passo 2 ao clicar em PIX', async () => {
    const wrapper = mount(NovoLancamentoWizard, {
      props: { membros }
    })
    
    // Localiza e clica no botão PIX
    const buttons = wrapper.findAll('button')
    const pixButton = buttons.find(b => b.text().includes('PIX'))
    expect(pixButton).toBeDefined()
    
    await pixButton!.trigger('click')
    
    expect(wrapper.text()).toContain('Passo 2/5')
    expect(wrapper.text()).toContain('Quem foi a pessoa que pagou?')
  })
})
