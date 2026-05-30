# Build Errors Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all 7 TypeScript build errors to allow a successful `npm run build`.

**Architecture:** Surgical fixes to import paths, unused code, and type definitions to satisfy the TypeScript compiler while maintaining runtime behavior.

**Tech Stack:** TypeScript, Vue 3, Vite.

---

### Task 1: Fix WizardDraft import path

**Files:**
- Modify: `src/shared/utils/rascunhoWizardStorage.ts`

- [ ] **Step 1: Correct the import path**
Change `../models/entities/WizardDraft` to `../../models/entities/WizardDraft`.

```typescript
import type { WizardDraft } from '../../models/entities/WizardDraft'
```

- [ ] **Step 2: Verify fix**
Run: `npx vue-tsc --noEmit src/shared/utils/rascunhoWizardStorage.ts`
Expected: No error for this file.

---

### Task 2: Clean up useDashboardViewModel.ts

**Files:**
- Modify: `src/viewmodels/useDashboardViewModel.ts`

- [ ] **Step 1: Remove unused imports and fix emit type**
Remove `DivisaoDeGasto` and `ContaFixa` imports. Update `emit` parameter type to `any` for the event name to allow passing strict `defineEmits` from Vue components.

```typescript
// Before
export function useDashboardViewModel(
  props: DashboardProps,
  emit: (event: string, ...args: any[]) => void,
  dependencies: DashboardDependencies = {}
)

// After
export function useDashboardViewModel(
  props: DashboardProps,
  emit: (event: any, ...args: any[]) => void,
  dependencies: DashboardDependencies = {}
)
```

- [ ] **Step 2: Verify fix**
Run: `npx vue-tsc --noEmit src/viewmodels/useDashboardViewModel.ts`
Expected: No unused import errors and no emit type errors in related views.

---

### Task 3: Fix Fatura type compatibility

**Files:**
- Modify: `src/models/entities/Fatura.ts`

- [ ] **Step 1: Change private members to public**
To satisfy TypeScript's structural typing when Vue proxies are used or when plain objects are passed, make `_responsavelId` and `_status` public.

```typescript
// In Fatura.ts
export class Fatura {
  public readonly id: string
  public readonly cartaoId: string
  public readonly periodo: FaturaPeriodo
  public _responsavelId: string  // Changed from private
  public _status: FaturaStatus    // Changed from private
  public _dataPagamentoBanco?: Date // Changed from private
  // ...
}
```

- [ ] **Step 2: Verify fix**
Run: `npm run build`
Expected: No more "missing properties _responsavelId, _status" errors in `App.vue`.

---

### Task 4: Final Verification

- [ ] **Step 1: Run full build**
Run: `npm run build`
Expected: "Found 0 errors" and successful Vite build.
