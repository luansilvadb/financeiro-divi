# Refatoração NovoLancamentoWizard para Composable Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Centralizar toda a lógica e estado do wizard no composable `useNovoLancamentoWizard` e simplificar o componente Vue.

**Architecture:** Mover lógica de validação (`canAdvance`), cálculos de saldo (`restantePagamento`), e manipulação de estado (`toggleBeneficiario`, `reset`) para o composable. O componente deve apenas consumir esse estado e passar para os sub-componentes.

**Tech Stack:** Vue 3 Composition API, TypeScript, Vitest.

---

### Task 1: Enriquecer `useNovoLancamentoWizard`

**Files:**
- Modify: `src/modules/ledger/composables/useNovoLancamentoWizard.ts`

- [ ] **Step 1: Adicionar estado de `intencao` e computados de saldo**
Mover a lógica de `intencao`, `somaPagamentos`, `restantePagamento` e `pagamentosEquilibrados` para o composable.

- [ ] **Step 2: Adicionar `canAdvance`, `toggleBeneficiario` e `reset`**
Implementar a lógica de validação de passos e a função de reset.

- [ ] **Step 3: Ajustar `finalizar`**
Garantir que o `finalizar` retorne a transação e limpe o estado local (chamando o `reset`).

### Task 2: Simplificar `NovoLancamentoWizard.vue`

**Files:**
- Modify: `src/components/ledger/NovoLancamentoWizard.vue`

- [ ] **Step 1: Substituir estado local pelo composable**
Remover refs e watchers duplicados e usar `useNovoLancamentoWizard(props.membros)`.

- [ ] **Step 2: Atualizar template**
Garantir que as propriedades passadas para os sub-componentes venham do composable.

### Task 3: Verificação e Testes

**Files:**
- Test: `src/components/ledger/NovoLancamentoWizard.test.ts`

- [ ] **Step 1: Executar testes existentes**
Run: `npx vitest src/components/ledger/NovoLancamentoWizard.test.ts`
Expected: PASS

- [ ] **Step 2: Commit**
```bash
git add src/components/ledger/NovoLancamentoWizard.vue src/modules/ledger/composables/useNovoLancamentoWizard.ts
git commit -m "refactor(ui): simplificar NovoLancamentoWizard usando composable e sub-componentes"
```
