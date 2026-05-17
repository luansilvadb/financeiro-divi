import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import NovoLancamentoWizard from './NovoLancamentoWizard.vue'

describe('NovoLancamentoWizard - Fluxo de Cartão', () => {
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

  it('deve ter 3 passos totais e começar no passo 1 selecionando cartão', () => {
    const wrapper = mount(NovoLancamentoWizard, {
      props: { membros }
    })
    expect(wrapper.text()).toContain('Passo 1 de 3')
    expect(wrapper.text()).toContain('Escolha o cartão')
  })

  it('deve avançar do passo 1 para o 2 ao selecionar um cartão', async () => {
    const wrapper = mount(NovoLancamentoWizard, {
      props: { membros }
    })
    const cards = wrapper.findAll('button')
    await cards[0].trigger('click')
    
    expect(wrapper.text()).toContain('Passo 2 de 3')
    expect(wrapper.text()).toContain('Qual o valor')
  })
})
