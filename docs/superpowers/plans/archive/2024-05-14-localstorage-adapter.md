# Implement LocalStorage Adapter for Ledger Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a LocalStorage adapter for `ITransacaoRepository` to provide persistent storage for the PWA.

**Architecture:** The `LocalStorageTransacaoRepository` will implement `ITransacaoRepository`. It will serialize `Transacao` objects to JSON strings for storage and reconstruct them (including `Dinheiro` and `Date` instances) when retrieving.

**Tech Stack:** TypeScript, Vitest, LocalStorage API.

---

### Task 1: Setup Test and Implement Basic Structure

**Files:**
- Create: `src/modules/ledger/adapters/LocalStorageTransacaoRepository.ts`
- Create: `src/modules/ledger/adapters/LocalStorageTransacaoRepository.test.ts`

- [ ] **Step 1: Write initial failing test for `salvar` and `buscarPorId`**

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { LocalStorageTransacaoRepository } from './LocalStorageTransacaoRepository'
import { Transacao } from '../core/domain/Transacao'
import { Dinheiro } from '../../../../shared/primitives/Dinheiro'
import { Divisao } from '../core/domain/Divisao'

describe('LocalStorageTransacaoRepository', () => {
  const STORAGE_KEY = 'divi_transactions'

  beforeEach(() => {
    localStorage.clear()
  })

  it('deve salvar e buscar uma transação reconstruindo tipos complexos', async () => {
    const repo = new LocalStorageTransacaoRepository()
    const transacao = new Transacao({
      id: '1',
      descricao: 'Teste',
      total: Dinheiro.deReais(100),
      origem_id: 'origem',
      pagador_id: 'pagador',
      divisoes: [new Divisao('beneficiario', Dinheiro.deReais(100))],
      status: 'pendente',
      data: new Date('2024-01-01T10:00:00Z')
    })

    await repo.salvar(transacao)
    const buscada = await repo.buscarPorId('1')

    expect(buscada).not.toBeNull()
    expect(buscada?.id).toBe('1')
    expect(buscada?.total).toBeInstanceOf(Dinheiro)
    expect(buscada?.total.centavos).toBe(10000)
    expect(buscada?.data).toBeInstanceOf(Date)
    expect(buscada?.data.toISOString()).toBe('2024-01-01T10:00:00.000Z')
    expect(buscada?.divisoes[0].valor).toBeInstanceOf(Dinheiro)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest src/modules/ledger/adapters/LocalStorageTransacaoRepository.test.ts`
Expected: FAIL (Cannot find module './LocalStorageTransacaoRepository')

- [ ] **Step 3: Implement minimal code for `salvar` and `buscarPorId`**

```typescript
import { ITransacaoRepository } from '../core/ports/ITransacaoRepository'
import { Transacao } from '../core/domain/Transacao'
import { Dinheiro } from '../../../../shared/primitives/Dinheiro'
import { Divisao } from '../core/domain/Divisao'

export class LocalStorageTransacaoRepository implements ITransacaoRepository {
  private readonly STORAGE_KEY = 'divi_transactions'

  async salvar(transacao: Transacao): Promise<void> {
    const todas = await this.listarTodas()
    const index = todas.findIndex(t => t.id === transacao.id)
    
    if (index >= 0) {
      todas[index] = transacao
    } else {
      todas.push(transacao)
    }

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(todas))
  }

  async buscarPorId(id: string): Promise<Transacao | null> {
    const todas = await this.listarTodas()
    return todas.find(t => t.id === id) || null
  }

  async listarTodas(): Promise<Transacao[]> {
    const data = localStorage.getItem(this.STORAGE_KEY)
    if (!data) return []

    const raw = JSON.parse(data) as any[]
    return raw.map(t => new Transacao({
      ...t,
      total: Dinheiro.deCentavos(t.total.centavos),
      data: new Date(t.data),
      divisoes: t.divisoes.map((d: any) => new Divisao(d.beneficiario_id, Dinheiro.deCentavos(d.valor.centavos)))
    }))
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest src/modules/ledger/adapters/LocalStorageTransacaoRepository.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/modules/ledger/adapters/LocalStorageTransacaoRepository.ts src/modules/ledger/adapters/LocalStorageTransacaoRepository.test.ts
git commit -m "feat(ledger): implement LocalStorageTransacaoRepository with serialization logic"
```

---

### Task 2: Implement Persistence across Instances

**Files:**
- Modify: `src/modules/ledger/adapters/LocalStorageTransacaoRepository.test.ts`

- [ ] **Step 1: Write test for persistence across instances**

```typescript
  it('deve persistir dados entre instâncias diferentes do repositório', async () => {
    const transacao = new Transacao({
      id: '2',
      descricao: 'Persistência',
      total: Dinheiro.deReais(50),
      origem_id: 'o',
      pagador_id: 'p',
      divisoes: [new Divisao('b', Dinheiro.deReais(50))],
      status: 'pendente',
      data: new Date()
    })

    const repo1 = new LocalStorageTransacaoRepository()
    await repo1.salvar(transacao)

    const repo2 = new LocalStorageTransacaoRepository()
    const buscada = await repo2.buscarPorId('2')

    expect(buscada?.id).toBe('2')
    expect(buscada?.descricao).toBe('Persistência')
  })
```

- [ ] **Step 2: Run test to verify it passes**

Run: `npx vitest src/modules/ledger/adapters/LocalStorageTransacaoRepository.test.ts`
Expected: PASS (It should already pass because we use `localStorage` directly)

- [ ] **Step 3: Commit**

```bash
git add src/modules/ledger/adapters/LocalStorageTransacaoRepository.test.ts
git commit -m "test(ledger): verify persistence across repository instances"
```

---

### Task 3: Verify Empty State

**Files:**
- Modify: `src/modules/ledger/adapters/LocalStorageTransacaoRepository.test.ts`

- [ ] **Step 1: Write test for empty state**

```typescript
  it('deve retornar lista vazia quando não há dados', async () => {
    const repo = new LocalStorageTransacaoRepository()
    const todas = await repo.listarTodas()
    expect(todas).toEqual([])
  })

  it('deve retornar null ao buscar ID inexistente', async () => {
    const repo = new LocalStorageTransacaoRepository()
    const buscada = await repo.buscarPorId('non-existent')
    expect(buscada).toBeNull()
  })
```

- [ ] **Step 2: Run test to verify it passes**

Run: `npx vitest src/modules/ledger/adapters/LocalStorageTransacaoRepository.test.ts`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/modules/ledger/adapters/LocalStorageTransacaoRepository.test.ts
git commit -m "test(ledger): verify empty state handling in LocalStorage repository"
```
