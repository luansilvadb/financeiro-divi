# Card Utilitario de Contas Fixas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesenhar `ContasFixasPanel.vue` como um card limpo e utilitario alinhado ao `DESIGN.md`.

**Architecture:** A mudanca fica isolada em `ContasFixasPanel.vue`, preservando props e emits. Um teste de renderizacao em `ContasFixasPanel.test.ts` valida a estrutura visual esperada e os eventos principais.

**Tech Stack:** Vue 3, TypeScript, Vitest, Vue Test Utils, Tailwind v4.

---

### Task 1: Teste de contrato visual

**Files:**
- Create: `src/components/ledger/ContasFixasPanel.test.ts`

- [ ] **Step 1: Write the failing test**

Criar um teste que monta o componente com uma conta paga e uma pendente, verificando que o container usa a classe de card utilitario, que remove `glass-card`, e que as acoes continuam emitindo eventos.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/ledger/ContasFixasPanel.test.ts`

Expected: FAIL porque o componente atual ainda usa o visual antigo.

### Task 2: Implementar card utilitario

**Files:**
- Modify: `src/components/ledger/ContasFixasPanel.vue`

- [ ] **Step 1: Update markup classes**

Substituir o wrapper, header, linhas, estado vazio, botoes e CTA de adicionar por classes alinhadas ao `DESIGN.md`.

- [ ] **Step 2: Run focused test**

Run: `npx vitest run src/components/ledger/ContasFixasPanel.test.ts`

Expected: PASS.

- [ ] **Step 3: Run build**

Run: `npm run build`

Expected: exit code 0.
