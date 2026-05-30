# Plano de Implementação de Bottomsheets Não Modais

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrar todos os modais da aplicação para bottomsheets não modais e flutuantes para otimizar a experiência mobile-first e a visibilidade de dados em tempo real.

**Architecture:** Criação de um componente reutilizável `NonModalBottomSheet.vue` que se posiciona de forma fixa na parte inferior da tela (`bottom-0 left-0 right-0`) no mobile com cantos superiores arredondados e, no desktop, é docado elegantemente no canto inferior direito (`md:bottom-8 md:right-8 md:w-[480px] md:rounded-cards`) de forma flutuante e sem backdrop bloqueante. Todos os modais existentes serão refatorados para utilizar esse componente.

**Tech Stack:** Vue 3 (Composition API), TypeScript, TailwindCSS v4, Vitest, Lucide Vue Next

---

### Task 1: Componente Reutilizável `NonModalBottomSheet`

**Files:**
- Create: `src/components/ui/NonModalBottomSheet.vue`
- Test: `src/components/ui/NonModalBottomSheet.test.ts`

- [ ] **Step 1: Escrever teste unitário falho para o componente**

Crie o arquivo de teste `src/components/ui/NonModalBottomSheet.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import NonModalBottomSheet from './NonModalBottomSheet.vue'

describe('NonModalBottomSheet', () => {
  it('deve renderizar o conteudo do slot quando visible for true', () => {
    const wrapper = mount(NonModalBottomSheet, {
      props: { visible: true },
      slots: {
        default: '<div id="test-content">Conteudo de Teste</div>'
      }
    })
    expect(wrapper.find('#test-content').exists()).toBe(true)
    expect(wrapper.text()).toContain('Conteudo de Teste')
  })

  it('nao deve renderizar o conteudo quando visible for false', () => {
    const wrapper = mount(NonModalBottomSheet, {
      props: { visible: false },
      slots: {
        default: '<div>Conteudo</div>'
      }
    })
    expect(wrapper.find('div').exists()).toBe(false)
  })
})
```

- [ ] **Step 2: Executar o teste para verificar que falha**

Run: `npx vitest run src/components/ui/NonModalBottomSheet.test.ts`
Expected: FAIL (Componente não definido/não encontrado)

- [ ] **Step 3: Criar o componente `NonModalBottomSheet`**

Crie o arquivo `src/components/ui/NonModalBottomSheet.vue`:
```vue
<script setup lang="ts">
// Componente reutilizável de BottomSheet Não Modal
interface Props {
  visible: boolean
  widthClass?: string // default: md:w-[480px]
  maxHeightClass?: string // default: max-h-[85vh]
}

withDefaults(defineProps<Props>(), {
  widthClass: 'md:w-[480px]',
  maxHeightClass: 'max-h-[85vh]'
})
</script>

<template>
  <transition
    enter-active-class="transition duration-300 ease-out"
    enter-from-class="opacity-0 translate-y-full md:translate-y-4 md:scale-95"
    enter-to-class="opacity-100 translate-y-0 md:scale-100"
    leave-active-class="transition duration-200 ease-in"
    leave-from-class="opacity-100 translate-y-0 md:scale-100"
    leave-to-class="opacity-0 translate-y-full md:translate-y-4 md:scale-95"
  >
    <div 
      v-if="visible" 
      class="fixed bottom-0 left-0 right-0 md:left-auto md:right-8 md:bottom-8 z-[9999] p-0 pointer-events-auto"
    >
      <!-- Container do BottomSheet Não Modal -->
      <div 
        class="w-full overflow-hidden bg-card border-t md:border border-stone-surface rounded-t-cardsLarge md:rounded-cards shadow-2xl flex flex-col text-graphite"
        :class="[widthClass, maxHeightClass]"
      >
        <!-- Grabber para deslizar no Mobile -->
        <div class="md:hidden w-12 h-1 bg-stone-surface rounded-full mx-auto my-3 shrink-0"></div>
        
        <slot />
      </div>
    </div>
  </transition>
</template>
```

- [ ] **Step 4: Executar o teste para verificar que passa**

Run: `npx vitest run src/components/ui/NonModalBottomSheet.test.ts`
Expected: PASS

- [ ] **Step 5: Fazer o commit**

```bash
git add src/components/ui/NonModalBottomSheet.vue src/components/ui/NonModalBottomSheet.test.ts
git commit -m "feat: add NonModalBottomSheet reusable component"
```

---

### Task 2: Refatorar o Wizard de Novo Lançamento em `src/App.vue`

**Files:**
- Modify: `src/App.vue`
- Test: `src/components/ledger/NovoLancamentoWizard.test.ts`

- [ ] **Step 1: Atualizar os testes ou verificar a estrutura existente**

Abra `src/components/ledger/NovoLancamentoWizard.test.ts` e certifique-se de que os testes rodam normalmente.

- [ ] **Step 2: Executar testes para validar o estado inicial**

Run: `npx vitest run src/components/ledger/NovoLancamentoWizard.test.ts`
Expected: PASS

- [ ] **Step 3: Modificar `src/App.vue` para usar `NonModalBottomSheet`**

Edite `src/App.vue`. 
Adicione o import do componente nas primeiras linhas:
```typescript
import NonModalBottomSheet from './components/ui/NonModalBottomSheet.vue'
```

Substitua o bloco de template antigo do overlay (linhas 183 a 201):
```vue
    <!-- Overlay do Wizard de Novo Lançamento: Bottom-sheet no Mobile, Modal no Desktop -->
    <div 
      v-if="currentView === 'wizard'"
      class="fixed inset-0 bg-midnight/80 backdrop-blur-sm flex justify-center sm:items-center items-end z-[9999] sm:p-6 p-0 animate-in fade-in duration-200"
    >
      <div 
        class="w-full sm:max-w-xl overflow-hidden bg-card border-t sm:border border-stone-surface rounded-t-cardsLarge sm:rounded-cardsLarge shadow-lg flex flex-col max-h-[95vh] text-graphite animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-250"
      >
        <!-- Pull-to-dismiss handle (mobile-only grabber bar) -->
        <div class="sm:hidden w-12 h-1 bg-stone-surface rounded-full mx-auto my-3 shrink-0"></div>
        
        <div class="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
          <NovoLancamentoWizard 
            :membros="ativos"
            @salvar="handleSalvarTransacao"
            @cancelar="currentView = 'dashboard'"
          />
        </div>
      </div>
    </div>
```

Por:
```vue
    <!-- Bottomsheet Não Modal do Wizard de Novo Lançamento -->
    <NonModalBottomSheet 
      :visible="currentView === 'wizard'"
      width-class="md:w-[560px]"
      max-height-class="max-h-[85vh]"
    >
      <div class="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
        <NovoLancamentoWizard 
          :membros="ativos"
          @salvar="handleSalvarTransacao"
          @cancelar="currentView = 'dashboard'"
        />
      </div>
    </NonModalBottomSheet>
```

- [ ] **Step 4: Executar testes de validação**

Run: `npx vitest run src/components/ledger/NovoLancamentoWizard.test.ts`
Expected: PASS

- [ ] **Step 5: Fazer o commit**

```bash
git add src/App.vue
git commit -m "refactor: migrate wizard overlay to NonModalBottomSheet"
```

---

### Task 3: Refatorar Modais de Contas Fixas

**Files:**
- Modify: `src/components/ledger/ModalConfigurarContaFixa.vue`
- Modify: `src/components/ledger/PopupLancarContaFixa.vue`
- Test: `src/modules/ledger/composables/useContasFixas.test.ts`

- [ ] **Step 1: Validar testes de contas fixas antes da refatoração**

Run: `npx vitest run src/modules/ledger/composables/useContasFixas.test.ts`
Expected: PASS

- [ ] **Step 2: Modificar `src/components/ledger/ModalConfigurarContaFixa.vue`**

Edite o arquivo. Adicione o import:
```typescript
import NonModalBottomSheet from '../ui/NonModalBottomSheet.vue'
```

Substitua as linhas de template que envolvem a div externa e container (linhas 54 a 64 e o fechamento correspondente nas linhas 145 a 148):
```vue
  <NonModalBottomSheet :visible="visible" width-class="md:w-[420px]">
    <div class="p-6 sm:p-8 space-y-6 overflow-y-auto custom-scrollbar flex-grow">
      <h3 class="text-xl font-display text-charcoal flex items-center gap-2 mb-2">
        ⚙️ Configurar Conta Fixa
      </h3>
      <!-- Resto do formulário idêntico -->
      ...
    </div>
  </NonModalBottomSheet>
```

- [ ] **Step 3: Modificar `src/components/ledger/PopupLancarContaFixa.vue`**

Edite o arquivo. Adicione o import:
```typescript
import NonModalBottomSheet from './../ui/NonModalBottomSheet.vue'
```

Substitua a div externa e container (linhas 1 a 3 e o fechamento correspondente nas linhas 70 a 72):
```vue
  <NonModalBottomSheet :visible="visible" width-class="md:w-[420px]">
    <div class="p-8 relative text-charcoal space-y-6 flex flex-col flex-grow">
      <h3 class="text-xl font-display text-charcoal flex items-center gap-2 mb-2">
        <span>{{ bill?.icon }}</span> Lançar {{ bill?.name }}
      </h3>
      <!-- Resto do formulário idêntico -->
      ...
    </div>
  </NonModalBottomSheet>
```

- [ ] **Step 4: Executar testes de validação**

Run: `npx vitest run src/modules/ledger/composables/useContasFixas.test.ts`
Expected: PASS

- [ ] **Step 5: Fazer o commit**

```bash
git add src/components/ledger/ModalConfigurarContaFixa.vue src/components/ledger/PopupLancarContaFixa.vue
git commit -m "refactor: migrate recurring bill modals to NonModalBottomSheet"
```

---

### Task 4: Refatorar o Modal de Ajuste de Gastos (`ModalAjustarGasto.vue`) e Rateio de Gastos (`ModalDivisaoGasto.vue`)

**Files:**
- Modify: `src/components/ledger/ModalAjustarGasto.vue`
- Modify: `src/components/ledger/dashboard/ModalDivisaoGasto.vue`

- [ ] **Step 1: Modificar `src/components/ledger/ModalAjustarGasto.vue`**

Edite o arquivo. Adicione o import:
```typescript
import NonModalBottomSheet from '../ui/NonModalBottomSheet.vue'
```

Substitua a div externa e container (linhas 119 a 129 e o fechamento correspondente nas linhas 247 a 249):
```vue
  <NonModalBottomSheet :visible="props.visible" width-class="md:w-[460px]">
    <div class="p-6 sm:p-8 space-y-6 overflow-y-auto custom-scrollbar flex-grow">
      <!-- Resto do formulário idêntico -->
      ...
    </div>
  </NonModalBottomSheet>
```

- [ ] **Step 2: Modificar `src/components/ledger/dashboard/ModalDivisaoGasto.vue`**

Edite o arquivo. Adicione o import:
```typescript
import NonModalBottomSheet from '../../ui/NonModalBottomSheet.vue'
```

Substitua a div externa e container (linhas 107 a 117 e o fechamento correspondente nas linhas 246 a 248):
```vue
  <NonModalBottomSheet :visible="show && props.gasto !== null" width-class="md:w-[460px]">
    <div class="p-6 sm:p-8 space-y-6 overflow-y-auto custom-scrollbar flex-grow flex flex-col">
      <!-- Resto do formulário idêntico -->
      ...
    </div>
  </NonModalBottomSheet>
```

- [ ] **Step 3: Executar a suite completa de testes para garantir integridade**

Run: `npx vitest run`
Expected: PASS

- [ ] **Step 4: Fazer o commit**

```bash
git add src/components/ledger/ModalAjustarGasto.vue src/components/ledger/dashboard/ModalDivisaoGasto.vue
git commit -m "refactor: migrate transaction edit and split modals to NonModalBottomSheet"
```

---

### Task 5: Refatorar os Modais de Fechamento de Fatura, Acerto e Novo Período

**Files:**
- Modify: `src/components/ledger/dashboard/ModalFecharFatura.vue`
- Modify: `src/components/ledger/dashboard/ModalAcertoCompensacao.vue`
- Modify: `src/components/ledger/DashboardSaldos.vue`
- Test: `src/components/ledger/DashboardSaldos.test.ts`

- [ ] **Step 1: Validar testes do dashboard antes da refatoração**

Run: `npx vitest run src/components/ledger/DashboardSaldos.test.ts`
Expected: PASS

- [ ] **Step 2: Modificar `src/components/ledger/dashboard/ModalFecharFatura.vue`**

Edite o arquivo. Adicione o import:
```typescript
import NonModalBottomSheet from '../../ui/NonModalBottomSheet.vue'
```

Substitua a div externa e container (linhas 38 a 49 e o fechamento correspondente nas linhas 85 a 87):
```vue
  <NonModalBottomSheet :visible="show && props.fatura !== null" width-class="md:w-[440px]">
    <div class="p-6 sm:p-8 space-y-6 overflow-y-auto custom-scrollbar flex-grow">
      <!-- Resto do formulário idêntico -->
      ...
    </div>
  </NonModalBottomSheet>
```

- [ ] **Step 3: Modificar `src/components/ledger/dashboard/ModalAcertoCompensacao.vue`**

Edite o arquivo. Adicione o import:
```typescript
import NonModalBottomSheet from '../../ui/NonModalBottomSheet.vue'
```

Substitua a div externa e container (linhas 45 a 55 e o fechamento correspondente nas linhas 120 a 122):
```vue
  <NonModalBottomSheet :visible="visible" width-class="md:w-[440px]">
    <div class="p-6 sm:p-8 space-y-6 overflow-y-auto custom-scrollbar flex-grow">
      <!-- Resto do formulário idêntico -->
      ...
    </div>
  </NonModalBottomSheet>
```

- [ ] **Step 4: Modificar `src/components/ledger/DashboardSaldos.vue` (para o modal inline Novo Período)**

Edite `src/components/ledger/DashboardSaldos.vue`. Adicione o import:
```typescript
import NonModalBottomSheet from '../ui/NonModalBottomSheet.vue'
```

Substitua o modal inline Novo Período (linhas 868 a 896):
```vue
    <!-- Modal Novo Período (Design System Family) -->
    <div v-if="showModalNovoPeriodo" class="fixed inset-0 bg-midnight/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-6">
      <Card class="w-full max-w-md p-0 overflow-hidden bg-card shadow-lg rounded-cards">
        <div class="p-8 space-y-6">
          <div class="space-y-2 text-center">
            <SectionLabel class="mx-auto">Transição</SectionLabel>
            <h3 class="text-3xl font-display text-charcoal">Novo <span class="text-ember">Período</span></h3>
            <p class="text-xs text-ash leading-relaxed">
              O mês anterior será trancado permanentemente. O saldo será transportado automaticamente para o novo período.
            </p>
          </div>
          
          <div class="space-y-3">
            <label class="block text-[10px] font-bold uppercase text-ash tracking-widest ml-1">Mês de Referência</label>
            <input 
              type="text" 
              v-model="nomeNovoPeriodo" 
              class="w-full px-4 py-3 rounded-xl border border-stone bg-[#fbfaf9] outline-none font-bold text-charcoal focus:border-ember transition-all" 
              placeholder="Ex: Junho 2026"
            />
          </div>

          <div class="grid grid-cols-2 gap-3 pt-2">
            <Button variant="secondary" @click="showModalNovoPeriodo = false">Cancelar</Button>
            <Button variant="primary" @click="confirmarNovoPeriodo" :disabled="!nomeNovoPeriodo.trim()">Confirmar</Button>
          </div>
        </div>
      </Card>
    </div>
```

Por:
```vue
    <!-- Bottomsheet Não Modal Novo Período -->
    <NonModalBottomSheet :visible="showModalNovoPeriodo" width-class="md:w-[420px]">
      <div class="p-8 space-y-6">
        <div class="space-y-2 text-center">
          <SectionLabel class="mx-auto">Transição</SectionLabel>
          <h3 class="text-3xl font-display text-charcoal">Novo <span class="text-ember">Período</span></h3>
          <p class="text-xs text-ash leading-relaxed">
            O mês anterior será trancado permanentemente. O saldo será transportado automaticamente para o novo período.
          </p>
        </div>
        
        <div class="space-y-3">
          <label class="block text-[10px] font-bold uppercase text-ash tracking-widest ml-1">Mês de Referência</label>
          <input 
            type="text" 
            v-model="nomeNovoPeriodo" 
            class="w-full px-4 py-3 rounded-xl border border-stone bg-[#fbfaf9] outline-none font-bold text-charcoal focus:border-ember transition-all" 
            placeholder="Ex: Junho 2026"
          />
        </div>

        <div class="grid grid-cols-2 gap-3 pt-2">
          <Button variant="secondary" @click="showModalNovoPeriodo = false">Cancelar</Button>
          <Button variant="primary" @click="confirmarNovoPeriodo" :disabled="!nomeNovoPeriodo.trim()">Confirmar</Button>
        </div>
      </div>
    </NonModalBottomSheet>
```

- [ ] **Step 5: Executar testes de validação do Dashboard**

Run: `npx vitest run src/components/ledger/DashboardSaldos.test.ts`
Expected: PASS

- [ ] **Step 6: Fazer o commit**

```bash
git add src/components/ledger/dashboard/ModalFecharFatura.vue src/components/ledger/dashboard/ModalAcertoCompensacao.vue src/components/ledger/DashboardSaldos.vue
git commit -m "refactor: migrate settlement, locking, and period transition modals to NonModalBottomSheet"
```
