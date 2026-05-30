# AUDIT∞ Architectural and Logic Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Correct 14 architectural and logic failures identified in the AUDIT∞ report to improve system reliability, consistency, and architecture.

**Architecture:** Surgical fixes across the Model, ViewModel, and Infrastructure layers. Applies TDD for logic fixes and enforces MVVM invariants.

**Tech Stack:** Vue 3 (Composition API), TypeScript, Vitest.

---

### Task 1: Fix F-01, F-04, F-05 (GastoService)

**Files:**
- Modify: `src/models/services/GastoService.ts`
- Test: `src/models/services/GastoService.test.ts` (if exists) or create one.

- [ ] **Step 1: Fix F-01 (TOCTOU Race Condition in fatura creation)**
Remove the `finally` block that deletes the promise from `faturasEmCriacao`. Instead, keep the promise cached.

```typescript
// src/models/services/GastoService.ts

// Modify obterOuCriarFatura
  private async obterOuCriarFatura(cartaoId: string, mes: number, ano: number, responsavelId: string): Promise<any> {
    const chave = `${cartaoId}_${mes}_${ano}`
    const existing = this.faturasEmCriacao.get(chave)
    if (existing) return existing

    const promessa = (async () => {
      const todasFaturas = await this.faturaRepo.listarTodas()
      let fatura = todasFaturas.find(f => f.cartaoId === cartaoId && f.periodo.mes === mes && f.periodo.ano === ano)
      if (!fatura) {
        fatura = new Fatura({
          id: crypto.randomUUID(),
          cartaoId,
          periodo: { mes, ano },
          responsavelId,
          status: 'ABERTA'
        })
        await this.faturaRepo.salvar(fatura)
      }
      return fatura
    })()

    this.faturasEmCriacao.set(chave, promessa)
    return promessa
  }
```

- [ ] **Step 2: Fix F-05 (Remove hardcoded fallback 2026)**
Replace the fallback with an explicit error.

```typescript
// src/models/services/GastoService.ts:437 and 517
// Replace:
const periodoInicial = faturaOriginal ? faturaOriginal.periodo : { mes: 1, ano: 2026 }
// With:
if (!faturaOriginal) throw new Error(`Fatura original não encontrada para o gasto ${gastoId}`)
const periodoInicial = faturaOriginal.periodo
```

- [ ] **Step 3: Fix F-04 (Netting Idempotency)**
Ensure `registrarReembolso` is only called if there's a balance to pay.

```typescript
// src/models/services/GastoService.ts:317
// The check is already there: if (faltaPagarCentavos > 0)
// But let's add a more robust check before saving the fatura too.
// Line 325:
            if (todosQuitados && fatAnterior.dataPagamentoBanco && fatAnterior.status !== 'ACERTADA') {
              fatAnterior.marcarAcertada()
              await this.faturaRepo.salvar(fatAnterior)
            }
```

- [ ] **Step 4: Verify with tests**
Run existing tests for GastoService.

### Task 2: Fix F-07, F-08 (FaturaRolloverService)

**Files:**
- Modify: `src/models/services/FaturaRolloverService.ts`

- [ ] **Step 1: Fix F-07 (Non-deterministic Carryover ID)**
Use `crypto.randomUUID()` instead of `Date.now() + Math.random()`.

```typescript
// src/models/services/FaturaRolloverService.ts:50
// Replace:
id: `carry_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
// With:
id: crypto.randomUUID(),
```

- [ ] **Step 2: Fix F-08 (Rollover Parcelas filtering)**
Verify if `!g.grupoParcelasId` is still desired. The audit says this causes new parcels to be ignored. Actually, new parcels are already projected in `projetarGastosParcelados`, so rollover SHOULD ignore them to avoid double-counting. However, if the intent was to support legacy data rollover, the filter is correct for legacy but redundant for new. I will keep it but add a comment explaining why.

### Task 3: Fix F-02, F-09, F-10 (useNovoLancamentoWizard)

**Files:**
- Modify: `src/viewmodels/useNovoLancamentoWizard.ts`

- [ ] **Step 1: Fix F-02 (isResetting race condition)**
Convert `isResetting` to a `ref` and use `nextTick`.

```typescript
// src/viewmodels/useNovoLancamentoWizard.ts
import { ref, computed, watch, onMounted, onUnmounted, isRef, type Ref, nextTick } from 'vue' // Add nextTick

// ...
  const isResetting = ref(false) // Change to ref

  const reset = () => {
    isResetting.value = true
    // ...
    limparRascunhoWizard()
    
    nextTick(() => {
      isResetting.value = false
    })
  }

// In the watch (L241):
    (state) => {
      if (isResetting.value) return // Use .value
```

- [ ] **Step 2: Fix F-09 (Throws before isSubmitting)**
Move `isSubmitting.value = true` to the top of the function.

```typescript
// src/viewmodels/useNovoLancamentoWizard.ts:149
  const finalizarGastoOuEmprestimo = async () => {
    if (isSubmitting.value) return
    isSubmitting.value = true // Set early

    try {
      if (!wizFlow.value || !wizPayment.value) throw new Error('Fluxo de pagamento não selecionado')
      if (!compradorSelecionadoId.value) throw new Error('Selecione quem pagou/emprestou')
      if (!valor.value || isNaN(Number(valor.value))) throw new Error('Valor inválido')
      // ...
```

- [ ] **Step 3: Fix F-10 (Restore validation)**
Add simple validation when restoring from `sessionStorage`.

```typescript
// src/viewmodels/useNovoLancamentoWizard.ts:214
    if (data) {
      try {
        if (data.step !== undefined && typeof data.step === 'number') step.value = data.step
        if (data.wizFlow !== undefined && ['expense', 'loan', null].includes(data.wizFlow)) wizFlow.value = data.wizFlow
        if (data.wizPayment !== undefined && ['pix', 'card', null].includes(data.wizPayment)) wizPayment.value = data.wizPayment
        // ... add more basic checks
```

### Task 4: Fix F-03, F-06, F-12 (Infrastructure)

**Files:**
- Modify: `src/models/repositories/local/LocalStorageGastoRepository.ts`
- Modify: `src/models/repositories/local/LocalStorageFaturaRepository.ts`
- Modify: `src/shared/utils/StorageLock.ts`

- [ ] **Step 1: Fix F-03 (Read-inside-Lock protection)**
Add a private `listarTodosInternal` that doesn't use lock, and make `listarTodos` use the lock.

```typescript
// src/models/repositories/local/LocalStorageGastoRepository.ts

  async listarTodos(): Promise<Gasto[]> {
    return await StorageLock.executarAtomico('lock_divi_gastos_cartao', async () => {
      return this.listarTodosInternal()
    })
  }

  private listarTodosInternal(): Gasto[] {
    const data = localStorage.getItem(this.STORAGE_KEY)
    // ... rest of logic from current listarTodos
  }

// Update all methods that were calling listarTodos() to call listarTodosInternal() since they are already inside a lock.
```

- [ ] **Step 2: Fix F-06 (Inject GastoRepository)**
Modify `LocalStorageFaturaRepository` to accept `IGastoRepository` in constructor.

```typescript
// src/models/repositories/local/LocalStorageFaturaRepository.ts

  constructor(private gastoRepo?: IGastoRepository) {}

  // In desduplicarEMigrarFaturas
  // Replace: const gastoRepo = new LocalStorageGastoRepository()
  // With: const gastoRepo = this.gastoRepo || new LocalStorageGastoRepository()
```

- [ ] **Step 3: Fix F-12 (Web Locks fallback logging)**
Add better logging/protection if `navigator.locks` is missing.

```typescript
// src/shared/utils/StorageLock.ts
    if (!navigator.locks) {
      if (import.meta.env.DEV) {
        console.warn(`Web Locks API indisponível para: ${recurso}.`)
      }
      return await operacao()
    }
```

### Task 5: Fix F-11, F-13, F-14 (Dashboard and Entities)

**Files:**
- Modify: `src/viewmodels/useDashboardViewModel.ts`
- Modify: `src/models/entities/Dinheiro.ts`

- [ ] **Step 1: Fix F-11 (Lock logic for cards without fatura)**
Ensure `faturaSelecionadaTrancada` handles missing faturas correctly.

```typescript
// src/viewmodels/useDashboardViewModel.ts:115
  const faturaSelecionadaTrancada = computed(() => {
    const p = periodoSelecionado.value
    // ...
    if (props.cartoes.length > 0) {
      const todosCartoesFechados = props.cartoes.every(cartao => {
        const fatura = props.faturasFechadas.find(f => f.cartaoId === cartao.id && f.periodo.mes === p.mes && f.periodo.ano === p.ano)
        if (fatura) return true
        const faturaAberta = props.faturasAbertas.find(f => f.cartaoId === cartao.id && f.periodo.mes === p.mes && f.periodo.ano === p.ano)
        return !faturaAberta // Se não tem fatura nenhuma, considera fechado/inexistente? 
      })
```

- [ ] **Step 2: Fix F-13 (Loop infinite in distribuirPorPesos)**
Add a safety counter.

```typescript
// src/models/entities/Dinheiro.ts:101
    while (centavosAlocados < totalCentavosRestantes && i < pesos.length * 2) {
      // ...
      i++
    }
```

- [ ] **Step 3: Fix F-14 (DIP in useDashboardViewModel)**
Ensure all dependencies are used from `dependencies` prop.

```typescript
// src/viewmodels/useDashboardViewModel.ts:50
  const gastoRepo = dependencies.gastoRepository || gastoRepository
  // ... already doing this, but ensure it's consistent.
```
