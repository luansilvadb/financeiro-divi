# Composable useMembros Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a Vue composable `useMembros` that manages members using `LocalStorageMembroRepository` and performs an initial migration of hardcoded members.

**Architecture:** The composable will wrap the repository, providing reactive state (`membros`, `ativos`) and methods (`adicionarMembro`, `desativarMembro`, `carregar`) for the UI. It will use `onMounted` to trigger the initial load and migration.

**Tech Stack:** Vue 3 Composition API, TypeScript, Vitest (for testing).

---

### Task 1: Scaffolding and Initial Test (RED)

**Files:**
- Create: `src/modules/ledger/composables/useMembros.test.ts`
- Create (Empty): `src/modules/ledger/composables/useMembros.ts`

- [ ] **Step 1: Create the test file with a failing test for migration**

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useMembros } from './useMembros'
import { LocalStorageMembroRepository } from '../adapters/LocalStorageMembroRepository'

// Mocking LocalStorage to avoid side effects
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value },
    clear: () => { store = {} },
    removeItem: (key: string) => { delete store[key] }
  }
})()

Object.defineProperty(window, 'localStorage', { value: localStorageMock })

describe('useMembros', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('deve realizar a migração inicial se o repositório estiver vazio', async () => {
    const { membros, carregar } = useMembros()
    
    await carregar()

    expect(membros.value.length).toBe(4)
    expect(membros.value.map(m => m.nome)).toContain('Luan')
    expect(membros.value.map(m => m.nome)).toContain('Maria')
    expect(membros.value.map(m => m.nome)).toContain('João')
    expect(membros.value.map(m => m.nome)).toContain('Paula')
  })
})
```

- [ ] **Step 2: Create an empty composable file to allow the test to import it (but fail on execution)**

```typescript
export function useMembros() {
  return {} as any
}
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npx vitest src/modules/ledger/composables/useMembros.test.ts --run`
Expected: FAIL (useMembros is not a function or carregar is undefined)

### Task 2: Implement useMembros (GREEN)

**Files:**
- Modify: `src/modules/ledger/composables/useMembros.ts`

- [ ] **Step 1: Implement the composable logic**

```typescript
import { ref, onMounted, computed } from 'vue'
import { Membro } from '../core/domain/Membro'
import { LocalStorageMembroRepository } from '../adapters/LocalStorageMembroRepository'

export function useMembros() {
  const repository = new LocalStorageMembroRepository()
  const membros = ref<Membro[]>([])

  const ativos = computed(() => membros.value.filter(m => m.ativo))

  const carregar = async () => {
    let lista = await repository.listarTodos()
    
    // Migração inicial: Se vazio, popula com os hardcoded
    if (lista.length === 0) {
      const iniciais = [
        { id: 'luan', nome: 'Luan' },
        { id: 'maria', nome: 'Maria' },
        { id: 'joao', nome: 'João' },
        { id: 'paula', nome: 'Paula' }
      ]
      for (const m of iniciais) {
        const novo = new Membro(m)
        await repository.salvar(novo)
      }
      lista = await repository.listarTodos()
    }
    
    membros.value = lista
  }

  const adicionarMembro = async (nome: string) => {
    const novo = new Membro({ id: crypto.randomUUID(), nome })
    await repository.salvar(novo)
    await carregar()
  }

  const desativarMembro = async (id: string) => {
    const membro = await repository.buscarPorId(id)
    if (membro) {
      const atualizado = new Membro({ ...membro, ativo: false })
      await repository.salvar(atualizado)
      await carregar()
    }
  }

  onMounted(carregar)

  return {
    membros,
    ativos,
    adicionarMembro,
    desativarMembro,
    carregar
  }
}
```

- [ ] **Step 2: Run the test to verify it passes**

Run: `npx vitest src/modules/ledger/composables/useMembros.test.ts --run`
Expected: PASS

### Task 3: Test and Implement Additional Methods

**Files:**
- Modify: `src/modules/ledger/composables/useMembros.test.ts`
- Modify: `src/modules/ledger/composables/useMembros.ts`

- [ ] **Step 1: Add tests for adicionarMembro and desativarMembro**

```typescript
  it('deve adicionar um novo membro', async () => {
    const { membros, adicionarMembro, carregar } = useMembros()
    await carregar() // migração
    
    await adicionarMembro('Novo Membro')
    
    expect(membros.value.length).toBe(5)
    expect(membros.value.find(m => m.nome === 'Novo Membro')).toBeDefined()
  })

  it('deve desativar um membro', async () => {
    const { ativos, desativarMembro, carregar } = useMembros()
    await carregar() // migração
    
    const idParaDesativar = 'luan'
    await desativarMembro(idParaDesativar)
    
    expect(ativos.value.find(m => m.id === idParaDesativar)).toBeUndefined()
  })
```

- [ ] **Step 2: Run the tests**

Run: `npx vitest src/modules/ledger/composables/useMembros.test.ts --run`
Expected: PASS

### Task 4: Final Commit

- [ ] **Step 1: Commit the changes**

```bash
git add src/modules/ledger/composables/useMembros.ts src/modules/ledger/composables/useMembros.test.ts
git commit -m "feat(ledger): criar composable useMembros com migração inicial"
```
