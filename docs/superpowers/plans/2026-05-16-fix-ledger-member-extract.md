# Correção do Extrato de Membro e Melhoria de Testes

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corrigir a lógica de soma no extrato de membros para suportar múltiplos pagamentos/divisões por transação e garantir a integridade dos dados através de testes exaustivos.

**Architecture:** Refatorar `obterExtratoMembro` para utilizar `reduce` ao invés de `find`. Adicionar casos de teste que validam ordenação, acúmulo de saldo e somas parciais.

**Tech Stack:** TypeScript, Vitest.

---

### Task 1: Preparar Testes Falhantes (RED)

**Files:**
- Modify: `src/modules/ledger/core/services/CalculadoraSaldos.test.ts`

- [ ] **Step 1: Adicionar teste para ordenação por data e saldo acumulado (3+ transações)**

```typescript
  it('deve ordenar transações por data e acumular saldo corretamente (3+ transações)', () => {
    const t1 = new Transacao({
      id: 't1',
      descricao: 'T1',
      total: Dinheiro.deReais(100),
      pagamentos: [{ membro_id: 'A', valor: Dinheiro.deReais(100) }],
      divisoes: [new Divisao('A', Dinheiro.deReais(50)), new Divisao('B', Dinheiro.deReais(50))],
      status: 'pendente',
      data: new Date('2026-05-10')
    })
    const t2 = new Transacao({
      id: 't2',
      descricao: 'T2',
      total: Dinheiro.deReais(40),
      pagamentos: [{ membro_id: 'A', valor: Dinheiro.deReais(40) }],
      divisoes: [new Divisao('A', Dinheiro.deReais(20)), new Divisao('B', Dinheiro.deReais(20))],
      status: 'pendente',
      data: new Date('2026-05-05') // Anterior a t1
    })
    const t3 = new Transacao({
      id: 't3',
      descricao: 'T3',
      total: Dinheiro.deReais(60),
      pagamentos: [{ membro_id: 'B', valor: Dinheiro.deReais(60) }],
      divisoes: [new Divisao('A', Dinheiro.deReais(30)), new Divisao('B', Dinheiro.deReais(30))],
      status: 'pendente',
      data: new Date('2026-05-15') // Posterior a t1
    })

    const extrato = CalculadoraSaldos.obterExtratoMembro('A', [t1, t2, t3])
    
    expect(extrato).toHaveLength(3)
    // Ordem esperada: t2 (05-05), t1 (05-10), t3 (05-15)
    expect(extrato[0].id).toBe('t2')
    expect(extrato[1].id).toBe('t1')
    expect(extrato[2].id).toBe('t3')

    // Saldos acumulados para A:
    // t2: +20 (Pago 40, cons 20) -> Acum: 20
    // t1: +50 (Pago 100, cons 50) -> Acum: 70
    // t3: -30 (Pago 0, cons 30) -> Acum: 40
    expect(extrato[0].saldoAcumulado.centavos).toBe(2000)
    expect(extrato[1].saldoAcumulado.centavos).toBe(7000)
    expect(extrato[2].saldoAcumulado.centavos).toBe(4000)
  })
```

- [ ] **Step 2: Adicionar teste para múltiplos pagamentos/divisões na mesma transação**

```typescript
  it('deve somar corretamente múltiplos pagamentos e divisões para o mesmo membro em uma transação', () => {
    const t1 = new Transacao({
      id: 't1',
      descricao: 'Jantar Complexo',
      total: Dinheiro.deReais(150),
      pagamentos: [
        { membro_id: 'A', valor: Dinheiro.deReais(50) },
        { membro_id: 'A', valor: Dinheiro.deReais(50) },
        { membro_id: 'B', valor: Dinheiro.deReais(50) }
      ],
      divisoes: [
        new Divisao('A', Dinheiro.deReais(30)),
        new Divisao('A', Dinheiro.deReais(20)),
        new Divisao('B', Dinheiro.deReais(100))
      ],
      status: 'pendente',
      data: new Date('2026-05-01')
    })

    const extrato = CalculadoraSaldos.obterExtratoMembro('A', [t1])
    
    // A: Pagou 50+50 = 100. Consumiu 30+20 = 50. Liquido = +50.
    expect(extrato[0].valorPago.centavos).toBe(10000)
    expect(extrato[0].valorConsumido.centavos).toBe(5000)
    expect(extrato[0].valorLiquido.centavos).toBe(5000)
  })
```

- [ ] **Step 3: Executar testes e verificar falha**

Run: `npm test src/modules/ledger/core/services/CalculadoraSaldos.test.ts`
Expected: FAIL (especialmente no Step 2 devido ao uso de `.find()`)

### Task 2: Corrigir Implementação (GREEN)

**Files:**
- Modify: `src/modules/ledger/core/services/CalculadoraSaldos.ts`

- [ ] **Step 1: Atualizar `obterExtratoMembro` para somar valores**

```typescript
  static obterExtratoMembro(membroId: string, transacoes: Transacao[]): ItemExtrato[] {
    const transacoesOrdenadas = [...transacoes].sort((a, b) => a.data.getTime() - b.data.getTime())
    
    let saldoAcumulado = Dinheiro.deCentavos(0)
    
    return transacoesOrdenadas.map(t => {
      const centavosPagos = t.pagamentos
        .filter(p => p.membro_id === membroId)
        .reduce((acc, p) => acc + p.valor.centavos, 0)
        
      const centavosConsumidos = t.divisoes
        .filter(d => d.beneficiario_id === membroId)
        .reduce((acc, d) => acc + d.valor.centavos, 0)

      const valorPago = Dinheiro.deCentavos(centavosPagos)
      const valorConsumido = Dinheiro.deCentavos(centavosConsumidos)
      const valorLiquido = valorPago.subtrair(valorConsumido)
      
      saldoAcumulado = saldoAcumulado.somar(valorLiquido)
      
      return {
        id: t.id,
        descricao: t.descricao,
        data: t.data,
        valorPago,
        valorConsumido,
        valorLiquido,
        saldoAcumulado
      }
    })
  }
```

- [ ] **Step 2: Executar testes e verificar sucesso**

Run: `npm test src/modules/ledger/core/services/CalculadoraSaldos.test.ts`
Expected: PASS

- [ ] **Step 3: Commit das correções**

```bash
git add src/modules/ledger/core/services/CalculadoraSaldos.ts src/modules/ledger/core/services/CalculadoraSaldos.test.ts
git commit -m "fix(ledger): soma múltiplos pagamentos/divisões no extrato e melhora testes"
```
