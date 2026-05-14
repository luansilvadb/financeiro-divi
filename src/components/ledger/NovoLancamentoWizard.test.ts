import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import NovoLancamentoWizard from './NovoLancamentoWizard.vue'

describe('NovoLancamentoWizard', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('deve ter 3 passos totais e começar no passo 1', () => {
    const wrapper = mount(NovoLancamentoWizard)
    expect(wrapper.text()).toContain('Passo 1 de 3')
  })

  it('deve exibir a barra de progresso com a largura correta', () => {
    const wrapper = mount(NovoLancamentoWizard)
    const progressBar = wrapper.find('.bg-blue-500')
    
    expect(progressBar.exists()).toBe(true)
    const style = progressBar.attributes('style')
    expect(style).toContain('width: 33.33')
  })

  it('deve avançar do passo 1 para o 2 ao clicar em Gasto', async () => {
    const wrapper = mount(NovoLancamentoWizard)
    const btnGasto = wrapper.findAll('button').find(b => b.text().includes('Um gasto'))
    await btnGasto?.trigger('click')
    
    vi.advanceTimersByTime(200)
    await wrapper.vm.$nextTick()
    
    expect(wrapper.text()).toContain('Passo 2 de 3')
  })

  it('deve desabilitar o botão próximo no passo 2 se valor ou descrição estiverem vazios', async () => {
    const wrapper = mount(NovoLancamentoWizard)
    // Ir para passo 2
    const btnGasto = wrapper.findAll('button').find(b => b.text().includes('Um gasto'))
    await btnGasto?.trigger('click')
    vi.advanceTimersByTime(200)
    await wrapper.vm.$nextTick()
    
    const nextBtn = wrapper.find('button.bg-blue-600')
    expect(nextBtn.attributes('disabled')).toBeDefined()
    
    await wrapper.find('input[type="number"]').setValue(100)
    expect(nextBtn.attributes('disabled')).toBeDefined()
    
    await wrapper.find('input[type="text"]').setValue('Almoço')
    expect(nextBtn.attributes('disabled')).toBeUndefined()
  })

  it('deve dar foco automático no input de valor ao entrar no passo 2', async () => {
    // Para testar foco no jsdom, precisamos anexar ao document
    const wrapper = mount(NovoLancamentoWizard, {
      attachTo: document.body
    })
    
    // Passo 1 -> Passo 2
    const btnGasto = wrapper.findAll('button').find(b => b.text().includes('Um gasto'))
    await btnGasto?.trigger('click')
    
    vi.advanceTimersByTime(200) // Próximo passo após clique (selecionarTipo)
    await wrapper.vm.$nextTick()
    
    vi.advanceTimersByTime(400) // Aguarda o watch(step) focus timeout
    await wrapper.vm.$nextTick()
    
    const input = wrapper.find('input[type="number"]').element as HTMLInputElement
    expect(document.activeElement).toBe(input)
    
    wrapper.unmount()
  })

  it('deve emitir o evento salvar com a transação correta ao finalizar', async () => {
    const wrapper = mount(NovoLancamentoWizard)
    
    // Passo 1 -> Passo 2
    await wrapper.findAll('button').find(b => b.text().includes('Um gasto'))?.trigger('click')
    vi.advanceTimersByTime(200)
    await wrapper.vm.$nextTick()
    
    // Passo 2 -> Passo 3
    await wrapper.find('input[type="number"]').setValue(100)
    await wrapper.find('input[type="text"]').setValue('Almoço')
    await wrapper.find('button.bg-blue-600').trigger('click')
    
    // Passo 3 -> Finalizar
    await wrapper.find('button.bg-green-600').trigger('click')
    
    expect(wrapper.emitted('salvar')).toBeTruthy()
    const transacao: any = wrapper.emitted('salvar')![0][0]
    expect(transacao.descricao).toBe('Almoço')
    expect(transacao.total.centavos).toBe(10000)
    expect(transacao.divisoes).toHaveLength(1)
    expect(transacao.divisoes[0].beneficiario_id).toBe('eu')
  })

  it('deve permitir selecionar múltiplos beneficiários e calcular a divisão', async () => {
    const wrapper = mount(NovoLancamentoWizard)
    
    // Passo 1 -> Passo 2 (Gasto)
    await wrapper.findAll('button').find(b => b.text().includes('Um gasto'))?.trigger('click')
    vi.advanceTimersByTime(200)
    await wrapper.vm.$nextTick()
    
    // Passo 2 -> Passo 3 (Valor: 120, Descrição: Pizza)
    await wrapper.find('input[type="number"]').setValue(120)
    await wrapper.find('input[type="text"]').setValue('Pizza')
    await wrapper.find('button.bg-blue-600').trigger('click')
    
    // Passo 3: Inicialmente apenas 'eu' (Luan)
    expect(wrapper.text()).toContain('R$ 120,00') // Total
    expect(wrapper.text()).toContain('R$ 120,00') // Para cada um (1 pessoa)
    
    // Selecionar Maria (segundo membro)
    // Os membros são: { id: 'eu', nome: 'Luan (Você)' }, { id: 'maria', nome: 'Maria' }, ...
    const avatars = wrapper.findAll('.w-16.h-16')
    await avatars[1].trigger('click') // Clica na Maria
    
    expect(wrapper.text()).toContain('R$ 60,00') // Para cada um (2 pessoas)
    
    // Clicar em "Marcar todos"
    await wrapper.find('button.text-green-600').trigger('click')
    expect(wrapper.text()).toContain('R$ 30,00') // Para cada um (4 pessoas)
    
    // Finalizar
    await wrapper.find('button.bg-green-600').trigger('click')
    
    expect(wrapper.emitted('salvar')).toBeTruthy()
    const transacao: any = wrapper.emitted('salvar')![0][0]
    expect(transacao.divisoes).toHaveLength(4)
    expect(transacao.divisoes.every((d: any) => d.valor.centavos === 3000)).toBe(true)
  })
})
