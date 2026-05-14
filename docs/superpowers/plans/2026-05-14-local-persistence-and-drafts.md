# Local Persistence and Drafts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the persistence layer for the Ledger module using LocalStorage and add auto-save (draft) capabilities to the entry wizard.

**Architecture:** Hexagonal Architecture (Ports & Adapters). Port defined in Core, Adapter implemented in Infrastructure.

**Tech Stack:** TypeScript, Vue 3, LocalStorage API, Vitest.

---

### Task 1: Define Transaction Port and Memory Adapter

**Files:**
- Create: `src/modules/ledger/core/ports/ITransacaoRepository.ts`
- Create: `src/modules/ledger/adapters/MemoryTransacaoRepository.ts`
- Test: `src/modules/ledger/adapters/MemoryTransacaoRepository.test.ts`

- [ ] **Step 1: Define ITransacaoRepository interface**
```typescript
import { Transacao } from '../domain/Transacao'

export interface ITransacaoRepository {
  salvar(transacao: Transacao): Promise<void>
  buscarPorId(id: string): Promise<Transacao | null>
  listarTodas(): Promise<Transacao[]>
}
```

- [ ] **Step 2: Implement MemoryTransacaoRepository (for testing)**
```typescript
import { ITransacaoRepository } from '../core/ports/ITransacaoRepository'
import { Transacao } from '../core/domain/Transacao'

export class MemoryTransacaoRepository implements ITransacaoRepository {
  private transacoes: Map<string, Transacao> = new Map()

  async salvar(transacao: Transacao): Promise<void> {
    this.transacoes.set(transacao.id, transacao)
  }

  async buscarPorId(id: string): Promise<Transacao | null> {
    return this.transacoes.get(id) || null
  }

  async listarTodas(): Promise<Transacao[]> {
    return Array.from(this.transacoes.values())
  }
}
```

- [ ] **Step 3: Write tests for the repository**
Verify that saving and retrieving works as expected.

- [ ] **Step 4: Commit**
`git add src/modules/ledger && git commit -m "feat(ledger): add repository port and memory adapter"`

---

### Task 2: Implement LocalStorage Adapter

**Files:**
- Create: `src/modules/ledger/adapters/LocalStorageTransacaoRepository.ts`
- Test: `src/modules/ledger/adapters/LocalStorageTransacaoRepository.test.ts`

- [ ] **Step 1: Implement LocalStorage adapter**
Handle serialization/deserialization, ensuring `Dinheiro` value objects and `Date` objects are reconstructed correctly.

- [ ] **Step 2: Write tests (using Vitest with a mock/clean storage)**
Ensure data persists between repository instances (simulated browser refresh).

- [ ] **Step 3: Commit**
`git add src/modules/ledger/adapters && git commit -m "feat(ledger): add localstorage repository adapter"`

---

### Task 3: Wizard Auto-save (Drafts)

**Files:**
- Modify: `src/components/ledger/NovoLancamentoWizard.vue`

- [ ] **Step 1: Implement auto-save logic**
Add a watcher to the wizard's state that saves to `localStorage` under `divi_rascunho_novo_lancamento` whenever it changes.

- [ ] **Step 2: Implement restore logic**
In `onMounted`, check for the draft key and prompt the user (or just restore) if it exists.

- [ ] **Step 3: Clear draft on finalize**
Ensure the draft is removed from `localStorage` once the transaction is saved.

- [ ] **Step 4: Commit**
`git add src/components/ledger/NovoLancamentoWizard.vue && git commit -m "feat: add auto-save/draft logic to wizard"`
