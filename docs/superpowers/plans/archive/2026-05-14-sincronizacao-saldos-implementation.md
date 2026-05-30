# Sincronização de Saldos e Membros Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Garantir que o Wizard e o Dashboard compartilhem os mesmos membros e que o saldo seja atualizado e persistido imediatamente após o salvamento.

**Architecture:** Centralização do estado de membros no componente raiz (`App.vue`) e injeção via props no Wizard, garantindo que o ciclo de vida de persistência (salvar -> recarregar -> navegar) seja executado de forma síncrona.

**Tech Stack:** Vue 3, LocalStorage API, TypeScript.

---

### Task 1: Centralizar Membros no App.vue

**Files:**
- Modify: `src/App.vue`

- [ ] **Step 1: Atualizar a lista de membros no App.vue para coincidir com o Wizard**
- [ ] **Step 2: Passar os membros como prop para o componente Wizard**
- [ ] **Step 3: Commit**

### Task 2: Refatorar Wizard para usar Props

**Files:**
- Modify: `src/components/ledger/NovoLancamentoWizard.vue`

- [ ] **Step 1: Definir a Prop `membros` e remover a lista interna estática**
- [ ] **Step 2: Substituir todas as referências internas a `membros` por `props.membros`**
- [ ] **Step 3: Commit**

### Task 3: Verificação de Fluxo Completo

**Files:**
- Modify: `src/App.vue`

- [ ] **Step 1: Garantir que `handleSalvarTransacao` force a atualização e navegação**
- [ ] **Step 2: Executar testes de integração**
- [ ] **Step 3: Commit**
