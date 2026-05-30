# Atomicidade e Sincronização Multi-Aba Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminar race conditions no `localStorage` usando Web Locks API e sincronizar o estado da UI entre abas em tempo real via eventos de storage.

**Architecture:** Implementação de um utilitário de lock atômico, refatoração dos repositórios para garantir atomicidade no ciclo "Leitura-Modificação-Escrita" e criação de composables para sincronização reativa.

**Tech Stack:** TypeScript, Vue 3, Web Locks API, Storage API.

---

### Task 1: Utils - Criar `StorageLock`

**Files:**
- Create: `src/shared/utils/StorageLock.ts`
- Test: `src/shared/utils/StorageLock.test.ts`

- [ ] **Step 1: Escrever testes para ambos os caminhos (Lock e Fallback)**

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { StorageLock } from './StorageLock'

describe('StorageLock', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('deve usar navigator.locks quando disponível', async () => {
    const mockRequest = vi.fn((_, op) => op())
    vi.stubGlobal('navigator', { locks: { request: mockRequest } })
    
    const result = await StorageLock.executarAtomico('test', async () => 'ok')
    
    expect(mockRequest).toHaveBeenCalledWith('test', expect.any(Function))
    expect(result).toBe('ok')
  })

  it('deve executar sem lock quando API indisponível (fallback)', async () => {
    vi.stubGlobal('navigator', {}) // Sem locks API
    
    const result = await StorageLock.executarAtomico('test', async () => 'fallback')
    expect(result).toBe('fallback')
  })
})
```

- [ ] **Step 2: Implementar o utilitário com fallback**

```typescript
export class StorageLock {
  static async executarAtomico<T>(recurso: string, operacao: () => Promise<T>): Promise<T> {
    if (!navigator.locks) {
      console.warn(`Web Locks API indisponível para: ${recurso}. Executando sem proteção multi-aba.`)
      return await operacao()
    }
    return await navigator.locks.request(recurso, async () => {
      return await operacao()
    })
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/shared/utils/StorageLock.ts src/shared/utils/StorageLock.test.ts
git commit -m "feat(infra): adicionar utilitário StorageLock com fallback e testes robustos"
```

---

### Task 2: Repositories - Implementar Locks Atômicos

**Files:**
- Modify: `src/modules/ledger/adapters/LocalStorageTransacaoRepository.ts`
- Modify: `src/modules/ledger/adapters/LocalStorageMembroRepository.ts`

- [ ] **Step 1: Envolver `salvar` de Transações com Lock**

O contrato exige que `listarTodas()` seja chamado **dentro** do lock.

```typescript
// No LocalStorageTransacaoRepository.ts
async salvar(transacao: Transacao): Promise<void> {
  await StorageLock.executarAtomico('lock_divi_transactions', async () => {
    const todas = await this.listarTodas() // Chamada movida para dentro do lock
    const index = todas.findIndex(t => t.id === transacao.id)
    if (index >= 0) todas[index] = transacao
    else todas.push(transacao)
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(todas))
  })
}
```

- [ ] **Step 2: Envolver `salvar` de Membros com Lock**

```typescript
// No LocalStorageMembroRepository.ts
async salvar(membro: Membro): Promise<void> {
  await StorageLock.executarAtomico('lock_divi_membros', async () => {
    const membros = await this.listarTodos()
    const index = membros.findIndex(m => m.id === membro.id)
    if (index >= 0) membros[index] = membro
    else membros.push(membro)
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(membros))
  })
}
```

- [ ] **Step 3: Commit**

```bash
git add src/modules/ledger/adapters/LocalStorageTransacaoRepository.ts src/modules/ledger/adapters/LocalStorageMembroRepository.ts
git commit -m "fix(ledger): garantir atomicidade na gravação de dados via StorageLock"
```

---

### Task 3: Composables - Sincronismo e Refatoração

**Files:**
- Create: `src/modules/ledger/composables/useTransacoes.ts`
- Create: `src/modules/ledger/composables/useStorageSync.ts`
- Modify: `src/modules/ledger/composables/useMembros.ts`

- [ ] **Step 1: Criar `useTransacoes` (Singleton com Lazy Loading)**

```typescript
import { ref } from 'vue'
import { Transacao } from '../core/domain/Transacao'
import { LocalStorageTransacaoRepository } from '../adapters/LocalStorageTransacaoRepository'

const transacoes = ref<Transacao[]>([])
const inicializado = ref(false)
const repository = new LocalStorageTransacaoRepository()

export function useTransacoes() {
  const carregar = async () => {
    transacoes.value = await repository.listarTodas()
    inicializado.value = true
  }

  const salvar = async (t: Transacao) => {
    await repository.salvar(t)
    await carregar()
  }

  // Inicialização lazy garantida
  if (!inicializado.value) {
    carregar()
  }

  return { transacoes, carregar, salvar }
}
```

- [ ] **Step 2: Criar `useStorageSync`**

Listener para sincronização multi-aba.

```typescript
import { onMounted, onUnmounted } from 'vue'
import { useMembros } from './useMembros'
import { useTransacoes } from './useTransacoes'

export function useStorageSync() {
  const { carregar: reloadMembros } = useMembros()
  const { carregar: reloadTransacoes } = useTransacoes()

  const handleStorage = (e: StorageEvent) => {
    if (e.key === 'divi_transactions') reloadTransacoes()
    if (e.key === 'divi_membros') reloadMembros()
  }

  onMounted(() => window.addEventListener('storage', handleStorage))
  onUnmounted(() => window.removeEventListener('storage', handleStorage))
}
```

- [ ] **Step 3: Commit**

```bash
git add src/modules/ledger/composables/useTransacoes.ts src/modules/ledger/composables/useStorageSync.ts
git commit -m "feat(ledger): implementar sincronização reativa entre abas com lazy loading"
```

---

### Task 4: Integration - Ativar em `App.vue`

**Files:**
- Modify: `src/App.vue`

- [ ] **Step 1: Limpar App.vue e ativar sincronismo**

```typescript
// No App.vue
import { onMounted } from 'vue'
import { useTransacoes } from './modules/ledger/composables/useTransacoes'
import { useMembros } from './modules/ledger/composables/useMembros'
import { useStorageSync } from './modules/ledger/composables/useStorageSync'

const { transacoes, carregar: carregarTransacoes, salvar: salvarTransacao } = useTransacoes()
const { carregar: carregarMembros, membros: todosMembros, ativos } = useMembros()

useStorageSync() // Ativa o listener global

onMounted(async () => {
  // Garante que ambos os estados estejam sincronizados na montagem
  await Promise.all([
    carregarTransacoes(),
    carregarMembros()
  ])
})

const handleSalvarTransacao = async (t: Transacao) => {
  await salvarTransacao(t)
  currentView.value = 'dashboard'
}
```

- [ ] **Step 2: Commit**

```bash
git add src/App.vue
git commit -m "refactor(ui): integrar sincronização multi-aba no componente principal"
```
