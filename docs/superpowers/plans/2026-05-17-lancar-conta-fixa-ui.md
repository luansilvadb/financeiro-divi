# Lançar Conta Fixa UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesenhar `PopupLancarContaFixa.vue` como um bottomsheet rapido e utilitario alinhado ao `DESIGN.md`.

**Architecture:** A mudanca fica isolada em `PopupLancarContaFixa.vue`, preservando props, emits e payload `confirm`. Um teste de componente valida a estrutura visual e os eventos principais.

**Tech Stack:** Vue 3, TypeScript, Vitest, Vue Test Utils, Tailwind v4.

---

### Task 1: Contrato do bottomsheet de lançamento

**Files:**
- Create: `src/components/ledger/PopupLancarContaFixa.test.ts`
- Modify: `src/components/ledger/PopupLancarContaFixa.vue`

- [ ] **Step 1: Write the failing test**

Criar teste que monta o popup visivel com uma conta fixa, valida os textos `Valor do talao`, `Quem pagou?`, `Dividir com quem?`, `Resumo da divisao`, o botao `Lancar conta`, e confirma que o evento `confirm` continua emitindo `{ valorReal, compradorId, splitIds }`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/ledger/PopupLancarContaFixa.test.ts`

Expected: FAIL porque o popup atual ainda nao contem a nova estrutura utilitaria.

- [ ] **Step 3: Implement the compact UI**

Atualizar somente o template/classes de `PopupLancarContaFixa.vue`, mantendo script e funcoes atuais. Usar superficies brancas/creme, raio `10px`, borda inset, pills claras e CTA escuro.

- [ ] **Step 4: Run focused test**

Run: `npx vitest run src/components/ledger/PopupLancarContaFixa.test.ts`

Expected: PASS.

- [ ] **Step 5: Run build**

Run: `npm run build`

Expected: exit code 0.
