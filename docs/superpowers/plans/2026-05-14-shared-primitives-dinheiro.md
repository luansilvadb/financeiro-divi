# Task 3: Shared Primitives - Dinheiro Value Object Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the `Dinheiro` value object to handle monetary values in cents, avoiding rounding errors.

**Architecture:** Value Object pattern. Internal state stored as `centavos` (integer). Factory methods for creation.

**Tech Stack:** TypeScript, Vitest.

---

### Task 1: Dinheiro Value Object

**Files:**
- Create: `src/shared/primitives/Dinheiro.ts`
- Test: `src/shared/primitives/Dinheiro.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from 'vitest'
import { Dinheiro } from './Dinheiro'

describe('Dinheiro Value Object', () => {
  it('deve criar uma instância com valor centesimal', () => {
    // @ts-ignore - Dinheiro não existe ainda
    const d = Dinheiro.deReais(10.50)
    expect(d.centavos).toBe(1050)
  })

  it('deve formatar para PT-BR', () => {
    // @ts-ignore - Dinheiro não existe ainda
    const d = Dinheiro.deReais(10.50)
    expect(d.formatar()).toBe('R$ 10,50')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest src/shared/primitives/Dinheiro.test.ts --run`
Expected: FAIL (Compilation error or Module not found)

- [ ] **Step 3: Implement minimal Dinheiro VO**

```typescript
export class Dinheiro {
  private constructor(public readonly centavos: number) {}

  static deReais(valor: number): Dinheiro {
    return new Dinheiro(Math.round(valor * 100))
  }

  static deCentavos(centavos: number): Dinheiro {
    return new Dinheiro(centavos)
  }

  formatar(): string {
    return (this.centavos / 100).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).replace(/\s/g, '\u00a0'); // Fix for non-breaking space in some environments
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest src/shared/primitives/Dinheiro.test.ts --run`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/shared/primitives/Dinheiro.ts src/shared/primitives/Dinheiro.test.ts
git commit -m "feat: add Dinheiro value object"
```
