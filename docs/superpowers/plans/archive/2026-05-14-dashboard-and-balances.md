# Dashboard and Balance Calculation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the balance calculation logic (netting) and the Dashboard UI with Activity Feed and Audit Drilldown.

**Architecture:** Business logic in Core (Use Cases/Services), UI in Vue components.

**Tech Stack:** Vue 3, TypeScript, Tailwind CSS, Lucide Icons, Vitest.

---

### Task 1: Balance Calculation Service

**Files:**
- Create: `src/modules/ledger/core/services/CalculadoraSaldos.ts`
- Test: `src/modules/ledger/core/services/CalculadoraSaldos.test.ts`

- [x] **Step 1: Implement CalculadoraSaldos**
Create a class that takes a list of `Transacao` and returns a map of `membro_id -> saldo_liquido`.
- Credit (+): If member is `origem_id`.
- Debit (-): If member is in `divisoes`.

- [x] **Step 2: Write tests for complex scenarios**
Include cases with "Payer vs Source" to ensure logic is correct.

- [x] **Step 3: Commit**
`git add src/modules/ledger && git commit -m "feat(ledger): add balance calculation service"`

---

### Task 2: Dashboard Component - Summary & Netting

**Files:**
- Create: `src/components/ledger/DashboardSaldos.vue`
- Modify: `src/App.vue`

- [x] **Step 1: Implement DashboardSaldos UI**
Show the net balance for each member. Display suggested transfers (Netting) to zero out the house.

- [x] **Step 2: Integrate with App.vue**
Allow switching between the Dashboard and the New Expense Wizard.

- [x] **Step 3: Commit**
`git add src && git commit -m "feat: add dashboard summary with netting logic"`

---

### Task 3: Activity Feed and Audit Drilldown

**Files:**
- Modify: `src/components/ledger/DashboardSaldos.vue`
- Create: `src/components/ledger/ActivityFeed.vue`

- [x] **Step 1: Implement ActivityFeed**
A chronological list of transactions.

- [x] **Step 2: Implement Audit Drilldown**
When clicking a balance card, show a modal/overlay with the list of specific credits and debits for that member.

- [x] **Step 3: Commit**
`git add src && git commit -m "feat: add activity feed and audit drilldown to dashboard"`
