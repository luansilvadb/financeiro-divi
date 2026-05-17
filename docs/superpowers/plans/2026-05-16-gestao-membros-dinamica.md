# Gestão Dinâmica de Membros Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar a gestão dinâmica de moradores, permitindo adicionar, editar e desativar membros com persistência no `localStorage`.

**Architecture:** Criação da entidade de domínio `Membro`, interface de repositório e implementação `LocalStorage`. Integração via composable `useMembros` para centralizar a lógica de estado e migração de dados hardcoded.

**Tech Stack:** Vue 3, TypeScript, Vitest.

---

### Task 1: Domínio - Criar Entidade `Membro` e Repositório

**Files:**
- Create: `src/modules/ledger/core/domain/Membro.ts`
- Create: `src/modules/ledger/core/ports/IMembroRepository.ts`
- Create: `src/modules/ledger/core/domain/Membro.test.ts`

- [ ] **Step 1: Escrever teste para a entidade Membro**

```typescript
import { describe, it, expect } from 'vitest'
import { Membro } from './Membro'

describe('Membro', () => {
  it('deve criar um membro ativo por padrão', () => {
    const membro = new Membro({ id: '1', nome: 'Luan' })
    expect(membro.nome).toBe('Luan')
    expect(membro.ativo).toBe(true)
  })
})
```

- [ ] **Step 2: Implementar a classe Membro**

```typescript
export class Membro {
  readonly id: string
  readonly nome: string
  readonly ativo: boolean
  readonly dataCriacao: Date

  constructor(props: { id: string; nome: string; ativo?: boolean; dataCriacao?: Date }) {
    this.id = props.id
    this.nome = props.nome
    this.ativo = props.ativo ?? true
    this.dataCriacao = props.dataCriacao ?? new Date()
  }
}
```

- [ ] **Step 3: Criar a interface IMembroRepository**

```typescript
import { Membro } from '../domain/Membro'

export interface IMembroRepository {
  salvar(membro: Membro): Promise<void>
  listarTodos(): Promise<Membro[]>
  buscarPorId(id: string): Promise<Membro | null>
}
```

- [ ] **Step 4: Executar testes**

Run: `npx vitest src/modules/ledger/core/domain/Membro.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/modules/ledger/core/domain/Membro.ts src/modules/ledger/core/ports/IMembroRepository.ts src/modules/ledger/core/domain/Membro.test.ts
git commit -m "feat(ledger): criar entidade Membro e interface de repositório"
```

---

### Task 2: Adapter - Implementar `LocalStorageMembroRepository`

**Files:**
- Create: `src/modules/ledger/adapters/LocalStorageMembroRepository.ts`
- Create: `src/modules/ledger/adapters/LocalStorageMembroRepository.test.ts`

- [ ] **Step 1: Escrever teste para o repositório**

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { LocalStorageMembroRepository } from './LocalStorageMembroRepository'
import { Membro } from '../core/domain/Membro'

describe('LocalStorageMembroRepository', () => {
  let repo: LocalStorageMembroRepository
  
  beforeEach(() => {
    localStorage.clear()
    repo = new LocalStorageMembroRepository()
  })

  it('deve salvar e listar membros', async () => {
    const m = new Membro({ id: '1', nome: 'Luan' })
    await repo.salvar(m)
    const todos = await repo.listarTodos()
    expect(todos).toHaveLength(1)
    expect(todos[0].nome).toBe('Luan')
  })
})
```

- [ ] **Step 2: Implementar o repositório**

```typescript
import { IMembroRepository } from '../core/ports/IMembroRepository'
import { Membro } from '../core/domain/Membro'

export class LocalStorageMembroRepository implements IMembroRepository {
  private readonly STORAGE_KEY = 'divi_membros'

  async salvar(membro: Membro): Promise<void> {
    const membros = await this.listarTodos()
    const index = membros.findIndex(m => m.id === membro.id)
    
    if (index >= 0) {
      membros[index] = membro
    } else {
      membros.push(membro)
    }
    
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(membros))
  }

  async listarTodos(): Promise<Membro[]> {
    const data = localStorage.getItem(this.STORAGE_KEY)
    if (!data) return []
    
    const raw = JSON.parse(data)
    return raw.map((m: any) => new Membro({
      ...m,
      dataCriacao: new Date(m.dataCriacao)
    }))
  }

  async buscarPorId(id: string): Promise<Membro | null> {
    const todos = await this.listarTodos()
    return todos.find(m => m.id === id) || null
  }
}
```

- [ ] **Step 3: Executar testes**

Run: `npx vitest src/modules/ledger/adapters/LocalStorageMembroRepository.test.ts`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/modules/ledger/adapters/LocalStorageMembroRepository.ts src/modules/ledger/adapters/LocalStorageMembroRepository.test.ts
git commit -m "feat(ledger): implementar LocalStorageMembroRepository"
```

---

### Task 3: Composable - Criar `useMembros` com Migração Inicial

**Files:**
- Create: `src/modules/ledger/composables/useMembros.ts`

- [ ] **Step 1: Implementar o composable com lógica de migração**

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

- [ ] **Step 2: Commit**

```bash
git add src/modules/ledger/composables/useMembros.ts
git commit -m "feat(ledger): criar composable useMembros com migração inicial"
```

---

### Task 4: UI - Criar Tela de Gerenciamento e Integrar ao `App.vue`

**Files:**
- Create: `src/components/ledger/ConfiguracoesMembros.vue`
- Modify: `src/App.vue`

- [ ] **Step 1: Criar componente ConfiguracoesMembros.vue**

Implementar lista de membros com botões de adicionar e desativar.

- [ ] **Step 2: Atualizar App.vue para usar o composable e gerenciar a View**

```vue
// No App.vue
const { membros, ativos } = useMembros()
// Substituir a constante membros fixa pelo valor do composable
```

- [ ] **Step 3: Adicionar toggle para acessar configurações**

- [ ] **Step 4: Commit**

```bash
git add src/components/ledger/ConfiguracoesMembros.vue src/App.vue
git commit -m "feat(ui): implementar interface de gestão de moradores"
```

---

### Task 5: Integração - Atualizar Wizard e Dashboard

**Files:**
- Modify: `src/components/ledger/NovoLancamentoWizard.vue`
- Modify: `src/components/ledger/DashboardSaldos.vue`

- [ ] **Step 1: Wizard deve usar apenas membros ativos para novos lançamentos**

- [ ] **Step 2: Dashboard deve exibir nomes de membros inativos se houver transação**

- [ ] **Step 3: Validar fluxos completos**

- [ ] **Step 4: Commit**

```bash
git add src/components/ledger/NovoLancamentoWizard.vue src/components/ledger/DashboardSaldos.vue
git commit -m "refactor(ui): integrar gestão dinâmica no wizard e dashboard"
```
