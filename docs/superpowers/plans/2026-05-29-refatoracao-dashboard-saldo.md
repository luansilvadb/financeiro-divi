# Refatoração do Dashboard Saldo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refatorar a lógica do DashboardSaldoService para simplificar a estrutura de condicionais e extrair predicados puros legíveis, mantendo 100% de cobertura e corretude de testes.

**Architecture:** Extração de funções predicadas auxiliares (`ehGastoDeCartao`, `deveIrParaSaldoReal`, `deveIrParaPrevisaoCartao`) para simplificar o loop de classificação de gastos no serviço.

**Tech Stack:** TypeScript, Vitest

---

### Task 1: Refatorar o DashboardSaldoService

**Files:**
- Modify: `src/models/services/DashboardSaldoService.ts`
- Test: `src/models/services/DashboardSaldoService.test.ts`

- [ ] **Step 1: Rodar os testes atuais para certificar de que estão passando**

Run: `npx vitest run src/models/services/DashboardSaldoService.test.ts`
Expected: 7 testes passando com sucesso.

- [ ] **Step 2: Implementar a nova estrutura com predicados e atualizar a lógica**

Modificar [DashboardSaldoService.ts](file:///d:/projetos/divi/src/models/services/DashboardSaldoService.ts):

```typescript
import type { Fatura } from '../entities/Fatura'
import type { Gasto } from '../entities/Gasto'
import { valorParcelaAtual } from '../entities/ParcelaCalculator'

export interface SeparacaoGastosDashboard {
  gastosSaldoReal: Gasto[]
  gastosPrevisaoCartao: Gasto[]
}

function obterPeriodoDoGasto(gasto: Gasto, fatura?: Fatura): { mes: number; ano: number } | null {
  if (fatura?.periodo) {
    return { mes: fatura.periodo.mes, ano: fatura.periodo.ano }
  }
  const match = gasto.faturaId.match(/(?:.*-)?(\d+)-(\d+)$/)
  if (match) {
    return {
      mes: parseInt(match[1], 10),
      ano: parseInt(match[2], 10)
    }
  }
  return null
}

function temCartaoFechadoNoPeriodo(periodo: { mes: number; ano: number } | null, faturas: Fatura[]): boolean {
  if (!periodo) return false
  return faturas.some(
    f => f.cartaoId !== 'PIX_DEFAULT_ID' &&
         f.periodo.mes === periodo.mes &&
         f.periodo.ano === periodo.ano &&
         f.status !== 'ABERTA'
  )
}

function deveIncluirSettlement(
  gasto: Gasto,
  faturaAberta: boolean,
  fatura: Fatura | undefined,
  faturas: Fatura[]
): boolean {
  if (gasto.settlementDetails) {
    const periodo = obterPeriodoDoGasto(gasto, fatura)
    const temFechado = temCartaoFechadoNoPeriodo(periodo, faturas)
    return faturaAberta && !temFechado
  }
  
  return faturaAberta
}

function ehGastoDeCartao(gasto: Gasto): boolean {
  return gasto.method === 'card' || !!gasto.cardOwner
}

function deveIrParaSaldoReal(
  gasto: Gasto,
  faturaAberta: boolean,
  fatura: Fatura | undefined,
  faturas: Fatura[]
): boolean {
  if (gasto.isSettlement) {
    return deveIncluirSettlement(gasto, faturaAberta, fatura, faturas)
  }
  
  if (gasto.isLoan) {
    return true
  }

  return faturaAberta && !ehGastoDeCartao(gasto)
}

function deveIrParaPrevisaoCartao(gasto: Gasto, faturaAberta: boolean): boolean {
  if (gasto.isSettlement || gasto.isLoan) {
    return false
  }

  return faturaAberta && ehGastoDeCartao(gasto)
}

export function separarGastosSaldoRealEPreviaCartao(
  gastos: Gasto[],
  faturas: Fatura[]
): SeparacaoGastosDashboard {
  const faturasPorId = new Map(faturas.map(f => [f.id, f]))
  const gastosSaldoReal: Gasto[] = []
  const gastosPrevisaoCartao: Gasto[] = []

  for (const gasto of gastos) {
    const fatura = faturasPorId.get(gasto.faturaId)
    const faturaAberta = !fatura || fatura.status === 'ABERTA'

    if (deveIrParaSaldoReal(gasto, faturaAberta, fatura, faturas)) {
      gastosSaldoReal.push(gasto)
    } else if (deveIrParaPrevisaoCartao(gasto, faturaAberta)) {
      gastosPrevisaoCartao.push(gasto)
    }
  }

  return { gastosSaldoReal, gastosPrevisaoCartao }
}

export function calcularPreviaCartaoAberto(gastos: Gasto[]): Record<string, number> {
  const totalPorMembro: Record<string, number> = {}

  for (const gasto of gastos) {
    for (const div of gasto.divisoes) {
      const valor = valorParcelaAtual(div.valor, gasto.installments, gasto.totalInstallments)
      if (valor.centavos > 0) {
        totalPorMembro[div.membroId] = (totalPorMembro[div.membroId] || 0) + valor.centavos
      }
    }
  }

  return totalPorMembro
}
```

- [ ] **Step 3: Rodar novamente os testes e garantir que continuam passando**

Run: `npx vitest run src/models/services/DashboardSaldoService.test.ts`
Expected: 7 testes passando com sucesso.

- [ ] **Step 4: Realizar o commit das alterações**

```bash
git add src/models/services/DashboardSaldoService.ts
git commit -m "refactor: simplificar condicionais do DashboardSaldoService extraindo predicados"
```
