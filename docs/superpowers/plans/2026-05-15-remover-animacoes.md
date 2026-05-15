# Remoção de Animações e Efeitos Visuais Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remover todas as animações, efeitos de fade, bounce ao clicar e transições da interface para torná-la estática e imediata.

**Architecture:** Limpeza de classes do Tailwind relacionadas a animações (`animate-*`), transições (`transition-*`), escala (`scale-*`) e estados ativos de escala (`active:scale-*`) em todos os componentes.

**Tech Stack:** Tailwind CSS, Vue 3.

---

### Task 1: Remover animações do DashboardSaldos.vue

**Files:**
- Modify: `src/components/ledger/DashboardSaldos.vue`

- [ ] **Step 1: Remover classes de animação e escala**
Remover `animate-fade-in`, `active:scale-95`, `transition-all`, `transition-transform` e `duration-300`.

- [ ] **Step 2: Verificar integridade**
Garantir que a lógica de expansão continua funcionando, apenas sem a animação.

- [ ] **Step 3: Commit**
```bash
git add src/components/ledger/DashboardSaldos.vue
git commit -m "style: remover animações e efeitos de clique do DashboardSaldos"
```

---

### Task 2: Remover animações do NovoLancamentoWizard e WizardFooter

**Files:**
- Modify: `src/components/ledger/NovoLancamentoWizard.vue`
- Modify: `src/components/ledger/WizardFooter.vue`
- Modify: `src/components/ledger/WizardProgressBar.vue`

- [ ] **Step 1: Limpar NovoLancamentoWizard.vue**
Remover `transition-all`, `group-hover:translate-x-1`, `scale-105`, `animate-pulse`, etc.

- [ ] **Step 2: Limpar WizardFooter.vue**
Remover `hover:scale-[1.02]`, `active:scale-95`, `transition-all`.

- [ ] **Step 3: Limpar WizardProgressBar.vue**
Remover `transition-all` e `duration-700`. A barra deve saltar para a nova posição instantaneamente.

- [ ] **Step 4: Commit**
```bash
git add src/components/ledger/NovoLancamentoWizard.vue src/components/ledger/WizardFooter.vue src/components/ledger/WizardProgressBar.vue
git commit -m "style: remover animações e efeitos de escala do wizard"
```

---

### Task 3: Remover animações globais e do App.vue

**Files:**
- Modify: `src/App.vue`
- Modify: `src/index.css`

- [ ] **Step 1: Limpar App.vue**
Remover `active:scale-90` e `transition-all` do FAB e botões.

- [ ] **Step 2: Remover definição de animação no index.css**
Apagar a classe `.animate-fade-in` e seus `@keyframes`.

- [ ] **Step 3: Commit**
```bash
git add src/App.vue src/index.css
git commit -m "style: remover animações globais e efeitos do FAB"
```
