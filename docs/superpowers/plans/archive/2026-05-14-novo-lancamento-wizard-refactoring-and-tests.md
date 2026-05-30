# Novo Lancamento Wizard Refactoring and Tests Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract UI components from the main wizard and expand test coverage to ensure logical correctness.

**Architecture:** Split `NovoLancamentoWizard.vue` into smaller functional components: `WizardProgressBar.vue` and `WizardFooter.vue`. Enhance `NovoLancamentoWizard.test.ts` with behavioral tests using Vitest and Vue Test Utils.

**Tech Stack:** Vue 3 (Composition API), TypeScript, Vitest, Vue Test Utils.

---

### Task 1: Extract WizardProgressBar

**Files:**
- Create: `src/components/ledger/WizardProgressBar.vue`
- Modify: `src/components/ledger/NovoLancamentoWizard.vue`

- [ ] **Step 1: Create WizardProgressBar.vue**

```vue
<script setup lang="ts">
defineProps<{
  currentStep: number;
  totalSteps: number;
}>();
</script>

<template>
  <div>
    <div class="w-full h-1 bg-gray-100 mb-6 overflow-hidden rounded-full">
      <div 
        class="h-full bg-blue-500 transition-all duration-500 ease-out"
        :style="{ width: `${(currentStep / totalSteps) * 100}%` }"
      ></div>
    </div>
    <div class="text-[10px] uppercase font-bold text-gray-400 mb-4 text-center">
      Passo {{ currentStep }} de {{ totalSteps }}
    </div>
  </div>
</template>
```

- [ ] **Step 2: Update NovoLancamentoWizard.vue to use WizardProgressBar**

```vue
<script setup lang="ts">
// ... existing imports
import WizardProgressBar from './WizardProgressBar.vue'
// ...
</script>

<template>
  <div class="max-w-md mx-auto p-6 bg-white rounded-xl shadow-md pb-24 md:pb-6">
    <WizardProgressBar :current-step="step" :total-steps="totalSteps" />
    <!-- ... -->
  </div>
</template>
```

- [ ] **Step 3: Commit**

```bash
git add src/components/ledger/WizardProgressBar.vue src/components/ledger/NovoLancamentoWizard.vue
git commit -m "refactor: extract WizardProgressBar component"
```

### Task 2: Extract WizardFooter

**Files:**
- Create: `src/components/ledger/WizardFooter.vue`
- Modify: `src/components/ledger/NovoLancamentoWizard.vue`

- [ ] **Step 1: Create WizardFooter.vue**

```vue
<script setup lang="ts">
defineProps<{
  step: number;
  totalSteps: number;
  canAdvance: boolean;
}>();

defineEmits(['next', 'prev', 'finish']);
</script>

<template>
  <div class="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-gray-100 flex gap-3 md:relative md:bg-transparent md:border-none md:p-0 md:mt-8">
    <button v-if="step > 1" @click="$emit('prev')" class="flex-1 px-6 py-4 bg-gray-50 text-gray-500 font-bold rounded-2xl">
      Voltar
    </button>
    <button 
      v-if="step < totalSteps" 
      @click="$emit('next')" 
      :disabled="!canAdvance"
      class="flex-1 px-6 py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-200 disabled:opacity-50"
    >
      Próximo
    </button>
    <button 
      v-else 
      @click="$emit('finish')" 
      class="flex-1 px-6 py-4 bg-green-600 text-white font-bold rounded-2xl shadow-lg shadow-green-200"
    >
      Salvar
    </button>
  </div>
</template>
```

- [ ] **Step 2: Update NovoLancamentoWizard.vue to use WizardFooter**

```vue
<script setup lang="ts">
// ... imports
import WizardFooter from './WizardFooter.vue'
// ...
</script>

<template>
  <div class="max-w-md mx-auto p-6 bg-white rounded-xl shadow-md pb-24 md:pb-6">
    <!-- ... -->
    <WizardFooter 
      :step="step" 
      :total-steps="totalSteps" 
      :can-advance="canAdvance"
      @next="nextStep"
      @prev="prevStep"
      @finish="finalizar"
    />
  </div>
</template>
```

- [ ] **Step 3: Commit**

```bash
git add src/components/ledger/WizardFooter.vue src/components/ledger/NovoLancamentoWizard.vue
git commit -m "refactor: extract WizardFooter component"
```

### Task 3: Expand Tests for NovoLancamentoWizard

**Files:**
- Modify: `src/components/ledger/NovoLancamentoWizard.test.ts`

- [ ] **Step 1: Write expanded tests**

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import NovoLancamentoWizard from './NovoLancamentoWizard.vue'

describe('NovoLancamentoWizard', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('deve avançar do passo 1 para o 2 ao clicar em Gasto', async () => {
    const wrapper = mount(NovoLancamentoWizard)
    const btnGasto = wrapper.findAll('button').find(b => b.text().includes('Um gasto'))
    await btnGasto?.trigger('click')
    
    expect(wrapper.text()).toContain('Passo 2 de 3')
  })

  it('deve desabilitar o botão próximo no passo 2 se valor ou descrição estiverem vazios', async () => {
    const wrapper = mount(NovoLancamentoWizard)
    // Ir para passo 2
    const btnGasto = wrapper.findAll('button').find(b => b.text().includes('Um gasto'))
    await btnGasto?.trigger('click')
    
    const nextBtn = wrapper.find('button.bg-blue-600')
    expect(nextBtn.attributes('disabled')).toBeDefined()
    
    await wrapper.find('input[type="number"]').setValue(100)
    expect(nextBtn.attributes('disabled')).toBeDefined()
    
    await wrapper.find('input[type="text"]').setValue('Almoço')
    expect(nextBtn.attributes('disabled')).toBeUndefined()
  })

  it('deve emitir o evento salvar com a transação correta ao finalizar', async () => {
    const wrapper = mount(NovoLancamentoWizard)
    
    // Passo 1 -> Passo 2
    await wrapper.findAll('button').find(b => b.text().includes('Um gasto'))?.trigger('click')
    
    // Passo 2 -> Passo 3
    await wrapper.find('input[type="number"]').setValue(100)
    await wrapper.find('input[type="text"]').setValue('Almoço')
    await wrapper.find('button.bg-blue-600').trigger('click')
    
    // Passo 3 -> Finalizar
    await wrapper.find('button.bg-green-600').trigger('click')
    
    expect(wrapper.emitted('salvar')).toBeTruthy()
    const transacao = wrapper.emitted('salvar')![0][0]
    expect(transacao.descricao).toBe('Almoço')
    expect(transacao.total.centavos).toBe(10000)
    expect(transacao.divisoes).toHaveLength(1)
    expect(transacao.divisoes[0].membro_id).toBe('eu')
  })
})
```

- [ ] **Step 2: Run tests to verify they pass**

Run: `npm test src/components/ledger/NovoLancamentoWizard.test.ts`

- [ ] **Step 3: Commit**

```bash
git add src/components/ledger/NovoLancamentoWizard.test.ts
git commit -m "test: expand NovoLancamentoWizard test coverage"
```

### Task 4: Clean up LocalStorage logic (Optional Refinement)

**Files:**
- Modify: `src/components/ledger/NovoLancamentoWizard.vue`

- [ ] **Step 1: Simplify localStorage restoration**

```typescript
// Refactor the onMounted logic to be more concise if possible
```

- [ ] **Step 2: Run tests**

- [ ] **Step 3: Commit**
