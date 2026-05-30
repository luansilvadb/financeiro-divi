# Repositories - Implementar Locks Atômicos Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Garantir que as operações de leitura-modificação-escrita nos repositórios de LocalStorage sejam atômicas, prevenindo condições de corrida entre abas do navegador.

**Architecture:** Utilizar o utilitário `StorageLock` para envolver as operações de persistência em uma seção crítica protegida pela Web Locks API.

**Tech Stack:** TypeScript, LocalStorage, Web Locks API.

---

### Task 1: Refatorar LocalStorageTransacaoRepository

**Files:**
- Modify: `src/modules/ledger/adapters/LocalStorageTransacaoRepository.ts`

- [ ] **Step 1: Importar StorageLock**

Adicionar o import no topo do arquivo.

```typescript
import { StorageLock } from '../../../shared/utils/StorageLock'
```

- [ ] **Step 2: Envolver o método salvar com executarAtomico**

Mover a chamada de `listarTodas()` para dentro do lock.

```typescript
  async salvar(transacao: Transacao): Promise<void> {
    await StorageLock.executarAtomico('lock_divi_transactions', async () => {
      const todas = await this.listarTodas()
      const index = todas.findIndex(t => t.id === transacao.id)
      
      if (index >= 0) {
        todas[index] = transacao
      } else {
        todas.push(transacao)
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(todas))
    })
  }
```

- [ ] **Step 3: Verificar testes**

Executar os testes existentes para garantir que não houve regressão.

Run: `npm test src/modules/ledger/adapters/LocalStorageTransacaoRepository.test.ts`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/modules/ledger/adapters/LocalStorageTransacaoRepository.ts
git commit -m "fix(ledger): garantir atomicidade no LocalStorageTransacaoRepository"
```

### Task 2: Refatorar LocalStorageMembroRepository

**Files:**
- Modify: `src/modules/ledger/adapters/LocalStorageMembroRepository.ts`

- [ ] **Step 1: Importar StorageLock**

Adicionar o import no topo do arquivo.

```typescript
import { StorageLock } from '../../../shared/utils/StorageLock'
```

- [ ] **Step 2: Envolver o método salvar com executarAtomico**

Mover a chamada de `listarTodos()` para dentro do lock.

```typescript
  async salvar(membro: Membro): Promise<void> {
    await StorageLock.executarAtomico('lock_divi_membros', async () => {
      const membros = await this.listarTodos()
      const index = membros.findIndex(m => m.id === membro.id)
      
      if (index >= 0) {
        membros[index] = membro
      } else {
        membros.push(membro)
      }
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(membros))
    })
  }
```

- [ ] **Step 3: Verificar testes**

Executar os testes existentes para garantir que não houve regressão.

Run: `npm test src/modules/ledger/adapters/LocalStorageMembroRepository.test.ts`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/modules/ledger/adapters/LocalStorageMembroRepository.ts
git commit -m "fix(ledger): garantir atomicidade no LocalStorageMembroRepository"
```
