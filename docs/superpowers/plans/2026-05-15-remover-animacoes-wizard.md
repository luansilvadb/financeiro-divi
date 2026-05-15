# Remover animações do Wizard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tornar o NovoLancamentoWizard e seus subcomponentes estáticos e rápidos, removendo todas as animações, efeitos de escala e transições.

**Architecture:** Limpeza de classes CSS utilitárias do Tailwind e remoção do componente de transição do Vue.

**Tech Stack:** Vue 3, Tailwind CSS

---

### Task 1: Limpar NovoLancamentoWizard.vue

**Files:**
- Modify: `src/components/ledger/NovoLancamentoWizard.vue`

- [ ] **Step 1: Remover classes de animação e transição dos botões de tipo**
Remover `transition-all`, `hover:shadow-md` e `group-hover:translate-x-1`.

- [ ] **Step 2: Remover classes de animação e transição do campo de valor e descrição**
Remover `transition-all` e `hover:bg-blue-50`.

- [ ] **Step 3: Remover animações de seleção de membros**
Remover `scale-105`, `transition-all` e `transition-colors`.

- [ ] **Step 4: Remover animate-pulse do indicador de equilíbrio**
Remover `animate-pulse` e `transition-all`.

- [ ] **Step 5: Remover classes de transição dos itens de pagamento e resumo**
Remover `transition-all`.

- [ ] **Step 6: Remover o componente Transition e as tags style relacionadas**
Remover `<Transition name="slide-fade" mode="out-in">` e o bloco `<style scoped>`.

- [ ] **Step 7: Commit parcial**

```bash
git add src/components/ledger/NovoLancamentoWizard.vue
git commit -m "style(wizard): remover animações e efeitos de escala do componente principal"
```

### Task 2: Limpar WizardFooter.vue

**Files:**
- Modify: `src/components/ledger/WizardFooter.vue`

- [ ] **Step 1: Remover classes de animação e transição dos botões**
Remover `hover:scale-[1.02]`, `active:scale-95` e `transition-all`.

- [ ] **Step 2: Commit parcial**

```bash
git add src/components/ledger/WizardFooter.vue
git commit -m "style(wizard): remover efeitos de escala do rodapé"
```

### Task 3: Limpar WizardProgressBar.vue

**Files:**
- Modify: `src/components/ledger/WizardProgressBar.vue`

- [ ] **Step 1: Remover classes de transição da barra de progresso**
Remover `transition-all`, `duration-700` e `ease-in-out`.

- [ ] **Step 2: Commit final**

```bash
git add src/components/ledger/WizardProgressBar.vue
git commit -m "style(wizard): remover animação da barra de progresso"
```
