# Wizard Conversacional Premium Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the "Intenção Premium" Wizard flow, featuring mandatory division choice and real-time calculation grid.

**Architecture:** Refactor `NovoLancamentoWizard.vue` to follow the 5-step premium flow. Implement a dynamic grid selection with live feedback.

**Tech Stack:** Vue 3, Lucide Icons, Tailwind CSS, Dinheiro Primitive.

---

### Task 1: Foundation & Step 1-3

**Files:**
- Modify: `src/components/ledger/NovoLancamentoWizard.vue`

- [ ] **Step 1: Setup State for Intent Flow**
Add `intencao` ('solo' | 'split') and ensure `membros` contains real names.

- [ ] **Step 2: Refactor Steps 1, 2, 3**
Implement the premium styling and questions for Type, Value, and Description.

- [ ] **Step 3: Commit**
`git add src/components/ledger/NovoLancamentoWizard.vue && git commit -m "feat(wizard): implement steps 1-3 with premium styling"`

---

### Task 2: Step 4 - Intent & Grid Selection

**Files:**
- Modify: `src/components/ledger/NovoLancamentoWizard.vue`

- [ ] **Step 1: Implement Intent Cards**
Create the "Só meu" and "Dividir com a galera" cards with large icons and descriptions.

- [ ] **Step 2: Implement the Selection Grid**
Create the expandable grid of avatars. Add "Select All" functionality.

- [ ] **Step 3: Implement Live Calculator**
Add the logic to show "R$ per person" updating as avatars are toggled.

- [ ] **Step 4: Commit**
`git add src/components/ledger/NovoLancamentoWizard.vue && git commit -m "feat(wizard): implement premium intent and grid selection"`

---

### Task 3: Step 5 - Payer Selection

**Files:**
- Modify: `src/components/ledger/NovoLancamentoWizard.vue`

- [ ] **Step 1: Implement Step 5 UI**
If "Dividir" was chosen, show a simple list/grid to select "Quem passou o cartão?" among the selected participants. Default to the current user.

- [ ] **Step 2: Commit**
`git add src/components/ledger/NovoLancamentoWizard.vue && git commit -m "feat(wizard): implement step 5 for payer selection"`

---

### Task 4: Finalization Logic & Persistence

**Files:**
- Modify: `src/components/ledger/NovoLancamentoWizard.vue`

- [ ] **Step 1: Update `finalizar` logic**
Map the chosen intent and payer to the domain transaction. If "Solo", participant is only the user. If "Split", participants are the selected ones.

- [ ] **Step 2: Ensure Auto-save works**
Update the persistence watch to include `intencao` and `responsabilidade`.

- [ ] **Step 3: Commit**
`git add src/components/ledger/NovoLancamentoWizard.vue && git commit -m "feat(wizard): complete finalization logic for premium flow"`

---

### Task 5: Verification

- [ ] **Step 1: Run Build**
`npx vue-tsc --noEmit`

- [ ] **Step 2: Manual Check**
Verify the calculation accuracy and the "Safety Net" warning when only 1 person is selected in split mode.
