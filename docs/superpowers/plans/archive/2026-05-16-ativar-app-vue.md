# Integração Ativar em App.vue Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refatorar o `App.vue` para utilizar os novos composables centralizados e ativar a sincronização global multi-aba.

**Architecture:** Substituição de instâncias locais de repositórios por `useTransacoes`, `useMembros` e ativação do `useStorageSync`.

**Tech Stack:** Vue 3 (Composition API), TypeScript, Pinia (implicitamente via composables).

---

### Task 1: Refatorar App.vue

**Files:**
- Modify: `src/App.vue`

- [ ] **Step 1: Ler o conteúdo atual de App.vue**

- [ ] **Step 2: Aplicar a substituição de lógica de estado e repositórios**

Substituir imports e inicialização manual pelos novos composables.

- [ ] **Step 3: Verificar se o DashboardSaldos e ConfiguracoesMembros estão recebendo os dados corretos**

- [ ] **Step 4: Commit**

```bash
git add src/App.vue
git commit -m "refactor(ui): integrar sincronização multi-aba no componente principal"
```
