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
  const mockAtualizarNomeMembro = vi.fn()

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
      atualizarNomeMembro: mockAtualizarNomeMembro,
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

  it('deve habilitar o modo de edicao inline do nome ao clicar no botao de editar', async () => {
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
          Plus: true,
          Edit2: true,
          Check: true,
          X: true
        } 
      }
    })

    // Deve mostrar o nome estático inicialmente
    expect(wrapper.find('h3.truncate').text()).toBe('Luan')

    // Deve encontrar o botão de editar e clicar nele
    const botaoEditar = wrapper.find('button[aria-label="Editar nome"]')
    expect(botaoEditar.exists()).toBe(true)
    await botaoEditar.trigger('click')

    // O input do nome deve estar visível
    const inputNome = wrapper.find('input[type="text"]')
    expect(inputNome.exists()).toBe(true)
    expect((inputNome.element as HTMLInputElement).value).toBe('Luan')
  })

  it('deve chamar atualizarNomeMembro com sucesso ao preencher nome valido e confirmar', async () => {
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
          Plus: true,
          Edit2: true,
          Check: true,
          X: true
        } 
      }
    })

    // Entra no modo de edição
    await wrapper.find('button[aria-label="Editar nome"]').trigger('click')

    // Digita um novo nome no input
    const inputNome = wrapper.find('input[type="text"]')
    await inputNome.setValue('Luan Editado')

    // Clicar em salvar
    const botaoSalvar = wrapper.find('button[aria-label="Salvar nome"]')
    await botaoSalvar.trigger('click')

    // Deve chamar o mock com os argumentos corretos
    expect(mockAtualizarNomeMembro).toHaveBeenCalledWith('1', 'Luan Editado')
  })

  it('deve cancelar a edicao do nome ao clicar no botao de cancelar', async () => {
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
          Plus: true,
          Edit2: true,
          Check: true,
          X: true
        } 
      }
    })

    // Entra no modo de edição
    await wrapper.find('button[aria-label="Editar nome"]').trigger('click')

    // O input deve estar visível
    expect(wrapper.find('input[type="text"]').exists()).toBe(true)

    // Clica em cancelar
    await wrapper.find('button[aria-label="Cancelar edição"]').trigger('click')

    // O input deve sumir e voltar o nome original estático
    expect(wrapper.find('input[type="text"]').exists()).toBe(false)
    expect(wrapper.find('h3.truncate').text()).toBe('Luan')
  })
})
