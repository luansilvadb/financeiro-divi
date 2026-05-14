# Wizard Auto-save (Drafts) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement auto-save and restore logic for the "Novo Lancamento" wizard using `localStorage`.

**Architecture:** A single watcher will monitor all relevant state variables and persist them to `localStorage`. On component mount, the state will be restored from the saved draft.

**Tech Stack:** Vue 3, TypeScript, LocalStorage.

---

### Task 1: Setup Constants and hydration logic

**Files:**
- Modify: `src/components/ledger/NovoLancamentoWizard.vue`

- [ ] **Step 1: Define storage key and import onMounted/watch**

```typescript
import { ref, onMounted, watch } from 'vue'

const STORAGE_KEY = 'divi_rascunho_novo_lancamento'
```

- [ ] **Step 2: Implement hydration in onMounted**

```typescript
onMounted(() => {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) {
    try {
      const data = JSON.parse(saved)
      if (data.step) step.value = data.step
      if (data.valor) valor.value = data.valor
      if (data.descricao) descricao.value = data.descricao
      if (data.fonte_id) fonte_id.value = data.fonte_id
      if (data.pagador_id) pagador_id.value = data.pagador_id
      if (data.pagueiPorOutro !== undefined) pagueiPorOutro.value = data.pagueiPorOutro
      if (data.beneficiarios_selecionados) beneficiarios_selecionados.value = data.beneficiarios_selecionados
    } catch (e) {
      console.error('Erro ao restaurar rascunho:', e)
    }
  }
})
```

- [ ] **Step 3: Commit**

```bash
git add src/components/ledger/NovoLancamentoWizard.vue
git commit -m "feat: add draft hydration logic to wizard"
```

### Task 2: Implement Auto-save logic

**Files:**
- Modify: `src/components/ledger/NovoLancamentoWizard.vue`

- [ ] **Step 1: Add watcher to sync state to localStorage**

```typescript
watch(
  () => ({
    step: step.value,
    valor: valor.value,
    descricao: descricao.value,
    fonte_id: fonte_id.value,
    pagador_id: pagador_id.value,
    pagueiPorOutro: pagueiPorOutro.value,
    beneficiarios_selecionados: [...beneficiarios_selecionados.value]
  }),
  (newState) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState))
  },
  { deep: true }
)
```

- [x] **Step 2: Commit**

```bash
git add src/components/ledger/NovoLancamentoWizard.vue
git commit -m "feat: add auto-save watcher to wizard"
```

### Task 3: Clear draft on finalize

**Files:**
- Modify: `src/components/ledger/NovoLancamentoWizard.vue`

- [x] **Step 1: Update finalizar to remove storage key**

```typescript
const finalizar = () => {
  // ... existing console.log ...
  
  // Clear draft
  localStorage.removeItem(STORAGE_KEY)
  
  alert('Transação salva com sucesso! (Veja o console)')
  // ... reset logic ...
}
```

- [x] **Step 2: Commit**

```bash
git add src/components/ledger/NovoLancamentoWizard.vue
git commit -m "feat: clear draft on wizard finalization"
```
