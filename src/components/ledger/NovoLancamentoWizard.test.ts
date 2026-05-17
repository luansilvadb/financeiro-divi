import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import NovoLancamentoWizard from './NovoLancamentoWizard.vue'

describe('NovoLancamentoWizard - Senior v18', () => {
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

  const semAcentos = (text: string) => text.normalize('NFD').replace(/\p{Diacritic}/gu, '')

  it('inicia no Passo 1 perguntando como foi feito o lancamento', () => {
    const wrapper = mount(NovoLancamentoWizard, {
      props: { membros }
    })

    expect(semAcentos(wrapper.text())).toContain('Como voce pagou?')
  })

  it('renderiza o wizard utilitario no padrao Family', () => {
    const wrapper = mount(NovoLancamentoWizard, {
      props: { membros }
    })

    const wizard = wrapper.find('[data-testid="novo-lancamento-wizard"]')

    expect(wizard.exists()).toBe(true)
    expect(wizard.classes()).toContain('wizard-family')
    expect(wizard.classes()).not.toContain('shadow-subtle')
    expect(wrapper.text()).toContain('Passo 1 de 5')
  })

  it('avanca para o Passo 2 ao clicar em PIX', async () => {
    const wrapper = mount(NovoLancamentoWizard, {
      props: { membros }
    })

    const buttons = wrapper.findAll('button')
    const pixButton = buttons.find(b => b.text().includes('PIX'))
    expect(pixButton).toBeDefined()

    await pixButton!.trigger('click')

    expect(semAcentos(wrapper.text())).toContain('Quem foi que pagou?')
  })

  it('aciona o aviso visual ao tentar avancar com valor zerado', async () => {
    const wrapper = mount(NovoLancamentoWizard, {
      props: { membros }
    })

    const buttons = wrapper.findAll('button')
    const pixButton = buttons.find(b => b.text().includes('PIX'))
    await pixButton!.trigger('click')

    const luanButton = wrapper.findAll('button').find(b => b.text().includes('Luan'))
    await luanButton!.trigger('click')

    expect(semAcentos(wrapper.text())).toContain('Qual foi o valor total?')

    const avancarButton = wrapper.findAll('button').find(b => semAcentos(b.text()).includes('Avancar'))
    expect(avancarButton).toBeDefined()
    await avancarButton!.trigger('click')

    expect(semAcentos(wrapper.text())).toContain('Valor invalido')
  })
})
