import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import ConfiguracoesMembros from './ConfiguracoesMembros.vue'
import { useMembros } from '../../viewmodels/useMembros'
import { useCargos } from '../../viewmodels/useCargos'
import { useCartoesEFaturas } from '../../viewmodels/useCartoesEFaturas'

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
    useCartoesEFaturas().resetar()
    
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

  it('deve renderizar o perfil do usuario logado na aba Meu Perfil por padrao', () => {
    const wrapper = mount(ConfiguracoesMembros)
    expect(wrapper.text()).toContain('Perfil do Usuário')
    expect(wrapper.text()).toContain('Meu Perfil')
    expect(wrapper.text()).toContain('Sair da Conta')
    expect(wrapper.text()).toContain('Luan')
    expect(wrapper.text()).toContain('Meus Cartões')
  })

  it('deve renderizar a lista de membros e badges de cargos corretamente na aba Controle de Acesso', async () => {
    const wrapper = mount(ConfiguracoesMembros)
    await wrapper.findAll('button').find(b => b.text().includes('Moradores'))?.trigger('click')
    await wrapper.vm.$nextTick()
    
    expect(wrapper.text()).toContain('Luan')
    expect(wrapper.text()).toContain('Maria')
    expect(wrapper.text()).toContain('Joao')
    expect(wrapper.text()).toContain('Financeiro')
    expect(wrapper.text()).toContain('Acesso Suspenso')
  })

  it('deve chamar adicionarMembro ao preencher nome, usuário e senha e clicar no botão', async () => {
    const wrapper = mount(ConfiguracoesMembros, {
      global: { stubs: { Teleport: true } }
    })
    await wrapper.findAll('button').find(b => b.text().includes('Moradores'))?.trigger('click')
    await wrapper.vm.$nextTick()
    
    // Abre o sub-formulário de Novo Morador
    const btnNovoMembroForm = wrapper.findAll('button').find(b => b.text().includes('Adicionar Morador'))
    expect(btnNovoMembroForm).toBeDefined()
    await btnNovoMembroForm!.trigger('click')
    await wrapper.vm.$nextTick()

    const inputs = wrapper.findAll('input')
    const button = wrapper.findAll('button').find(b => b.text().includes('Cadastrar'))

    await inputs[0].setValue('Novo Morador')
    await inputs[1].setValue('novo.membro')
    await inputs[2].setValue('senha123')
    await button!.trigger('click')
    await wrapper.vm.$nextTick()

    expect(mockAdicionarMembro).toHaveBeenCalledWith('Novo Morador', 'novo.membro', 'senha123')
  })

  it('deve abrir o Bottom Sheet ao tocar em um membro na listagem', async () => {
    const wrapper = mount(ConfiguracoesMembros, {
      global: { stubs: { Teleport: true } }
    })
    await wrapper.findAll('button').find(b => b.text().includes('Moradores'))?.trigger('click')
    await wrapper.vm.$nextTick()

    // Busca os itens na lista de moradores pelo texto
    const divMembros = wrapper.findAll('div').filter(d => d.attributes('class')?.includes('cursor-pointer'))
    const itemMaria = divMembros.find(d => d.text().includes('Maria'))
    expect(itemMaria).toBeDefined()

    await itemMaria!.trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Cargo e Nível de Acesso')
    expect(wrapper.text()).toContain('Morador Ativo na Casa')
  })

  it('deve chamar atualizarCargoMembro ao alterar cargo da Maria e salvar', async () => {
    const wrapper = mount(ConfiguracoesMembros, {
      global: { stubs: { Teleport: true } }
    })
    await wrapper.findAll('button').find(b => b.text().includes('Moradores'))?.trigger('click')
    await wrapper.vm.$nextTick()

    const divMembros = wrapper.findAll('div').filter(d => d.attributes('class')?.includes('cursor-pointer'))
    const itemMaria = divMembros.find(d => d.text().includes('Maria'))
    await itemMaria!.trigger('click')
    await wrapper.vm.$nextTick()

    // Localizar inputs do tipo radio
    const radios = wrapper.findAll('input[type="radio"]')
    const radioAdmin = radios.find(r => r.attributes('value') === 'ADMIN')
    expect(radioAdmin).toBeDefined()

    // Clica para promover a Maria para Admin
    await radioAdmin!.setValue(true)
    await wrapper.vm.$nextTick()

    // Clica em Salvar Alterações
    const btnSalvar = wrapper.findAll('button').find(b => b.text().includes('Salvar Alterações'))
    expect(btnSalvar).toBeDefined()
    await btnSalvar!.trigger('click')
    await wrapper.vm.$nextTick()

    expect(mockAtualizarCargoMembro).toHaveBeenCalledWith('2', 'ADMIN', undefined)
  })

  it('deve chamar desativarMembro ao desligar o status ativo da Maria no Bottom Sheet', async () => {
    const wrapper = mount(ConfiguracoesMembros, {
      global: { stubs: { Teleport: true } }
    })
    await wrapper.findAll('button').find(b => b.text().includes('Moradores'))?.trigger('click')
    await wrapper.vm.$nextTick()

    const divMembros = wrapper.findAll('div').filter(d => d.attributes('class')?.includes('cursor-pointer'))
    const itemMaria = divMembros.find(d => d.text().includes('Maria'))
    await itemMaria!.trigger('click')
    await wrapper.vm.$nextTick()

    const toggleAtivo = wrapper.find('#toggle-membro-ativo')
    expect(toggleAtivo.exists()).toBe(true)

    await toggleAtivo!.trigger('click')
    await wrapper.vm.$nextTick()

    const btnSalvar = wrapper.findAll('button').find(b => b.text().includes('Salvar Alterações'))
    await btnSalvar!.trigger('click')
    await wrapper.vm.$nextTick()

    expect(mockDesativarMembro).toHaveBeenCalledWith('2')
  })

  it('deve desabilitar alteração de cargo e status para o próprio usuário logado', async () => {
    const wrapper = mount(ConfiguracoesMembros, {
      global: { stubs: { Teleport: true } }
    })
    await wrapper.findAll('button').find(b => b.text().includes('Moradores'))?.trigger('click')
    await wrapper.vm.$nextTick()

    const divMembros = wrapper.findAll('div').filter(d => d.attributes('class')?.includes('cursor-pointer'))
    const itemLuan = divMembros.find(d => d.text().includes('Luan'))
    await itemLuan!.trigger('click')
    await wrapper.vm.$nextTick()

    // Radios de cargo devem estar desabilitados
    const radios = wrapper.findAll('input[type="radio"]')
    radios.forEach(r => {
      expect(r.attributes('disabled')).toBeDefined()
    })

    // Toggle de ativação também deve estar desabilitado
    const toggleAtivo = wrapper.find('#toggle-membro-ativo')
    expect(toggleAtivo.attributes('disabled')).toBeDefined()
  })

  it('deve permitir a exclusão de um cargo não utilizado', async () => {
    const mockCargosComLivre = [
      { id: 'cargo-1', nome: 'Financeiro', cor: '#ef4444', permissoes: ['lancamentos'], totalMembros: 1 },
      { id: 'cargo-2', nome: 'Livre', cor: '#3b82f6', permissoes: ['lancamentos'], totalMembros: 0 }
    ]
    ;(useCargos as any).mockReturnValue({
      cargos: ref(mockCargosComLivre),
      salvarCargo: mockSalvarCargo,
      excluirCargo: mockExcluirCargo,
      inicializar: vi.fn()
    })

    const wrapperLivre = mount(ConfiguracoesMembros, {
      global: { stubs: { Teleport: true } }
    })
    await wrapperLivre.findAll('button').find(b => b.text().includes('Moradores'))?.trigger('click')
    await wrapperLivre.vm.$nextTick()
    
    // Clica no card do cargo Livre para abrir a edição e o bottomsheet
    // Usamos um seletor mais específico para garantir que pegamos o card do cargo
    const cardsCargos = wrapperLivre.findAll('.cursor-pointer').filter(d => 
      d.text().includes('Livre') && d.html().includes('lucide-shield')
    )
    expect(cardsCargos.length).toBeGreaterThan(0)
    await cardsCargos[0].trigger('click')
    await wrapperLivre.vm.$nextTick()

    // Abre o bottom sheet de permissões onde está a lixeira
    const btnPermissoes = wrapperLivre.find('button[data-testid="configurar-permissoes-cargo"]')
    expect(btnPermissoes.exists()).toBe(true)
    await btnPermissoes.trigger('click')
    await wrapperLivre.vm.$nextTick()

    // Acha o botão de lixeira no bottomsheet de permissões
    const activeTrash = wrapperLivre.find('button[data-testid="excluir-cargo-bottomsheet"]')
    expect(activeTrash.exists()).toBe(true)

    await activeTrash.trigger('click')
    await wrapperLivre.vm.$nextTick()
    
    // Confirma exclusão (panel extra agora)
    const btnSimExcluir = wrapperLivre.find('button[data-testid="confirmar-excluir-cargo-bottomsheet"]')
    expect(btnSimExcluir.exists()).toBe(true)
    await btnSimExcluir.trigger('click')
    await wrapperLivre.vm.$nextTick()

    expect(mockExcluirCargo).toHaveBeenCalledWith('cargo-2')
  })

  it('deve permitir preencher o formulário para editar um cargo existente', async () => {
    const wrapper = mount(ConfiguracoesMembros, {
      global: { stubs: { Teleport: true } }
    })
    await wrapper.findAll('button').find(b => b.text().includes('Moradores'))?.trigger('click')
    await wrapper.vm.$nextTick()
    
    // Clica no card do cargo Financeiro para editar
    // Filtramos especificamente pelos cards que estão na seção de cargos (ícone lucide-shield)
    const cardsCargos = wrapper.findAll('.cursor-pointer').filter(d => 
      d.text().includes('Financeiro') && d.html().includes('lucide-shield')
    )
    expect(cardsCargos.length).toBeGreaterThan(0)
    await cardsCargos[0].trigger('click')
    await wrapper.vm.$nextTick()

    // Abre o bottom sheet de permissões
    const btnPermissoes = wrapper.find('button[data-testid="configurar-permissoes-cargo"]')
    expect(btnPermissoes.exists()).toBe(true)
    await btnPermissoes.trigger('click')
    await wrapper.vm.$nextTick()

    // Clica em Confirmar no Bottom Sheet de permissões que abriu
    const btnConfirmar = wrapper.findAll('button').find(b => b.text().includes('Confirmar'))
    expect(btnConfirmar).toBeDefined()
    await btnConfirmar!.trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Editar Cargo')

    const inputNome = wrapper.find('input[placeholder="Ex: Financeiro, Consultor, etc."]')
    expect((inputNome.element as HTMLInputElement).value).toBe('Financeiro')

    await inputNome.setValue('Financeiro Avançado')
    
    const btnSalvar = wrapper.findAll('button').find(b => b.text().includes('Salvar Alterações'))
    expect(btnSalvar).toBeDefined()
    
    await btnSalvar!.trigger('click')
    await wrapper.vm.$nextTick()

    expect(mockSalvarCargo).toHaveBeenCalledWith('Financeiro Avançado', ['lancamentos'], '#ef4444', 'cargo-1')
  })

  it('deve permitir configurar permissões em um bottom sheet separado ao criar um cargo', async () => {
    const wrapper = mount(ConfiguracoesMembros, {
      global: { stubs: { Teleport: true } }
    })
    await wrapper.findAll('button').find(b => b.text().includes('Moradores'))?.trigger('click')
    await wrapper.vm.$nextTick()
    
    // Abre o formulário de novo cargo
    await wrapper.findAll('button').find(b => b.text().includes('Novo Cargo'))!.trigger('click')
    await wrapper.vm.$nextTick()

    const inputNome = wrapper.find('input[placeholder="Ex: Financeiro, Consultor, etc."]')
    await inputNome.setValue('Diretor')

    const btnConfigurar = wrapper.find('button[data-testid="configurar-permissoes-cargo"]')
    expect(btnConfigurar.exists()).toBe(true)
    await btnConfigurar.trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Permissões do Cargo')

    const toggles = wrapper.findAll('button[data-testid="toggle-permissao-cargo"]')
    expect(toggles.length).toBeGreaterThan(0)
    await toggles[0].trigger('click')
    await wrapper.vm.$nextTick()

    const btnConfirmar = wrapper.findAll('button').find(b => b.text().includes('Confirmar'))
    expect(btnConfirmar).toBeDefined()
    await btnConfirmar!.trigger('click')
    await wrapper.vm.$nextTick()

    const btnCriar = wrapper.findAll('button').find(b => b.text().includes('Criar Cargo'))
    expect(btnCriar).toBeDefined()
    await btnCriar!.trigger('click')
    await wrapper.vm.$nextTick()

    expect(mockSalvarCargo).toHaveBeenCalledWith('Diretor', ['lancamentos'], '#ef4444', undefined)
  })
})
