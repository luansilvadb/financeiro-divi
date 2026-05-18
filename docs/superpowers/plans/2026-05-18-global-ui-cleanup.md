# Global UI Cleanup & Token Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all legacy UI classes and hardcoded hex values with semantic tokens in the `src/` directory.

**Architecture:** Surgical replacement of hardcoded Tailwind classes with semantic tokens defined in `src/main.css`.

**Tech Stack:** Vue 3, Tailwind CSS.

---

### Task 1: Update App.vue

**Files:**
- Modify: `src/App.vue`

- [ ] **Step 1: Replace legacy classes**
Replace `stone-surface` with `stone`.

```vue
<!-- Antes -->
<Button class="rounded-full border border-stone-surface">
<!-- Depois -->
<Button class="rounded-full border border-stone">
```

- [ ] **Step 2: Commit**

```bash
git add src/App.vue
git commit -m "style: update App.vue with semantic tokens"
```

### Task 2: Update ConfiguracoesMembros.vue

**Files:**
- Modify: `src/components/ledger/ConfiguracoesMembros.vue`

- [ ] **Step 1: Replace legacy classes and hex codes**
Replace `rounded-cards` with `rounded-card`, `stone-surface` with `stone`, and `bg-[#fbfaf9]` with `bg-canvas`.

```vue
<!-- Antes -->
<Card class="p-6 shadow-subtle bg-card rounded-cards space-y-4">
<input class="... border border-stone bg-[#fbfaf9] ..." />
<div class="... border border-stone-surface shadow-subtle rounded-cards">
<!-- Depois -->
<Card class="p-6 shadow-subtle bg-card rounded-card space-y-4">
<input class="... border border-stone bg-canvas ..." />
<div class="... border border-stone shadow-subtle rounded-card">
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ledger/ConfiguracoesMembros.vue
git commit -m "style: update ConfiguracoesMembros.vue with semantic tokens"
```

### Task 3: Update DashboardSaldos.vue

**Files:**
- Modify: `src/components/ledger/DashboardSaldos.vue`

- [ ] **Step 1: Replace hex codes and legacy classes**
Replace `bg-[#f8f7f4]` with `bg-parchment`, `shadow-[inset_0_0_0_1px_#f2f0ed]` with `shadow-subtle`, `text-[#343433]` with `text-charcoal`, `border-[#f2f0ed]` with `border-stone`, `divide-[#f2f0ed]` with `divide-stone`, and `rounded-[10px]` with `rounded-card`.

- [ ] **Step 2: Commit**

```bash
git add src/components/ledger/DashboardSaldos.vue
git commit -m "style: update DashboardSaldos.vue with semantic tokens"
```

### Task 4: Update NovoLancamentoWizard.vue

**Files:**
- Modify: `src/components/ledger/NovoLancamentoWizard.vue`

- [ ] **Step 1: Replace hex codes and legacy classes**
Replace `shadow-[inset_0_0_0_1px_#f2f0ed]` with `shadow-subtle`, `text-[#343433]` with `text-charcoal`, `bg-[#f8f7f4]` with `bg-parchment`, `bg-[#f2f0ed]`/`bg-[#f6f4ef]` with `bg-stone`, `rounded-[10px]` with `rounded-card`, `text-[#474645]` with `text-graphite`, and `text-[#121212]` with `text-midnight`.

- [ ] **Step 2: Commit**

```bash
git add src/components/ledger/NovoLancamentoWizard.vue
git commit -m "style: update NovoLancamentoWizard.vue with semantic tokens"
```

### Task 5: Update Remaining Components

**Files:**
- Modify: `src/components/ledger/shared/SeletorMembros.vue`
- Modify: `src/components/ui/BottomTabBar.vue`
- Modify: `src/components/ui/InvertedSection.vue`

- [ ] **Step 1: Replace legacy classes**
Update `stone-surface` to `stone`, `bg-[#fbfaf9]` to `bg-canvas`, and `rounded-cardslarge` to `rounded-card-lg`.

- [ ] **Step 2: Commit**

```bash
git add src/components/ledger/shared/SeletorMembros.vue src/components/ui/BottomTabBar.vue src/components/ui/InvertedSection.vue
git commit -m "style: update remaining components with semantic tokens"
```

### Task 6: Final Verification

- [ ] **Step 1: Run type check and lint**

Run: `npm run lint` (or equivalent) and `npx tsc --noEmit`

- [ ] **Step 2: Visual confirmation (Manual)**
Ensure no visible breakage in the UI.
