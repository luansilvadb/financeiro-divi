import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ConfiguracoesMembros from './ConfiguracoesMembros.vue'
import { useMembros } from '../../modules/ledger/composables/useMembros'
import { useCartoesEFaturas } from '../../modules/ledger/composables/useCartoesEFaturas'

// Mock do composable
vi.mock('../../modules/ledger/composables/useMembros', () => ({
  useMembros: vi.fn()
}))

describe('ConfiguracoesMembros', () => {
  const mockMembros = [
    { id: '1', nome: 'Luan', ativo: true },
    { id: '2', nome: 'Maria', ativo: true },
    { id: '3', nome: 'Joao', ativo: false }
  ]

  const mockAdicionarMembro = vi.fn()
  const mockDesativarMembro = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    useCartoesEFaturas().resetar()
    ;(useMembros as any).mockReturnValue({
      membros: mockMembros,
      adicionarMembro: mockAdicionarMembro,
      desativarMembro: mockDesativarMembro
    })
  })

  it('deve renderizar a lista de membros corretamente', () => {
    const wrapper = mount(ConfiguracoesMembros)
    
    expect(wrapper.text()).toContain('Luan')
    expect(wrapper.text()).toContain('Maria')
    expect(wrapper.text()).toContain('Joao')
    expect(wrapper.text()).toContain('Desativado')
  })

  it('deve chamar adicionarMembro ao preencher o nome e clicar no botão', async () => {
    const wrapper = mount(ConfiguracoesMembros)
    const input = wrapper.find('input')
    const button = wrapper.find('button.h-12')

    await input.setValue('Novo Morador')
    await button.trigger('click')

    expect(mockAdicionarMembro).toHaveBeenCalledWith('Novo Morador')
  })

  it('deve chamar desativarMembro ao clicar no botão de desativar', async () => {
    const wrapper = mount(ConfiguracoesMembros)
    const btnDesativar = wrapper.find('button[title="Desativar morador"]')

    await btnDesativar.trigger('click')

    expect(mockDesativarMembro).toHaveBeenCalledWith('1')
  })

  it('não deve mostrar botão de desativar para membros já desativados', () => {
    const wrapper = mount(ConfiguracoesMembros)
    const items = wrapper.findAll('.grid.gap-3 > div')
    
    const itemDesativado = items.find(i => i.text().includes('Joao'))
    expect(itemDesativado?.find('button[title="Desativar morador"]').exists()).toBe(false)
  })

})
