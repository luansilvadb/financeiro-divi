# Finalize Closed Month Behavior Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove rigid locks that prevent users from making retroactive entries or settling debts in closed months.

**Architecture:** Remove UI interaction blockers in Vue components and validation blocks in the viewmodel that check for `isMonthClosed` or `faturaSelecionadaFechada`. This embraces the flexible, ledger-like approach where retroactive changes are allowed.

**Tech Stack:** Vue 3, TypeScript, Vitest

---

### Task 1: Remove locks in ContasFixasCard

**Files:**
- Modify: `D:\projetos\divi\src\views\components\ledger\ContasFixasCard.vue`

- [ ] **Step 1: Remove early returns from pointer events**

Remove `if (props.isMonthClosed) return` from `onPointerDown` and `onPointerUp`.

- [ ] **Step 2: Remove disabled visual state from template**

Update the dynamic class in the template.
Replace:
```vue
      props.isMonthClosed ? 'opacity-60 grayscale-[0.3] cursor-not-allowed' : 'cursor-pointer hover:border-ember/30'
```
With:
```vue
      'cursor-pointer hover:border-ember/30'
```

- [ ] **Step 3: Commit**

```bash
git add src/views/components/ledger/ContasFixasCard.vue
git commit -m "refactor(ui): allow interactions on closed month bills"
```

### Task 2: Remove locks in useDashboardViewModel

**Files:**
- Modify: `D:\projetos\divi\src\viewmodels\useDashboardViewModel.ts`

- [ ] **Step 1: Remove lock from confirmarAjusteGasto**

Remove this block:
```typescript
    if (periodos.faturaSelecionadaFechada.value) {
      toast.show('Não é possível ajustar gastos em um mês encerrado. Reabra o mês para editar.', 'error')
      return
    }
```

- [ ] **Step 2: Remove lock from confirmarBaixaNetting**

Remove this block:
```typescript
    if (periodos.faturaSelecionadaFechada.value) {
      toast.show('Não é possível registrar acertos em um mês encerrado.', 'error')
      return
    }
```

- [ ] **Step 3: Remove lock from confirmarLancarBill**

Remove this block:
```typescript
    if (periodos.faturaSelecionadaFechada.value) {
      toast.show('Não é possível lançar contas fixas em um mês encerrado. Reabra o mês para operar.', 'error')
      return
    }
```

- [ ] **Step 4: Remove lock from excluirGasto**

Remove this block:
```typescript
      if (periodos.faturaSelecionadaFechada.value) {
        toast.show('Não é possível estornar gastos em um mês encerrado. Reabra o mês para operar.', 'error')
        return
      }
```

- [ ] **Step 5: Commit**

```bash
git add src/viewmodels/useDashboardViewModel.ts
git commit -m "refactor(domain): remove rigid validation locks for closed month operations"
```

### Task 3: Verify and fix tests

**Files:**
- Test: `D:\projetos\divi\src\views\components\ledger\ContasFixasPanel.test.ts`
- Test: `D:\projetos\divi\src\views\screens\DashboardSaldos.test.ts`

- [ ] **Step 1: Run tests to ensure changes fixed failures**

Run: `npx vitest run src/views/components/ledger/ContasFixasPanel.test.ts src/views/screens/DashboardSaldos.test.ts`
Expected: PASS

- [ ] **Step 2: Run all tests to ensure no regressions**

Run: `npx vitest run`
Expected: All tests pass.

- [ ] **Step 3: Build the application**

Run: `npm run build`
Expected: Successful build.
