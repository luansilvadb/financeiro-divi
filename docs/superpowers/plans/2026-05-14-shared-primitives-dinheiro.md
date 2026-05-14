# Shared Primitives - Dinheiro Value Object Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Implement a robust `Dinheiro` value object to handle monetary values in cents, avoiding rounding errors, and providing safe arithmetic, comparison, and allocation (splitting) operations.

**Architecture:** Immutable Value Object pattern. Internal state stored as `centavos` (integer). Includes arithmetic operations that return new instances and allocation logic for penny-accurate splitting.

**Tech Stack:** TypeScript, Vitest.

---

### Task 1: Basic Arithmetic (Subtração)

**Files:**
- Modify: `src/shared/primitives/Dinheiro.ts`
- Test: `src/shared/primitives/Dinheiro.test.ts`

- [x] **Step 1: Write failing test for subtraction**

```typescript
it('deve subtrair dois valores', () => {
  const d1 = Dinheiro.deReais(20)
  const d2 = Dinheiro.deReais(5.50)
  expect(d1.subtrair(d2).centavos).toBe(1450)
})
```

- [x] **Step 2: Run test to verify failure**

Run: `npx vitest src/shared/primitives/Dinheiro.test.ts --run`
Expected: FAIL (subtrair is not a function)

- [x] **Step 3: Implement subtrair**

```typescript
// No src/shared/primitives/Dinheiro.ts
subtrair(outro: Dinheiro): Dinheiro {
  return new Dinheiro(this.centavos - outro.centavos)
}
```

- [x] **Step 4: Verify test passes**

Run: `npx vitest src/shared/primitives/Dinheiro.test.ts --run`
Expected: PASS

- [x] **Step 5: Commit**

```bash
git add src/shared/primitives/Dinheiro.ts src/shared/primitives/Dinheiro.test.ts
git commit -m "feat(shared): add subtrair to Dinheiro"
```

---

### Task 2: Comparison Operations

**Files:**
- Modify: `src/shared/primitives/Dinheiro.ts`
- Test: `src/shared/primitives/Dinheiro.test.ts`

- [x] **Step 1: Write failing tests for comparisons**

```typescript
describe('Comparisons', () => {
  it('deve verificar maiorQue', () => {
    const d1 = Dinheiro.deReais(20)
    const d2 = Dinheiro.deReais(10)
    expect(d1.maiorQue(d2)).toBe(true)
    expect(d2.maiorQue(d1)).toBe(false)
  })

  it('deve verificar menorQue', () => {
    const d1 = Dinheiro.deReais(10)
    const d2 = Dinheiro.deReais(20)
    expect(d1.menorQue(d2)).toBe(true)
    expect(d2.menorQue(d1)).toBe(false)
  })

  it('deve verificar se é zero', () => {
    expect(Dinheiro.deCentavos(0).isZero()).toBe(true)
    expect(Dinheiro.deCentavos(1).isZero()).toBe(false)
  })

  it('deve verificar se é positivo ou negativo', () => {
    expect(Dinheiro.deCentavos(10).isPositivo()).toBe(true)
    expect(Dinheiro.deCentavos(-10).isNegativo()).toBe(true)
  })
})
```

- [x] **Step 2: Run test to verify failure**

Run: `npx vitest src/shared/primitives/Dinheiro.test.ts --run`

- [x] **Step 3: Implement comparison methods**

```typescript
maiorQue(outro: Dinheiro): boolean {
  return this.centavos > outro.centavos
}

menorQue(outro: Dinheiro): boolean {
  return this.centavos < outro.centavos
}

isZero(): boolean {
  return this.centavos === 0
}

isPositivo(): boolean {
  return this.centavos > 0
}

isNegativo(): boolean {
  return this.centavos < 0
}
```

- [x] **Step 4: Verify tests pass**

Run: `npx vitest src/shared/primitives/Dinheiro.test.ts --run`

- [x] **Step 5: Commit**

```bash
git add src/shared/primitives/Dinheiro.ts src/shared/primitives/Dinheiro.test.ts
git commit -m "feat(shared): add comparison methods to Dinheiro"
```

---

### Task 3: Multiplication and Percentages

**Files:**
- Modify: `src/shared/primitives/Dinheiro.ts`
- Test: `src/shared/primitives/Dinheiro.test.ts`

- [x] **Step 1: Write failing test for multiplication**

```typescript
it('deve multiplicar por um fator (arredondando centavos)', () => {
  // 10.55 * 0.5 = 5.275 -> 5.28
  const d = Dinheiro.deReais(10.55)
  expect(d.multiplicar(0.5).centavos).toBe(528)
})
```

- [x] **Step 2: Run test to verify failure**

Run: `npx vitest src/shared/primitives/Dinheiro.test.ts --run`

- [x] **Step 3: Implement multiplicar**

```typescript
multiplicar(fator: number): Dinheiro {
  return new Dinheiro(Math.round(this.centavos * fator))
}
```

- [x] **Step 4: Verify test passes**

Run: `npx vitest src/shared/primitives/Dinheiro.test.ts --run`

- [x] **Step 5: Commit**

```bash
git add src/shared/primitives/Dinheiro.ts src/shared/primitives/Dinheiro.test.ts
git commit -m "feat(shared): add multiplicar to Dinheiro"
```

---

### Task 4: Allocation (Splitting without penny loss)

**Files:**
- Modify: `src/shared/primitives/Dinheiro.ts`
- Test: `src/shared/primitives/Dinheiro.test.ts`

- [x] **Step 1: Write failing test for allocation**

```typescript
it('deve distribuir o valor proporcionalmente sem perder centavos', () => {
  // R$ 0,05 distribuído em 3 partes iguais
  // 5 centavos / 3 = 1.666...
  // Deve resultar em [2, 2, 1] ou [2, 1, 2] etc, totalizando 5.
  const d = Dinheiro.deCentavos(5)
  const partes = d.distribuir(3)
  
  expect(partes.length).toBe(3)
  const soma = partes.reduce((acc, p) => acc + p.centavos, 0)
  expect(soma).toBe(5)
  expect(partes[0].centavos).toBe(2)
  expect(partes[1].centavos).toBe(2)
  expect(partes[2].centavos).toBe(1)
})

it('deve distribuir por pesos', () => {
  // R$ 1,00 (100 centavos) com pesos 70 e 30
  const d = Dinheiro.deReais(1)
  const partes = d.distribuirPorPesos([70, 30])
  expect(partes[0].centavos).toBe(70)
  expect(partes[1].centavos).toBe(30)
})
```

- [x] **Step 2: Run test to verify failure**

Run: `npx vitest src/shared/primitives/Dinheiro.test.ts --run`

- [x] **Step 3: Implement distributing logic**

```typescript
distribuir(n: number): Dinheiro[] {
  const quociente = Math.floor(this.centavos / n)
  let resto = this.centavos % n
  
  const resultados: Dinheiro[] = []
  for (let i = 0; i < n; i++) {
    const adicional = resto > 0 ? 1 : (resto < 0 ? -1 : 0)
    resultados.push(new Dinheiro(quociente + adicional))
    if (resto > 0) resto--
    else if (resto < 0) resto++
  }
  return resultados
}

distribuirPorPesos(pesos: number[]): Dinheiro[] {
  const totalPesos = pesos.reduce((acc, p) => acc + p, 0)
  let centavosRestantes = this.centavos
  
  const resultados = pesos.map(p => {
    const valor = Math.floor(this.centavos * p / totalPesos)
    centavosRestantes -= valor
    return valor
  })

  // Distribuir o resto (centavos órfãos) pelos primeiros pesos
  for (let i = 0; i < centavosRestantes; i++) {
    resultados[i]++
  }

  return resultados.map(c => new Dinheiro(c))
}
```

- [x] **Step 4: Verify tests pass**

Run: `npx vitest src/shared/primitives/Dinheiro.test.ts --run`

- [x] **Step 5: Commit**

```bash
git add src/shared/primitives/Dinheiro.ts src/shared/primitives/Dinheiro.test.ts
git commit -m "feat(shared): add distribution methods to Dinheiro"
```
