# Wizard Utilitario Family Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesenhar `NovoLancamentoWizard.vue` para uma UI utilitaria alinhada ao `DESIGN.md`.

**Architecture:** A mudanca fica isolada em `NovoLancamentoWizard.vue` e no teste de componente. O script e o composable permanecem com o mesmo contrato; o trabalho troca marcação/classes para uma superficie Family mais limpa.

**Tech Stack:** Vue 3, TypeScript, Vitest, Vue Test Utils, Tailwind v4.

---

### Task 1: Contrato visual do wizard utilitario

**Files:**
- Modify: `src/components/ledger/NovoLancamentoWizard.test.ts`
- Modify: `src/components/ledger/NovoLancamentoWizard.vue`

- [ ] **Step 1: Write the failing test**

Adicionar teste que monta o wizard, encontra `[data-testid="novo-lancamento-wizard"]`, valida a classe `wizard-family`, texto `Passo 1 de 5`, e a ausencia da classe de wrapper pesado `shadow-subtle`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/ledger/NovoLancamentoWizard.test.ts`

Expected: FAIL porque o wizard atual ainda usa wrapper `Card` com `shadow-subtle`.

- [ ] **Step 3: Implement utility Family UI**

Atualizar template/classes em `NovoLancamentoWizard.vue`, preservando script e handlers. Remover `Card` do root, usar superficie branca, header compacto, paineis creme, botoes pill claros/escuros e data-testid no root.

- [ ] **Step 4: Run focused test**

Run: `npx vitest run src/components/ledger/NovoLancamentoWizard.test.ts`

Expected: PASS.

- [ ] **Step 5: Run build**

Run: `npm run build`

Expected: exit code 0.
