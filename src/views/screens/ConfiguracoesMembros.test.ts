import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import ConfiguracoesMembros from './ConfiguracoesMembros.vue'
import { useMembros } from '../../viewmodels/useMembros'
import { useCargos } from '../../viewmodels/useCargos'

// Mock dos composables
vi.mock('../../viewmodels/useMembros', () => ({
  useMembros: vi.fn()
}))

vi.mock('../../viewmodels/useCargos', () => ({
  useCargos: vi.fn()
}))

vi.mock('../../viewmodels/useCasasMultitenant', () => ({
  useCasasMultitenant: () => ({
    activeTenantId: ref('tenant-123')
  })
}))

vi.mock('../../viewmodels/useCartoesEFaturas', () => ({
  useCartoesEFaturas: () => ({
    resetar: vi.fn(),
    cartoes: ref([]),
    adicionarCartao: vi.fn(),
    excluirCartao: vi.fn()
  })
}))

describe('ConfiguracoesMembros', () => {
  const mockMembros = [
    { id: '1', nome: 'Luan', ativo: true, role: 'ADMIN', userId: 'user-luan', cargoId: null, cargo: null },
    { id: '2', nome: 'Maria', ativo: true, role: 'MORADOR', userId: 'user-maria', cargoId: 'cargo-1', cargo: { id: 'cargo-1', nome: 'Financeiro', cor: '#ef4444', permissoes: ['lancamentos'] } },
    { id: '3', nome: 'Joao', ativo: false, role: 'MORADOR', userId: 'user-joao', cargoId: null, cargo: null }
  ]

  const mockCargos = [
    { id: 'cargo-1', nome: 'Financeiro', cor: '#ef4444', permissoes: ['lancamentos'], totalMembros: 1 }
  ]

  const mockAdicionarMembro = vi.fn()
  const mockDesativarMembro = vi.fn()
  const mockAtivarMembro = vi.fn()
  const mockAtualizarCargoMembro = vi.fn()

  const mockSalvarCargo = vi.fn()
  const mockExcluirCargo = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    
    ;(useMembros as any).mockReturnValue({
      membros: ref(mockMembros),
      ativos: ref(mockMembros.filter(m => m.ativo)),
      currentMembro: ref(mockMembros[0]), // Luan logado (ADMIN)
      adicionarMembro: mockAdicionarMembro,
      desativarMembro: mockDesativarMembro,
      ativarMembro: mockAtivarMembro,
      atualizarCargoMembro: mockAtualizarCargoMembro,
      carregar: vi.fn()
    })

    ;(useCargos as any).mockReturnValue({
      cargos: ref(mockCargos),
      salvarCargo: mockSalvarCargo,
      excluirCargo: mockExcluirCargo,
      inicializar: vi.fn()
    })
  })

  it('deve renderizar a aba Meu Perfil por padrao com dados do usuario logado', () => {
    const wrapper = mount(ConfiguracoesMembros, {
      global: { 
        stubs: { 
          BottomSheet: true, 
          MembroFormBottomSheet: true, 
          CargoFormBottomSheet: true,
          ConfiguracoesCartoes: true,
          MembroAvatar: true,
          ChevronRight: true,
          User: true,
          Shield: true,
          Plus: true
        } 
      }
    })
    expect(wrapper.text()).toContain('Moradores & Cargos')
    expect(wrapper.text()).toContain('Luan') // Nome do currentMembro
    expect(wrapper.text()).toContain('Sair da Conta')
    expect(wrapper.findComponent({ name: 'ConfiguracoesCartoes' }).exists()).toBe(true)
  })

  it('deve renderizar a lista de moradores ao alternar para a aba Controle de Acesso', async () => {
    const wrapper = mount(ConfiguracoesMembros, {
      global: { 
        stubs: { 
          BottomSheet: true, 
          MembroFormBottomSheet: true, 
          CargoFormBottomSheet: true,
          ConfiguracoesCartoes: true,
          MembroAvatar: true,
          ChevronRight: true,
          User: true,
          Shield: true,
          Plus: true
        } 
      }
    })
    
    // Clica na aba Controle de Acesso para exibir a lista
    const botoes = wrapper.findAll('button')
    const botaoAcesso = botoes.find(b => b.text().includes('Controle de Acesso'))
    expect(botaoAcesso).toBeDefined()
    await botaoAcesso?.trigger('click')

    expect(wrapper.text()).toContain('Quem mora aqui')
    expect(wrapper.text()).toContain('Luan')
    expect(wrapper.text()).toContain('Maria')
    expect(wrapper.text()).toContain('Joao')
  })

  it('deve chamar adicionarMembro ao enviar o formulario de novo membro', async () => {
    const wrapper = mount(ConfiguracoesMembros, {
      global: { 
        stubs: { 
          BottomSheet: true, 
          MembroFormBottomSheet: true,
          CargoFormBottomSheet: true, 
          ConfiguracoesCartoes: true,
          MembroAvatar: true,
          ChevronRight: true,
          User: true,
          Shield: true,
          Plus: true
        } 
      }
    })
    
    // Alterna para Controle de Acesso
    const botoes = wrapper.findAll('button')
    const botaoAcesso = botoes.find(b => b.text().includes('Controle de Acesso'))
    await botaoAcesso?.trigger('click')

    const form = wrapper.findComponent({ name: 'MembroFormBottomSheet' })
    expect(form.exists()).toBe(true)
    await form.vm.$emit('salvar', { nome: 'Nova', username: 'nova', password: '123' })
    expect(mockAdicionarMembro).toHaveBeenCalledWith('Nova', 'nova', '123')
  })

  it('deve emitir logout ao clicar no botao Sair da Conta', async () => {
    const wrapper = mount(ConfiguracoesMembros, {
      global: { 
        stubs: { 
          BottomSheet: true, 
          MembroFormBottomSheet: true, 
          CargoFormBottomSheet: true,
          ConfiguracoesCartoes: true,
          MembroAvatar: true,
          ChevronRight: true,
          User: true,
          Shield: true,
          Plus: true
        } 
      }
    })

    const botaoLogout = wrapper.findAll('button').find(b => b.text().includes('Sair da Conta'))
    expect(botaoLogout).toBeDefined()
    await botaoLogout?.trigger('click')

    expect(wrapper.emitted('logout')).toBeTruthy()
  })
})
