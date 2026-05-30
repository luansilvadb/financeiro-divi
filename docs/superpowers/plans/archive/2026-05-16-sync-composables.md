# Composables - Sincronismo e Refatoração Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar o composable `useTransacoes` como um Singleton com Lazy Loading e o composable `useStorageSync` para garantir a sincronização reativa de dados entre múltiplas abas do navegador.

**Architecture:** 
- `useTransacoes`: Singleton Pattern utilizando o sistema de reatividade do Vue para manter um estado global compartilhado de transações. Implementa Lazy Loading para carregar dados apenas quando necessário.
- `useStorageSync`: Gerenciador de eventos global que escuta por mudanças no `localStorage` (disparadas por outras abas) e recarrega os repositórios correspondentes.

**Tech Stack:** Vue 3 Composition API (ref, onMounted, onUnmounted), TypeScript.

---

### Task 1: Criar `useTransacoes` Composable

**Files:**
- Create: `src/modules/ledger/composables/useTransacoes.ts`

- [ ] **Step 1: Implementar o Singleton `useTransacoes`**

```typescript
import { ref } from 'vue'
import { Transacao } from '../core/domain/Transacao'
import { LocalStorageTransacaoRepository } from '../adapters/LocalStorageTransacaoRepository'

// Estado global compartilhado por todas as instâncias (Singleton)
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

  // Inicialização lazy garantida: se já não estiver inicializado, dispara o carregamento
  if (!inicializado.value) {
    carregar()
  }

  return { 
    transacoes, 
    carregar, 
    salvar 
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/modules/ledger/composables/useTransacoes.ts
git commit -m "feat(ledger): criar composable useTransacoes com lazy loading singleton"
```

---

### Task 2: Criar `useStorageSync` Composable

**Files:**
- Create: `src/modules/ledger/composables/useStorageSync.ts`

- [ ] **Step 1: Implementar o listener de sincronização**

```typescript
import { onMounted, onUnmounted } from 'vue'
import { useMembros } from './useMembros'
import { useTransacoes } from './useTransacoes'

export function useStorageSync() {
  const { carregar: reloadMembros } = useMembros()
  const { carregar: reloadTransacoes } = useTransacoes()

  const handleStorage = (e: StorageEvent) => {
    // O evento de storage só é disparado para outras abas, não para a aba que fez a alteração
    if (e.key === 'divi_transactions') {
      reloadTransacoes()
    }
    if (e.key === 'divi_membros') {
      reloadMembros()
    }
  }

  onMounted(() => {
    window.addEventListener('storage', handleStorage)
  })

  onUnmounted(() => {
    window.removeEventListener('storage', handleStorage)
  })
}
```

- [ ] **Step 2: Commit**

```bash
git add src/modules/ledger/composables/useStorageSync.ts
git commit -m "feat(ledger): implementar sincronização multi-aba com useStorageSync"
```

---

### Task 3: Refatorar `useMembros` para usar Carregamento Lazy consistente

**Files:**
- Modify: `src/modules/ledger/composables/useMembros.ts`

- [ ] **Step 1: Atualizar `useMembros` para remover `onMounted` interno e usar o mesmo padrão de `useTransacoes`**

```typescript
import { ref, computed } from 'vue'
import { Membro } from '../core/domain/Membro'
import { LocalStorageMembroRepository } from '../adapters/LocalStorageMembroRepository'

// Estado global compartilhado por todas as instâncias do composable (Singleton)
const repository = new LocalStorageMembroRepository()
const membros = ref<Membro[]>([])
const carregado = ref(false)

export function useMembros() {
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
    carregado.value = true
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

  // Garantir carregamento inicial lazy
  if (!carregado.value) {
    carregar()
  }

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
git commit -m "refactor(ledger): unificar padrão de lazy loading em useMembros"
```

---

### Task 4: Verificação Final

- [ ] **Step 1: Verificar se os arquivos foram criados e modificados corretamente**
- [ ] **Step 2: Verificar se não há erros de lint ou tsc**

Run: `npm run type-check` (ou comando equivalente se existir)
