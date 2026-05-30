# Implementar FAB para Novo Lançamento Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir o botão "Novo" estático no Dashboard por um Floating Action Button (FAB) fixo no canto inferior direito para melhor acessibilidade.

**Architecture:** Mover a responsabilidade do botão principal de ação para o componente `App.vue`, garantindo visibilidade global no Dashboard e posicionamento fixo.

**Tech Stack:** Vue 3 (Composition API), Lucide Vue Next, Tailwind CSS.

---

### Task 1: Remover botão antigo do DashboardSaldos

**Files:**
- Modify: `src/components/ledger/DashboardSaldos.vue`

- [ ] **Step 1: Remover o botão do template**

```vue
<!-- Em src/components/ledger/DashboardSaldos.vue -->
<!-- Localizar e remover as linhas 104-110 -->
<h2 class="text-2xl font-bold text-gray-800">Saldos</h2>
- <button 
-   @click="emit('novo-lancamento')"
-   class="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-full font-medium hover:bg-blue-700 transition shadow-sm"
- >
-   <PlusCircle class="w-5 h-5" />
-   Novo
- </button>
```

- [ ] **Step 2: Verificar se PlusCircle ainda é necessário**
Se o `PlusCircle` não for mais usado no `DashboardSaldos.vue`, remover o import na linha 3.

- [ ] **Step 3: Commit**

```bash
git add src/components/ledger/DashboardSaldos.vue
git commit -m "refactor: remove old Novo button from DashboardSaldos"
```

---

### Task 2: Implementar o FAB em App.vue

**Files:**
- Modify: `src/App.vue`

- [ ] **Step 1: Importar PlusCircle**

```typescript
// Em src/App.vue (script setup)
import { PlusCircle } from 'lucide-vue-next'
```

- [ ] **Step 2: Adicionar o FAB ao template**

```vue
<!-- Em src/App.vue -->
<!-- Adicionar antes do fechamento da tag </main> ou </div> principal -->
<button 
  v-if="currentView === 'dashboard'"
  @click="currentView = 'wizard'"
  class="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 active:scale-95 transition-all z-50"
  aria-label="Novo lançamento"
>
  <PlusCircle class="w-8 h-8" />
</button>
```

- [ ] **Step 3: Adicionar padding inferior ao container principal**
Isso garante que o conteúdo não fique escondido sob o FAB ao rolar.

```vue
<!-- Em src/App.vue -->
<!-- Modificar a classe do container principal ou do main -->
<main class="pb-24"> <!-- Adicionado pb-24 -->
```

- [ ] **Step 4: Commit**

```bash
git add src/App.vue
git commit -m "feat: add Floating Action Button (FAB) for new transactions"
```

---

### Task 3: Verificação Final

- [ ] **Step 1: Validar visualmente**
Abrir o app e verificar se o botão azul circular aparece no canto inferior direito apenas no Dashboard.

- [ ] **Step 2: Validar funcionalidade**
Clicar no FAB e garantir que o Wizard de Novo Lançamento abre corretamente.

- [ ] **Step 3: Verificar rolagem**
Rolar a lista de saldos e atividades e garantir que o último item é visível acima do FAB.
