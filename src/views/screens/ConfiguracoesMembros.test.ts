import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import ConfiguracoesMembros from './ConfiguracoesMembros.vue'
import { useMembros } from '../../viewmodels/useMembros'
import { useCartoesEFaturas } from '../../viewmodels/useCartoesEFaturas'

// Mock do composable
vi.mock('../../viewmodels/useMembros', () => ({
  useMembros: vi.fn()
}))

vi.mock('../../viewmodels/useCasasMultitenant', () => ({
  useCasasMultitenant: () => ({
    activeTenantId: ref('tenant-123')
  })
}))

describe('ConfiguracoesMembros', () => {
  const mockMembros = [
    { id: '1', nome: 'Luan', ativo: true },
    { id: '2', nome: 'Maria', ativo: true },
    { id: '3', nome: 'Joao', ativo: false }
  ]

  const mockAdicionarMembro = vi.fn()
  const mockDesativarMembro = vi.fn()
  const mockAtivarMembro = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    useCartoesEFaturas().resetar()
    ;(useMembros as any).mockReturnValue({
      membros: ref(mockMembros),
      adicionarMembro: mockAdicionarMembro,
      desativarMembro: mockDesativarMembro,
      ativarMembro: mockAtivarMembro,
      carregar: vi.fn()
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

  it('deve exibir toast de erro se adicionarMembro falhar', async () => {
    const errorMsg = 'Nome de morador já existe'
    mockAdicionarMembro.mockRejectedValueOnce(new Error(errorMsg))
    const wrapper = mount(ConfiguracoesMembros)
    const input = wrapper.find('input')
    const button = wrapper.find('button.h-12')

    await input.setValue('Novo Morador')
    await button.trigger('click')

    const { useToast } = await import('../../composables/useToast')
    const toast = useToast()
    expect(toast.visible.value).toBe(true)
    expect(toast.message.value).toBe(errorMsg)
    expect(toast.type.value).toBe('error')
  })

  it('deve exibir toast de erro se ativarMembro falhar', async () => {
    const errorMsg = 'Não foi possível reativar o morador'
    mockAtivarMembro.mockRejectedValueOnce(new Error(errorMsg))
    const wrapper = mount(ConfiguracoesMembros)
    const btnAtivar = wrapper.find('button[title="Reativar morador"]')

    await btnAtivar.trigger('click')

    const { useToast } = await import('../../composables/useToast')
    const toast = useToast()
    expect(toast.visible.value).toBe(true)
    expect(toast.message.value).toBe(errorMsg)
    expect(toast.type.value).toBe('error')
  })

})
