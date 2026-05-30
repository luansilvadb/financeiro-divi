# Bloqueio de Exclusão de Gastos Comuns com Acertos Confirmados Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Impedir a exclusão de gastos comuns em períodos que já possuam acertos Pix confirmados (quitados ou parciais), exibindo um Toast Message premium no topo-meio da tela.

**Architecture:** Criar um composable `useToast` global para gerenciar o estado da notificação, um componente `ToastNotification.vue` flutuante no topo-meio da tela integrado no `App.vue`, e interceptar a exclusão de gastos comuns no `useDashboardViewModel.ts` validando contra os acertos do período correspondente.

**Tech Stack:** Vue 3 (Composition API), Vitest, Tailwind CSS, Lucide Icons.

---

### Task 1: Criar o Composable useToast e seus Testes Unitários

**Files:**
- Create: `src/composables/useToast.ts`
- Create: `src/composables/useToast.test.ts`

- [ ] **Step 1: Escrever o teste unitário para o useToast**
  Criar o arquivo `src/composables/useToast.test.ts` com testes para as funções `show` e `hide` e o estado reativo.
  ```typescript
  import { describe, it, expect, beforeEach, vi } from 'vitest'
  import { useToast } from './useToast'

  describe('useToast', () => {
    beforeEach(() => {
      const { hide } = useToast()
      hide()
      vi.useFakeTimers()
    })

    it('deve iniciar com estado invisivel e mensagem vazia', () => {
      const { visible, message, type } = useToast()
      expect(visible.value).toBe(false)
      expect(message.value).toBe('')
      expect(type.value).toBe('info')
    })

    it('deve exibir o toast com mensagem e tipo corretos e fechar apos o tempo limite', () => {
      const { visible, message, type, show } = useToast()
      show('Mensagem de erro', 'error', 3000)

      expect(visible.value).toBe(true)
      expect(message.value).toBe('Mensagem de erro')
      expect(type.value).toBe('error')

      vi.advanceTimersByTime(3000)
      expect(visible.value).toBe(false)
    })

    it('deve ocultar o toast imediatamente ao chamar hide', () => {
      const { visible, show, hide } = useToast()
      show('Teste', 'info')
      expect(visible.value).toBe(true)

      hide()
      expect(visible.value).toBe(false)
    })
  })
  ```

- [ ] **Step 2: Rodar o teste para verificar se falha**
  Executar: `npx vitest run src/composables/useToast.test.ts`
  Expected: FAIL (pois o composable ainda não existe)

- [ ] **Step 3: Implementar o composable useToast**
  Criar `src/composables/useToast.ts` com a lógica de reatividade global:
  ```typescript
  import { ref } from 'vue'

  const visible = ref(false)
  const message = ref('')
  const type = ref<'error' | 'success' | 'info'>('info')
  let timeoutId: any = null

  export function useToast() {
    const show = (msg: string, t: 'error' | 'success' | 'info' = 'info', duration = 4500) => {
      message.value = msg
      type.value = t
      visible.value = true
      
      if (timeoutId) clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        visible.value = false
      }, duration)
    }

    const hide = () => {
      visible.value = false
      if (timeoutId) clearTimeout(timeoutId)
    }

    return {
      visible,
      message,
      type,
      show,
      hide
    }
  }
  ```

- [ ] **Step 4: Rodar o teste para verificar se passa**
  Executar: `npx vitest run src/composables/useToast.test.ts`
  Expected: PASS

- [ ] **Step 5: Fazer commit**
  ```bash
  git add src/composables/useToast.ts src/composables/useToast.test.ts
  git commit -m "feat: add useToast composable and unit tests"
  ```

---

### Task 2: Criar o Componente ToastNotification

**Files:**
- Create: `src/views/components/ui/ToastNotification.vue`
- Create: `src/views/components/ui/ToastNotification.test.ts`

- [ ] **Step 1: Escrever teste de montagem para ToastNotification**
  Criar o arquivo `src/views/components/ui/ToastNotification.test.ts`:
  ```typescript
  import { describe, it, expect, beforeEach } from 'vitest'
  import { mount } from '@vue/test-utils'
  import ToastNotification from './ToastNotification.vue'
  import { useToast } from '../../../composables/useToast'

  describe('ToastNotification', () => {
    beforeEach(() => {
      const { hide } = useToast()
      hide()
    })

    it('nao deve renderizar nada se visible for falso', () => {
      const wrapper = mount(ToastNotification)
      expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    })

    it('deve renderizar a mensagem e botao fechar se visible for verdadeiro', async () => {
      const { show } = useToast()
      show('Mensagem de Teste Toast')
      
      const wrapper = mount(ToastNotification)
      expect(wrapper.find('[role="alert"]').exists()).toBe(true)
      expect(wrapper.text()).toContain('Mensagem de Teste Toast')
      
      // Ao clicar no botão de fechar, o toast deve sumir
      await wrapper.find('button').trigger('click')
      const { visible } = useToast()
      expect(visible.value).toBe(false)
    })
  })
  ```

- [ ] **Step 2: Rodar o teste para verificar se falha**
  Executar: `npx vitest run src/views/components/ui/ToastNotification.test.ts`
  Expected: FAIL

- [ ] **Step 3: Implementar o componente ToastNotification**
  Criar `src/views/components/ui/ToastNotification.vue` com estilo Glassmorphism e o ícone de escudo protetor com gradiente (Opção A):
  ```vue
  <script setup lang="ts">
  import { useToast } from '../../../composables/useToast'
  import { X } from 'lucide-vue-next'

  const { visible, message, hide } = useToast()
  </script>

  <template>
    <Transition name="toast-slide">
      <div 
        v-if="visible" 
        class="fixed top-5 left-1/2 -translate-x-1/2 z-[9999] w-[90%] max-w-[420px] bg-white/85 backdrop-blur-md border border-rose-500/20 rounded-xl p-3 flex items-center gap-3 shadow-[0_10px_30px_-10px_rgba(225,29,72,0.15),0_1px_3px_0_rgba(0,0,0,0.05)] pointer-events-auto"
        role="alert"
      >
        <!-- Ícone Shield Alert com Degradê Vermelho/Laranja -->
        <div class="flex items-center justify-center w-8 h-8 rounded-lg shrink-0 bg-rose-500/10">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="url(#toast-gradient-red-orange)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-[18px] h-[18px] animate-pulse">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>

        <div class="flex-1 text-xs md:text-sm font-semibold text-slate-800 leading-relaxed">
          {{ message }}
        </div>

        <button 
          @click="hide" 
          class="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          aria-label="Fechar notificação"
        >
          <X class="w-4 h-4" />
        </button>

        <!-- Definição global do gradiente para o SVG de ícone -->
        <svg width="0" height="0" class="absolute">
          <defs>
            <linearGradient id="toast-gradient-red-orange" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#e11d48" />
              <stop offset="100%" stop-color="#f59e0b" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </Transition>
  </template>

  <style scoped>
  .toast-slide-enter-active {
    transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.3s ease;
  }
  .toast-slide-leave-active {
    transition: transform 0.3s ease, opacity 0.3s ease;
  }
  .toast-slide-enter-from {
    transform: translateX(-50%) translateY(-120px);
    opacity: 0;
  }
  .toast-slide-leave-to {
    transform: translateX(-50%) translateY(-120px);
    opacity: 0;
  }
  </style>
  ```

- [ ] **Step 4: Rodar o teste para verificar se passa**
  Executar: `npx vitest run src/views/components/ui/ToastNotification.test.ts`
  Expected: PASS

- [ ] **Step 5: Fazer commit**
  ```bash
  git add src/views/components/ui/ToastNotification.vue src/views/components/ui/ToastNotification.test.ts
  git commit -m "feat: implement ToastNotification component and tests"
  ```

---

### Task 3: Integrar o ToastNotification no App.vue

**Files:**
- Modify: `src/App.vue`

- [ ] **Step 1: Importar e adicionar o ToastNotification em App.vue**
  Adicionar a importação de `ToastNotification` nas tags `<script>` e colocá-lo dentro do template principal.
  
  Nas importações (por volta da linha 9-16):
  ```typescript
  import ToastNotification from './views/components/ui/ToastNotification.vue'
  ```

  No template, inserir `<ToastNotification />` logo dentro do elemento root (por volta da linha 115):
  ```vue
  <template>
    <!-- Não autenticado -->
    <div v-if="!isAuthed">
      <LoginScreen @auth-success="handleAuthSuccess" />
    </div>
    <!-- Autenticado mas sem casa -->
    <div v-else-if="!hasTenant">
      <TenantSelectorScreen
        @casa-selecionada="handleCasaSelecionada"
        @logout="handleLogout"
      />
    </div>
    <!-- Dashboard normal -->
    <div v-else class="min-h-screen bg-canvas text-graphite font-sans selection:bg-ember/20">
      <ToastNotification />
      <div class="max-w-[1200px] mx-auto px-4 md:px-6 pt-2 md:pt-4 pb-36 md:pb-16 relative">
        ...
  ```

- [ ] **Step 2: Rodar todos os testes de App para verificar se não quebrou**
  Executar: `npx vitest run src/App.test.ts`
  Expected: PASS

- [ ] **Step 3: Fazer commit**
  ```bash
  git add src/App.vue
  git commit -m "feat: integrate ToastNotification in App.vue"
  ```

---

### Task 4: Implementar a Interceptação e Validação no useDashboardViewModel

**Files:**
- Modify: `src/viewmodels/useDashboardViewModel.ts`
- Modify: `src/viewmodels/useDashboardViewModel.test.ts`

- [ ] **Step 1: Escrever teste de interceptação no useDashboardViewModel.test.ts**
  Adicionar um caso de teste para validar o bloqueio de exclusão em `src/viewmodels/useDashboardViewModel.test.ts`.
  
  ```typescript
  // Adicionar no topo do arquivo de teste:
  import { useToast } from '../composables/useToast'
  vi.mock('../composables/useToast', () => {
    const showMock = vi.fn()
    const hideMock = vi.fn()
    return {
      useToast: () => ({
        show: showMock,
        hide: hideMock,
        visible: { value: false }
      })
    }
  })

  // E no bloco de describe('useDashboardViewModel'):
  it('deve impedir exclusao de gasto comum se houver acertos confirmados no periodo', async () => {
    const mockGastoComum = {
      id: 'g-comum',
      faturaId: 'f1',
      descricao: 'Gasto Comum',
      cardOwner: null,
      isSettlement: false,
      valorTotal: { centavos: 1000 }
    } as any

    const mockAcertoConfirmado = {
      id: 'a1',
      faturaId: 'f1',
      pago: true,
      valorPago: { centavos: 1000 }
    } as any

    // Mock das dependencias e UI state
    const customProps = {
      ...defaultProps,
      acertosPendentes: [mockAcertoConfirmado]
    }
    
    const vm = useDashboardViewModel(customProps, mockEmit, deps)
    
    // Configura o item a ser estornado no UI state do vm
    vm.itemParaEstornar.value = mockGastoComum
    vm.itemTypeParaEstornar.value = 'Lançamento'
    
    // Dispara a tentativa de estorno
    await vm.confirmarEstorno()
    
    // Garante que o toast de erro foi chamado
    const toast = useToast()
    expect(toast.show).toHaveBeenCalledWith(
      'Não é possível excluir gastos comuns neste período pois já existem acertos de contas (Pix) confirmados. Estorne os acertos primeiro',
      'error'
    )
    
    // Garante que o service de excluir gasto NÃO foi chamado
    expect(mockGastoService.excluirGasto).not.toHaveBeenCalled()
  })
  ```

- [ ] **Step 2: Rodar os testes para verificar se falha**
  Executar: `npx vitest run src/viewmodels/useDashboardViewModel.test.ts`
  Expected: FAIL

- [ ] **Step 3: Implementar a validação lógica em useDashboardViewModel.ts**
  Atualizar `src/viewmodels/useDashboardViewModel.ts` para importar `useToast` e interceptar o estorno em `confirmarEstorno` e a exclusão em `abrirConfirmacaoEstornoGasto`:
  
  Importar `useToast` no topo:
  ```typescript
  import { useToast } from '../composables/useToast'
  ```

  Dentro da função `useDashboardViewModel`, obter a instância do toast:
  ```typescript
  const toast = useToast()
  ```

  Sobrescrever `abrirConfirmacaoEstornoGasto` e interceptar `confirmarEstorno`:
  
  Modificar `confirmarEstorno` (linha ~275):
  ```typescript
    const confirmarEstorno = async () => {
      if (!uiState.itemParaEstornar.value) return

      // Verificação de segurança para gastos comuns
      if (uiState.itemTypeParaEstornar.value === 'Lançamento') {
        const gasto = uiState.itemParaEstornar.value
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
        const handlers: Record<string, () => Promise<void>> = {
          'Lançamento': () => localGastoService.excluirGasto(uiState.itemParaEstornar.value!.id).then(() => cartoesEFaturas.inicializar()),
          'Conta Fixa': () => excluirContaFixa(uiState.itemParaEstornar.value!.id)
        }
        await handlers[uiState.itemTypeParaEstornar.value]?.()

        uiState.showBottomSheetConfirmacaoEstorno.value = false
        uiState.itemParaEstornar.value = null
      } catch (error: any) {
        alert(error.message || 'Erro ao realizar estorno')
      }
    }
  ```

  E modificar o retorno no `return` (linhas 341+):
  ```typescript
      abrirConfirmacaoEstornoGasto: (gasto: any) => {
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
        uiState.abrirConfirmacaoEstornoGasto(gasto)
      },
  ```

  Também adicionar a mesma validação na função `excluirGasto` retornada (para rotas de exclusão direta se houver):
  ```typescript
      excluirGasto: async (id: string) => {
        if (periodos.faturaSelecionadaTrancada.value) return
        
        // Busca o gasto para validar
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

        await localGastoService.excluirGasto(id)
        await cartoesEFaturas.inicializar()
      }
  ```

- [ ] **Step 4: Rodar os testes para verificar se passa**
  Executar: `npx vitest run src/viewmodels/useDashboardViewModel.test.ts`
  Expected: PASS

- [ ] **Step 5: Fazer commit**
  ```bash
  git add src/viewmodels/useDashboardViewModel.ts src/viewmodels/useDashboardViewModel.test.ts
  git commit -m "feat: intercept delete/estorno of common expenses with confirmed settlements"
  ```

---

### Task 6: Verificação de Integração Completa

- [ ] **Step 1: Rodar toda a suite de testes do frontend**
  Executar: `npx vitest run`
  Expected: Todos os testes passam (incluindo os novos e antigos)

- [ ] **Step 2: Desligar o servidor de Mockups**
  Executar: `scripts/stop-server.sh`
  Expected: Servidor mock desligado com sucesso
