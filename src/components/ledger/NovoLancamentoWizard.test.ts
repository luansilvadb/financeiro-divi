import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import NovoLancamentoWizard from './NovoLancamentoWizard.vue'

describe('NovoLancamentoWizard', () => {
  it('deve ter 3 passos totais e começar no passo 1', () => {
    const wrapper = mount(NovoLancamentoWizard)
    
    // O texto auxiliar deve indicar Passo 1 de 3
    // Atualmente deve falhar pois não existe esse texto ou o total é diferente
    expect(wrapper.text()).toContain('Passo 1 de 3')
  })

  it('deve exibir a barra de progresso com a largura correta', () => {
    const wrapper = mount(NovoLancamentoWizard)
    const progressBar = wrapper.find('.bg-blue-500')
    
    expect(progressBar.exists()).toBe(true)
    // No passo 1 de 3, deve ser aproximadamente 33.33%
    const style = progressBar.attributes('style')
    expect(style).toContain('width: 33.33')
    expect(style).toContain('%')
  })

  it('deve ter um rodapé fixo com botões de navegação', () => {
    const wrapper = mount(NovoLancamentoWizard)
    const footer = wrapper.find('.fixed.bottom-0')
    
    expect(footer.exists()).toBe(true)
  })
})
