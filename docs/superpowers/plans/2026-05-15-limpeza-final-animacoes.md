# Limpeza Final de Animações no Divi

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remover todos os resquícios de transições e animações CSS (Tailwind) dos componentes do Ledger para tornar o sistema 100% estático.

**Architecture:** Remoção cirúrgica de classes de utilidade do Tailwind CSS relacionadas a transições e transformações.

**Tech Stack:** Vue 3, Tailwind CSS.

---

### Task 1: Limpar ActivityFeed.vue

**Files:**
- Modify: `src/components/ledger/ActivityFeed.vue`

- [ ] **Step 1: Remover classe `transition`**

Localizar a linha 53 (aproximadamente) e remover a classe `transition` da div que representa o item da transação.

### Task 2: Limpar WizardFooter.vue

**Files:**
- Modify: `src/components/ledger/WizardFooter.vue`

- [ ] **Step 1: Remover classe `transition-colors`**

Localizar a linha 16 (aproximadamente) e remover a classe `transition-colors` do botão de voltar.

### Task 3: Limpar NovoLancamentoWizard.vue

**Files:**
- Modify: `src/components/ledger/NovoLancamentoWizard.vue`

- [ ] **Step 1: Remover classe `transform` dos ícones ArrowRight**

Localizar os botões de seleção de tipo (gasto e ganho) e remover a classe `transform` do componente `<ArrowRight />`.

### Task 4: Limpar DashboardSaldos.vue

**Files:**
- Modify: `src/components/ledger/DashboardSaldos.vue`

- [ ] **Step 1: Verificar e remover resquícios de animação**

Revisar o arquivo em busca de `duration-300` e `transition-transform`. Se encontrados, remover. 

### Task 5: Commit e Verificação Final

- [ ] **Step 1: Commitar alterações**

```bash
git add .
git commit -m "style: limpeza final de transições e resquícios de animação"
```
