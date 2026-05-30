# Implementar Botão de Fechar no Wizard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar um botão de "X" no Wizard de Novo Lançamento para permitir o retorno ao Dashboard.

**Architecture:** Modificar `NovoLancamentoWizard.vue` para incluir o botão de cancelamento e garantir que o componente pai (`App.vue`) já trate esse evento.

**Tech Stack:** Vue 3, Lucide Vue Next, Tailwind CSS.

---

### Task 1: Adicionar Botão de Fechar em NovoLancamentoWizard

**Files:**
- Modify: `src/components/ledger/NovoLancamentoWizard.vue`

- [ ] **Step 1: Importar o ícone X**

```typescript
// Em src/components/ledger/NovoLancamentoWizard.vue
import { ArrowRight, X } from 'lucide-vue-next'
```

- [ ] **Step 2: Adicionar a classe 'relative' ao container principal**
Isso é necessário para o posicionamento absoluto do botão "X".

```vue
<!-- Em src/components/ledger/NovoLancamentoWizard.vue -->
<div class="relative max-w-md mx-auto p-6 bg-white rounded-xl shadow-md pb-24 md:pb-6">
```

- [ ] **Step 3: Adicionar o botão de fechar**

```vue
<!-- Em src/components/ledger/NovoLancamentoWizard.vue -->
<!-- Adicionar logo após a abertura da div principal -->
<button 
  @click="emit('cancelar')"
  class="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all z-10"
  aria-label="Fechar"
>
  <X class="w-6 h-6" />
</button>
```

- [ ] **Step 4: Commit**

```bash
git add src/components/ledger/NovoLancamentoWizard.vue
git commit -m "feat: add close button to NovoLancamentoWizard"
```

---

### Task 2: Verificar Tratamento de Evento em App.vue

**Files:**
- Modify: `src/App.vue`

- [ ] **Step 1: Garantir que @cancelar está sendo ouvido**
Verificar se o componente `NovoLancamentoWizard` em `App.vue` possui o listener `@cancelar`.

```vue
<!-- Em src/App.vue -->
<NovoLancamentoWizard 
  v-else-if="currentView === 'wizard'"
  :membros="membros"
  @salvar="handleSalvarTransacao"
  @cancelar="currentView = 'dashboard'"
/>
```

- [ ] **Step 2: Commit (se necessário)**

```bash
git commit -m "fix: ensure wizard cancel event is handled"
```

---

### Task 3: Verificação Final

- [ ] **Step 1: Testar cancelamento no Passo 1**
- [ ] **Step 2: Testar cancelamento no Passo 2**
- [ ] **Step 3: Testar cancelamento no Passo 3**
- [ ] **Step 4: Verificar se o rascunho é mantido ao fechar e reabrir**
