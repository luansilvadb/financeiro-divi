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

  it('deve ter 4 passos totais e começar no passo 1 selecionando tipo de ação', () => {
    const wrapper = mount(NovoLancamentoWizard, {
      props: { membros }
    })
    expect(wrapper.text()).toContain('Passo 1 de 4')
    expect(wrapper.text()).toContain('O que você quer fazer?')
  })

  it('deve avançar do passo 1 para o 2 ao selecionar gasto', async () => {
    const wrapper = mount(NovoLancamentoWizard, {
      props: { membros }
    })
    const choices = wrapper.findAll('button')
    // O primeiro botão é "Novo Gasto no Cartão"
    await choices[0].trigger('click')
    
    expect(wrapper.text()).toContain('Passo 2 de 4')
    expect(wrapper.text()).toContain('Escolha o cartão')
  })
})
