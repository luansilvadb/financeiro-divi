# Novo Lançamento Wizard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the 3-step Wizard for adding new expenses, ensuring low friction and precise ledger logic.

**Architecture:** Component-based UI in Vue 3, integrating with the Ledger core domain.

**Tech Stack:** Vue 3, TypeScript, Tailwind CSS, Lucide Icons.

---

### Task 1: Component Scaffold and Step 1

**Files:**
- Create: `src/components/ledger/NovoLancamentoWizard.vue`
- Modify: `src/App.vue`

- [ ] **Step 1: Create basic wizard structure**
Create `src/components/ledger/NovoLancamentoWizard.vue` with state for `step`, `valor`, and `descricao`.

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { Dinheiro } from '../../shared/primitives/Dinheiro'

const step = ref(1)
const valor = ref(0)
const descricao = ref('')

const nextStep = () => step.value++
const prevStep = () => step.value--
</script>

<template>
  <div class="max-w-md mx-auto p-6 bg-white rounded-xl shadow-md">
    <div v-if="step === 1">
      <h2 class="text-xl font-bold mb-4">Quanto e O Quê?</h2>
      <input 
        v-model.number="valor" 
        type="number" 
        placeholder="0,00" 
        class="w-full text-4xl font-mono text-center mb-4 border-b-2 border-blue-500 focus:outline-none"
      />
      <input 
        v-model="descricao" 
        type="text" 
        placeholder="Descrição (ex: Pizza)" 
        class="w-full p-2 mb-6 border rounded"
      />
      <button 
        @click="nextStep" 
        class="w-full bg-blue-600 text-white p-3 rounded-lg font-bold"
      >
        Próximo
      </button>
    </div>
  </div>
</template>
```

- [ ] **Step 2: Update App.vue to show the wizard**
```vue
<script setup lang="ts">
import NovoLancamentoWizard from './components/ledger/NovoLancamentoWizard.vue'
</script>

<template>
  <div class="min-h-screen bg-gray-100 py-10">
    <NovoLancamentoWizard />
  </div>
</template>
```

- [ ] **Step 3: Commit**
`git add src/components/ledger/NovoLancamentoWizard.vue src/App.vue && git commit -m "feat: add step 1 of novo lancamento wizard"`

---

### Task 2: Step 2 - Fonte and Pagador (Toggle Logic)

**Files:**
- Modify: `src/components/ledger/NovoLancamentoWizard.vue`

- [ ] **Step 1: Add state for Fonte and Pagador**
Add `fonte_id`, `pagador_id`, and `pagueiPorOutro` (boolean).

- [ ] **Step 2: Implement Step 2 UI**
```vue
<!-- Inside template, add v-else-if="step === 2" -->
<div v-else-if="step === 2">
  <h2 class="text-xl font-bold mb-4">Quem e Como?</h2>
  
  <label class="block text-sm font-medium text-gray-700 mb-2">De onde saiu o dinheiro?</label>
  <div class="grid grid-cols-2 gap-2 mb-6">
    <button class="p-2 border rounded bg-blue-50 border-blue-500">Meu Cartão</button>
    <button class="p-2 border rounded">Dinheiro Vivo</button>
  </div>

  <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-6">
    <span>Paguei por outra pessoa?</span>
    <input v-model="pagueiPorOutro" type="checkbox" class="w-6 h-6" />
  </div>

  <div v-if="pagueiPorOutro" class="mb-6 animate-fade-in">
    <label class="block text-sm font-medium text-gray-700 mb-2">Quem é o dono da dívida?</label>
    <select class="w-full p-2 border rounded">
      <option>Colega X</option>
      <option>O Grupo</option>
    </select>
  </div>

  <div class="flex gap-2">
    <button @click="prevStep" class="flex-1 border p-3 rounded-lg">Voltar</button>
    <button @click="nextStep" class="flex-1 bg-blue-600 text-white p-3 rounded-lg font-bold">Próximo</button>
  </div>
</div>
```

- [x] **Step 3: Commit**
`git add src/components/ledger/NovoLancamentoWizard.vue && git commit -m "feat: add step 2 with toggle logic"`

---

### Task 3: Step 3 - Divisão and Finalize

**Files:**
- Modify: `src/components/ledger/NovoLancamentoWizard.vue`

- [x] **Step 1: Implement Step 3 UI (Equal Split)**
Add simple multi-select for beneficiaries and a "Salvar" button that logs the data.

- [x] **Step 2: Commit**
`git add src/components/ledger/NovoLancamentoWizard.vue && git commit -m "feat: add step 3 and finalize wizard"`
