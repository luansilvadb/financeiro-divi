import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import NovoLancamentoWizard from './NovoLancamentoWizard.vue'

const mockCartoes = ref<any[]>([])
const mockFaturasFechadas = ref<any[]>([])
const mockPeriodo = ref({ mes: 5, ano: 2026 })

vi.mock('../../viewmodels/useCartoesEFaturas', () => ({
  useCartoesEFaturas: () => ({
    cartoes: mockCartoes,
    faturasFechadas: mockFaturasFechadas,
    inicializar: vi.fn()
  })
}))

vi.mock('../../shared/utils/periodoStorage', () => ({
  obterPeriodoSelecionado: () => mockPeriodo.value
}))

describe('NovoLancamentoWizard - Senior v18', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    vi.useFakeTimers()
    mockCartoes.value = []
    mockFaturasFechadas.value = []
    mockPeriodo.value = { mes: 5, ano: 2026 }
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

  it('desabilita cartoes cuja fatura esteja fechada no periodo e exibe o badge FATURA FECHADA', async () => {
    mockCartoes.value = [
      { id: 'c1', nome: 'Nubank' },
      { id: 'c2', nome: 'Itaú' }
    ]
    mockFaturasFechadas.value = [
      { cartaoId: 'c1', periodo: { mes: 5, ano: 2026 }, status: 'FECHADA' }
    ]

    const wrapper = mount(NovoLancamentoWizard, {
      props: { membros }
    })

    const buttons = wrapper.findAll('button')
    
    // Procura o botão do Nubank
    const nubankBtn = buttons.find(b => b.text().includes('Cartão Nubank'))
    expect(nubankBtn).toBeDefined()
    expect(nubankBtn!.attributes('disabled')).toBeDefined()
    expect(nubankBtn!.text()).toContain('FATURA FECHADA')

    // Procura o botão do Itaú
    const itauBtn = buttons.find(b => b.text().includes('Cartão Itaú'))
    expect(itauBtn).toBeDefined()
    expect(itauBtn!.attributes('disabled')).toBeUndefined()
    expect(itauBtn!.text()).not.toContain('FATURA FECHADA')
  })
})
