# Inversão de Ordenação nos Detalhes dos Moradores Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Inverter a ordenação dos lançamentos na visualização detalhada de cada morador para que os mais antigos apareçam no topo (ordem cronológica).

**Architecture:** Modificação pontual na lógica de ordenação (sort) dentro do componente Vue.

**Tech Stack:** Vue 3, TypeScript.

---

### Task 1: Inverter Ordenação no DashboardSaldos.vue

**Files:**
- Modify: `src/components/ledger/DashboardSaldos.vue:86`

- [ ] **Step 1: Localizar e modificar a função getMemberDetails**

Localizar a linha onde o `sort` é aplicado no retorno de `getMemberDetails` e inverter a lógica de comparação de datas.

```typescript
// De:
}).sort((a, b) => b.data.getTime() - a.data.getTime())

// Para:
}).sort((a, b) => a.data.getTime() - b.data.getTime())
```

- [ ] **Step 2: Verificar visualmente (Manual)**

Como este projeto é um frontend interativo, abrir o dashboard, expandir um morador e validar se a lista começa pela data mais antiga.

- [ ] **Step 3: Garantir que ActivityFeed.vue permanece inalterado**

Verificar `src/components/ledger/ActivityFeed.vue` para confirmar que ele ainda usa `b.data.getTime() - a.data.getTime()`.

- [ ] **Step 4: Commit**

```bash
git add src/components/ledger/DashboardSaldos.vue
git commit -m "style: inverter ordenação dos detalhes do morador para cronológica"
```
