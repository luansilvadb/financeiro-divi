# Ledger Domain Entities Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the core domain entities for the Ledger module (`Transacao` and `Divisao`) with sum validation logic, ensuring every cent is accounted for.

**Architecture:** Domain-Driven Design (DDD) with clean encapsulation. `Transacao` acts as the Aggregate Root. `Divisao` is a Value Object (or simple entity) representing how a transaction is split among beneficiaries.

**Tech Stack:** TypeScript, Vitest.

---

### Task 1: Enhance Dinheiro Value Object

**Files:**
- Modify: `src/shared/primitives/Dinheiro.ts`
- Modify: `src/shared/primitives/Dinheiro.test.ts`

- [ ] **Step 1: Write failing tests for somar and equals**

```typescript
// in src/shared/primitives/Dinheiro.test.ts
  it('deve somar dois valores', () => {
    const d1 = Dinheiro.deReais(10)
    const d2 = Dinheiro.deReais(20)
    expect(d1.somar(d2).centavos).toBe(3000)
  })

  it('deve verificar igualdade', () => {
    const d1 = Dinheiro.deReais(10)
    const d2 = Dinheiro.deReais(10)
    const d3 = Dinheiro.deReais(20)
    expect(d1.equals(d2)).toBe(true)
    expect(d1.equals(d3)).toBe(false)
  })
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest src/shared/primitives/Dinheiro.test.ts --run`

- [ ] **Step 3: Implement somar and equals**

```typescript
  somar(outro: Dinheiro): Dinheiro {
    return new Dinheiro(this.centavos + outro.centavos)
  }

  equals(outro: Dinheiro): boolean {
    return this.centavos === outro.centavos
  }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest src/shared/primitives/Dinheiro.test.ts --run`

- [ ] **Step 5: Commit**

```bash
git add src/shared/primitives/Dinheiro.ts src/shared/primitives/Dinheiro.test.ts
git commit -m "feat(shared): add somar and equals to Dinheiro"
```

### Task 2: Implement Divisao Entity/VO

**Files:**
- Create: `src/modules/ledger/core/domain/Divisao.ts`

- [ ] **Step 1: Implement Divisao class**

```typescript
import { Dinheiro } from '../../../../shared/primitives/Dinheiro'

export class Divisao {
  constructor(
    public readonly beneficiario_id: string,
    public readonly valor: Dinheiro
  ) {}
}
```

- [ ] **Step 2: Commit**

```bash
git add src/modules/ledger/core/domain/Divisao.ts
git commit -m "feat(ledger): add Divisao domain entity"
```

### Task 3: Implement Transacao Entity with Validation

**Files:**
- Create: `src/modules/ledger/core/domain/Transacao.ts`
- Create: `src/modules/ledger/core/domain/Transacao.test.ts`

- [ ] **Step 1: Write the failing tests (provided in requirement)**

```typescript
import { describe, it, expect } from 'vitest'
import { Transacao } from './Transacao'
import { Dinheiro } from '../../../../shared/primitives/Dinheiro'
import { Divisao } from './Divisao'

describe('Transação Entity', () => {
  it('deve permitir criar uma transação válida onde a soma das divisões é igual ao total', () => {
    const total = Dinheiro.deReais(100)
    const divisoes = [
      new Divisao('user1', Dinheiro.deReais(60)),
      new Divisao('user2', Dinheiro.deReais(40))
    ]
    
    const t = new Transacao({
      id: '1',
      descricao: 'Pizza',
      total,
      origem_id: 'user1',
      pagador_id: 'user2',
      divisoes,
      status: 'pendente',
      data: new Date()
    })

    expect(t.total.centavos).toBe(10000)
  })

  it('deve lançar erro se a soma das divisões for diferente do total', () => {
    const total = Dinheiro.deReais(100)
    const divisoes = [
      new Divisao('user1', Dinheiro.deReais(50))
    ]
    
    expect(() => new Transacao({
      id: '1',
      descricao: 'Pizza',
      total,
      origem_id: 'user1',
      pagador_id: 'user2',
      divisoes,
      status: 'pendente',
      data: new Date()
    })).toThrow('A soma das divisões deve ser igual ao total da transação')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest src/modules/ledger/core/domain/Transacao.test.ts --run`

- [ ] **Step 3: Implement Transacao class with validation**

```typescript
import { Dinheiro } from '../../../../shared/primitives/Dinheiro'
import { Divisao } from './Divisao'

export type TransacaoStatus = 'pendente' | 'auditado' | 'em_disputa'

export interface TransacaoProps {
  id: string
  descricao: string
  total: Dinheiro
  origem_id: string
  pagador_id: string
  divisoes: Divisao[]
  status: TransacaoStatus
  data: Date
}

export class Transacao {
  public readonly id: string
  public readonly descricao: string
  public readonly total: Dinheiro
  public readonly origem_id: string
  public readonly pagador_id: string
  public readonly divisoes: Divisao[]
  public readonly status: TransacaoStatus
  public readonly data: Date

  constructor(props: TransacaoProps) {
    this.validarSomaDivisoes(props.divisoes, props.total)
    
    this.id = props.id
    this.descricao = props.descricao
    this.total = props.total
    this.origem_id = props.origem_id
    this.pagador_id = props.pagador_id
    this.divisoes = props.divisoes
    this.status = props.status
    this.data = props.data
  }

  private validarSomaDivisoes(divisoes: Divisao[], total: Dinheiro) {
    const soma = divisoes.reduce(
      (acc, divisao) => acc.somar(divisao.valor),
      Dinheiro.deCentavos(0)
    )

    if (!soma.equals(total)) {
      throw new Error('A soma das divisões deve ser igual au total da transação')
    }
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest src/modules/ledger/core/domain/Transacao.test.ts --run`

- [ ] **Step 5: Commit**

```bash
git add src/modules/ledger/core/domain/Transacao.ts src/modules/ledger/core/domain/Transacao.test.ts
git commit -m "feat(ledger): implement Transacao with sum validation"
```

### Task 4: Module Exposure

**Files:**
- Create: `src/modules/ledger/index.ts`

- [ ] **Step 1: Export entities**

```typescript
export * from './core/domain/Transacao'
export * from './core/domain/Divisao'
```

- [ ] **Step 2: Run all ledger tests**

Run: `npx vitest src/modules/ledger --run`

- [ ] **Step 3: Commit**

```bash
git add src/modules/ledger/index.ts
git commit -m "feat(ledger): expose domain entities"
```
