# Captura de Exceções com Toast Customizado no Frontend

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar o tratamento e captura de exceções/erros no frontend exibindo as mensagens através do Toast customizado, focando nas telas de moradores, cartões e exclusão de gastos no dashboard.

**Architecture:** Envelopar operações assíncronas de gravação/deleção que podem falhar no backend/API em blocos try/catch e chamar `toast.show(error.message, 'error')`. Adicionar e ajustar os testes automatizados correspondentes para validar que o Toast é devidamente disparado em caso de erro.

**Tech Stack:** Vue 3 (Composition API), Vitest, useToast composable.

---

### Task 1: Tratamento de Exceções de Moradores
**Files:**
- Modify: [ConfiguracoesMembros.vue](file:///d:/projetos/divi/src/views/screens/ConfiguracoesMembros.vue)
- Test: [ConfiguracoesMembros.test.ts](file:///d:/projetos/divi/src/views/screens/ConfiguracoesMembros.test.ts)

- [ ] **Step 1: Escrever teste de falha ao adicionar morador**
  No arquivo [ConfiguracoesMembros.test.ts](file:///d:/projetos/divi/src/views/screens/ConfiguracoesMembros.test.ts), adicione um teste validando o disparo do Toast em caso de erro ao adicionar morador.
  ```typescript
  import { useToast } from '../../composables/useToast'
  
  // No describe('ConfiguracoesMembros')
  it('deve exibir toast de erro se adicionarMembro falhar', async () => {
    const errorMsg = 'Nome de morador já existe'
    mockAdicionarMembro.mockRejectedValueOnce(new Error(errorMsg))
    const wrapper = mount(ConfiguracoesMembros)
    const input = wrapper.find('input')
    const button = wrapper.find('button.h-12')

    await input.setValue('Novo Morador')
    await button.trigger('click')

    const toast = useToast()
    expect(toast.visible.value).toBe(true)
    expect(toast.message.value).toBe(errorMsg)
    expect(toast.type.value).toBe('error')
  })
  ```

- [ ] **Step 2: Escrever teste de falha ao reativar morador**
  Adicione o mock para a função `ativarMembro` no setup dos testes e adicione o teste de erro na reativação.
  ```typescript
  // Adicionar no mockMembros / mock setup
  const mockAtivarMembro = vi.fn()
  
  // No beforeEach:
  ;(useMembros as any).mockReturnValue({
    membros: mockMembros,
    adicionarMembro: mockAdicionarMembro,
    desativarMembro: mockDesativarMembro,
    ativarMembro: mockAtivarMembro
  })

  // Novo teste:
  it('deve exibir toast de erro se ativarMembro falhar', async () => {
    const errorMsg = 'Não foi possível reativar o morador'
    mockAtivarMembro.mockRejectedValueOnce(new Error(errorMsg))
    const wrapper = mount(ConfiguracoesMembros)
    const btnAtivar = wrapper.find('button[title="Reativar morador"]')

    await btnAtivar.trigger('click')

    const toast = useToast()
    expect(toast.visible.value).toBe(true)
    expect(toast.message.value).toBe(errorMsg)
    expect(toast.type.value).toBe('error')
  })
  ```

- [ ] **Step 3: Executar testes e garantir que falham**
  Run: `npx vitest run src/views/screens/ConfiguracoesMembros.test.ts`
  Expected: FALHA (métodos não implementados/não envelopados em try/catch no componente).

- [ ] **Step 4: Implementar try/catch em ConfiguracoesMembros.vue**
  Atualize [ConfiguracoesMembros.vue](file:///d:/projetos/divi/src/views/screens/ConfiguracoesMembros.vue) para tratar os erros de adição e ativação de membros.
  ```typescript
  const { membros, adicionarMembro, desativarMembro, ativarMembro } = useMembros()
  const { activeTenantId } = useCasasMultitenant()
  const toast = useToast()
  const novoNome = ref('')
  const activeTab = ref<'membros' | 'cartoes'>('membros')
  
  const handleAdicionar = async () => {
    if (novoNome.value.trim()) {
      try {
        await adicionarMembro(novoNome.value.trim())
        novoNome.value = ''
      } catch (error: any) {
        toast.show(error.message || 'Erro ao adicionar morador', 'error')
      }
    }
  }

  const handleAtivar = async (id: string) => {
    try {
      await ativarMembro(id)
    } catch (error: any) {
      toast.show(error.message || 'Erro ao reativar morador', 'error')
    }
  }
  ```
  E no template:
  ```html
  <Button 
    v-else
    variant="secondary"
    size="icon"
    @click="handleAtivar(membro.id)"
    class="bg-meadow/10 text-meadow hover:bg-meadow/20 border border-transparent rounded-full h-10 w-10 flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95"
    title="Reativar morador"
  >
  ```

- [ ] **Step 5: Executar testes de membros e garantir aprovação**
  Run: `npx vitest run src/views/screens/ConfiguracoesMembros.test.ts`
  Expected: PASS

- [ ] **Step 6: Commit**
  ```bash
  git add src/views/screens/ConfiguracoesMembros.vue src/views/screens/ConfiguracoesMembros.test.ts
  git commit -m "feat: add exception handling with Toast to member actions"
  ```

---

### Task 2: Tratamento de Exceções de Cartões
**Files:**
- Modify: [ConfiguracoesCartoes.vue](file:///d:/projetos/divi/src/views/components/ledger/ConfiguracoesCartoes.vue)

- [ ] **Step 1: Implementar try/catch em ConfiguracoesCartoes.vue**
  Atualize o método `adicionarCard` no arquivo [ConfiguracoesCartoes.vue](file:///d:/projetos/divi/src/views/components/ledger/ConfiguracoesCartoes.vue) para envelopar a chamada do viewmodel em try/catch e chamar o Toast em caso de erro.
  ```typescript
  const adicionarCard = async () => {
    if (!nome.value || !responsavelId.value) return
    try {
      await adicionarCartao(nome.value, diaFechamento.value, responsavelId.value)
      nome.value = ''
      responsavelId.value = ''
    } catch (error: any) {
      toast.show(error.message || 'Erro ao cadastrar cartão', 'error')
    }
  }
  ```

- [ ] **Step 2: Rodar todos os testes do projeto para garantir integridade**
  Run: `npx vitest run`
  Expected: PASS para todos os testes.

- [ ] **Step 3: Commit**
  ```bash
  git add src/views/components/ledger/ConfiguracoesCartoes.vue
  git commit -m "feat: add exception handling with Toast to card creation"
  ```

---

### Task 3: Tratamento de Exceção na Exclusão de Gasto no Dashboard
**Files:**
- Modify: [useDashboardViewModel.ts](file:///d:/projetos/divi/src/viewmodels/useDashboardViewModel.ts)
- Test: [useDashboardViewModel.test.ts](file:///d:/projetos/divi/src/viewmodels/useDashboardViewModel.test.ts)

- [ ] **Step 1: Escrever teste de erro ao excluir gasto**
  No arquivo [useDashboardViewModel.test.ts](file:///d:/projetos/divi/src/viewmodels/useDashboardViewModel.test.ts), localize os testes de `excluirGasto` e adicione um caso de teste validando que o Toast exibe a mensagem de erro se a chamada do serviço falhar.
  ```typescript
  it('deve exibir toast de erro se a exclusão do gasto falhar no serviço', async () => {
    const errorMsg = 'Falha de conexão com a base de dados'
    mockGastoService.excluirGasto.mockRejectedValueOnce(new Error(errorMsg))
    
    const { excluirGasto } = useDashboardViewModel(defaultProps, mockEmit, {
      gastoService: mockGastoService
    })

    await excluirGasto('gasto-comum-id')

    expect(mockToast.show).toHaveBeenCalledWith(errorMsg, 'error')
  })
  ```

- [ ] **Step 2: Executar testes de dashboard e garantir falha**
  Run: `npx vitest run src/viewmodels/useDashboardViewModel.test.ts`
  Expected: FALHA no teste recém-criado.

- [ ] **Step 3: Implementar try/catch na exclusão de gasto**
  No arquivo [useDashboardViewModel.ts](file:///d:/projetos/divi/src/viewmodels/useDashboardViewModel.ts), atualize o método `excluirGasto`:
  ```typescript
    excluirGasto: async (id: string) => {
      if (periodos.faturaSelecionadaTrancada.value) return
      
      const gasto = globalGastos.value.find(g => g.id === id)
      if (gasto) {
        const isComum = !gasto.cardOwner && !gasto.isSettlement
        if (isComum) {
          const acertos = acertosDaFatura(gasto.faturaId)
          const temAcertosConfirmados = acertos.some(a => a.pago || (a.valorPago && a.valorPago.centavos > 0))
          if (temAcertosConfirmados) {
            toast.show(
              'Não é possível excluir gastos comuns neste período pois já existem acertos de contas (Pix) confirmados. Estorne os acertos primeiro',
              'error'
            )
            return
          }
        }
      }

      try {
        await localGastoService.excluirGasto(id)
        await cartoesEFaturas.inicializar()
      } catch (error: any) {
        toast.show(error.message || 'Erro ao excluir gasto', 'error')
      }
    }
  ```

- [ ] **Step 4: Executar testes de dashboard e validar sucesso**
  Run: `npx vitest run src/viewmodels/useDashboardViewModel.test.ts`
  Expected: PASS

- [ ] **Step 5: Executar todos os testes do projeto**
  Run: `npx vitest run`
  Expected: PASS (todos os testes passando sem nenhuma regressão).

- [ ] **Step 6: Commit**
  ```bash
  git add src/viewmodels/useDashboardViewModel.ts src/viewmodels/useDashboardViewModel.test.ts
  git commit -m "feat: add exception handling with Toast to excluirGasto action"
  ```
