# Otimização do Algoritmo de Acertos Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refinar a precisão e eficiência do sistema de acertos através de guardas de segurança, filtragem de dados e implementação de backtracking.

**Architecture:** Melhoria das primitivas de `Dinheiro` e evolução do algoritmo da `CalculadoraSaldos` para lidar com casos complexos de liquidação financeira.

**Tech Stack:** TypeScript, Vitest.

---

### Task 1: Reforçar Classe `Dinheiro` com Guards

**Files:**
- Modify: `src/shared/primitives/Dinheiro.ts`
- Modify: `src/shared/primitives/Dinheiro.test.ts`

- [ ] **Step 1: Escrever teste para o erro em `distribuir(0)`**

```typescript
// Em src/shared/primitives/Dinheiro.test.ts
it('deve lançar erro ao tentar distribuir por zero ou negativo', () => {
  const d = Dinheiro.deReais(10)
  expect(() => d.distribuir(0)).toThrow('Número de partes deve ser maior que zero')
  expect(() => d.distribuir(-1)).toThrow('Número de partes deve ser maior que zero')
})
```

- [ ] **Step 2: Implementar guards em `distribuir`**

```typescript
// Em src/shared/primitives/Dinheiro.ts
distribuir(n: number): Dinheiro[] {
  if (n <= 0) throw new Error("Número de partes deve ser maior que zero")
  if (n === 1) return [new Dinheiro(this.centavos)]

  const quociente = Math.trunc(this.centavos / n)
  let resto = this.centavos % n
  // ... resto do código igual
}
```

- [ ] **Step 3: Executar testes**

Run: `npx vitest src/shared/primitives/Dinheiro.test.ts`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/shared/primitives/Dinheiro.ts src/shared/primitives/Dinheiro.test.ts
git commit -m "fix(ledger): adicionar guards e otimização na distribuição de dinheiro"
```

---

### Task 2: Filtrar Saldos Zero na Consolidação

**Files:**
- Modify: `src/modules/ledger/core/services/CalculadoraSaldos.ts`
- Modify: `src/modules/ledger/core/services/CalculadoraSaldos.test.ts`

- [ ] **Step 1: Escrever teste para filtragem de membros quitados**

```typescript
// Em src/modules/ledger/core/services/CalculadoraSaldos.test.ts
it('deve filtrar membros que possuem saldo zero (quitados)', () => {
  const t = new Transacao({
    id: 't1',
    descricao: 'Teste',
    total: Dinheiro.deReais(10),
    pagamentos: [{ membro_id: 'ana', valor: Dinheiro.deReais(10) }],
    divisoes: [new Divisao('ana', Dinheiro.deReais(10))], // Ana pagou e consumiu o mesmo
    status: 'pendente',
    data: new Date()
  })
  
  const saldos = CalculadoraSaldos.calcular([t])
  expect(saldos.has('ana')).toBe(false)
  expect(saldos.size).toBe(0)
})
```

- [ ] **Step 2: Implementar filtro na `CalculadoraSaldos.calcular`**

```typescript
// Em src/modules/ledger/core/services/CalculadoraSaldos.ts -> calcular()
const result = new Map<string, Dinheiro>()
for (const [id, centavos] of saldosCentavos.entries()) {
  if (centavos !== 0) {
    result.set(id, Dinheiro.deCentavos(centavos))
  }
}
return result
```

- [ ] **Step 3: Executar testes**

Run: `npx vitest src/modules/ledger/core/services/CalculadoraSaldos.test.ts`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/modules/ledger/core/services/CalculadoraSaldos.ts src/modules/ledger/core/services/CalculadoraSaldos.test.ts
git commit -m "perf(ledger): filtrar membros com saldo zero na calculadora"
```

---

### Task 3: Implementar Backtracking no Algoritmo de Acertos

**Files:**
- Modify: `src/modules/ledger/core/services/CalculadoraSaldos.ts`
- Modify: `src/modules/ledger/core/services/CalculadoraSaldos.test.ts`

- [ ] **Step 1: Refatorar `calcularAcertos` para usar abordagem recursiva com backtracking real**

```typescript
// Em src/modules/ledger/core/services/CalculadoraSaldos.ts

static calcularAcertos(saldos: Map<string, Dinheiro>): Acerto[] {
  const ids = Array.from(saldos.keys())
  const valoresCentavos = ids.map(id => saldos.get(id)!.centavos)
  const acertos: Acerto[] = []

  this._resolverAcertos(valoresCentavos, ids, acertos)
  return acertos
}

private static _resolverAcertos(saldos: number[], ids: string[], acertos: Acerto[]): void {
  const i = saldos.findIndex(s => s < 0)
  if (i === -1) return // nenhum devedor restante, acabou

  for (let j = 0; j < saldos.length; j++) {
    if (saldos[j] <= 0) continue // pula quem não é credor

    const transferencia = Math.min(Math.abs(saldos[i]), saldos[j])

    // Trabalha em cópia para preservar o estado original para o backtrack
    const novosSaldos = [...saldos]
    novosSaldos[i] += transferencia
    novosSaldos[j] -= transferencia

    acertos.push({ 
      de: ids[i], 
      para: ids[j], 
      valor: Dinheiro.deCentavos(transferencia) 
    })

    this._resolverAcertos(novosSaldos, ids, acertos)

    // Se o devedor i foi totalmente quitado na cópia, retornamos
    if (novosSaldos[i] === 0) return

    // Backtrack real: remove o acerto e tenta próximo credor
    acertos.pop()
  }
}
```

- [ ] **Step 2: Adicionar teste para cenário complexo de otimização**

```typescript
// Em src/modules/ledger/core/services/CalculadoraSaldos.test.ts
it('deve encontrar o menor número de transferências em cenários fragmentados', () => {
  const saldos = new Map([
    ['alice', Dinheiro.deCentavos(500)],
    ['bob', Dinheiro.deCentavos(-300)],
    ['carol', Dinheiro.deCentavos(100)],
    ['dan', Dinheiro.deCentavos(-300)]
  ])
  
  const acertos = CalculadoraSaldos.calcularAcertos(saldos)
  // Verifica se o total de transferências é otimizado (geralmente 3 aqui)
  expect(acertos.length).toBeLessThanOrEqual(3)
  
  // Verifica se os saldos finais seriam zerados
  const saldosFinais = new Map(saldos)
  acertos.forEach(a => {
    saldosFinais.set(a.de, saldosFinais.get(a.de)!.somar(a.valor))
    saldosFinais.set(a.para, saldosFinais.get(a.para)!.subtrair(a.valor))
  })
  
  for (const saldo of saldosFinais.values()) {
    expect(saldo.isZero()).toBe(true)
  }
})
```

- [ ] **Step 3: Executar todos os testes**

Run: `npx vitest run`
Expected: 77/77 PASS

- [ ] **Step 4: Commit**

```bash
git add src/modules/ledger/core/services/CalculadoraSaldos.ts src/modules/ledger/core/services/CalculadoraSaldos.test.ts
git commit -m "feat(ledger): implementar algoritmo de acertos com backtracking corrigido"
```
