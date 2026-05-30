# Extração de Lógica de Formatação e Helpers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mover a lógica de geração da lista de meses do seletor do dashboard para um utilitário compartilhado.

**Architecture:** Extração de lógica de UI de viewmodels para helpers puros (`src/shared/utils/meses.ts`).

**Tech Stack:** TypeScript, Vue 3, Vitest.

---

### Task 1: Criar Teste para `gerarListaMesesSeletor`

**Files:**
- Create: `src/shared/utils/meses.test.ts`

- [ ] **Step 1: Escrever o teste falho**

```typescript
import { describe, it, expect, vi } from 'vitest'
import { gerarListaMesesSeletor } from './meses'

describe('meses util', () => {
  it('deve gerar lista de 25 meses centrada no mês atual', () => {
    // Fixa a data hoje para 15/05/2024
    vi.setSystemTime(new Date(2024, 4, 15))

    const faturasFechadas = [
      { periodo: { mes: 4, ano: 2024 } }
    ]

    const lista = gerarListaMesesSeletor(faturasFechadas)

    expect(lista).toHaveLength(25) // -12 a +12 inclusive = 25
    expect(lista[12].mes).toBe(5) // Mês atual
    expect(lista[12].ano).toBe(2024)
    expect(lista[12].status).toBe('ABERTA')
    
    // Mês anterior (Abril) deve estar fechado conforme o mock
    expect(lista[11].mes).toBe(4)
    expect(lista[11].status).toBe('FECHADA')

    vi.useRealTimers()
  })
})
```

- [ ] **Step 2: Rodar teste para verificar se falha**

Run: `npm test src/shared/utils/meses.test.ts`
Expected: FAIL (função não exportada)

### Task 2: Implementar `gerarListaMesesSeletor` em `meses.ts`

**Files:**
- Modify: `src/shared/utils/meses.ts`

- [ ] **Step 1: Escrever a implementação mínima**

```typescript
export function gerarListaMesesSeletor(faturasFechadas: any[]) {
  const hoje = new Date()
  const list = []
  for (let i = -12; i <= 12; i++) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() + i, 1)
    const mesIdx = d.getMonth() + 1
    const anoIdx = d.getFullYear()
    const estaFechada = faturasFechadas.some(f => f.periodo.mes === mesIdx && f.periodo.ano === anoIdx)
    list.push({
      mes: mesIdx,
      ano: anoIdx,
      nome: formatarMesAno(mesIdx, anoIdx),
      status: estaFechada ? 'FECHADA' : 'ABERTA' as 'FECHADA' | 'ABERTA'
    })
  }
  return list
}
```

- [ ] **Step 2: Rodar teste para verificar se passa**

Run: `npm test src/shared/utils/meses.test.ts`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/shared/utils/meses.ts src/shared/utils/meses.test.ts
git commit -m "refactor: implement gerarListaMesesSeletor utility"
```

### Task 3: Refatorar `useDashboardViewModel.ts`

**Files:**
- Modify: `src/viewmodels/useDashboardViewModel.ts`

- [ ] **Step 1: Importar e utilizar a nova função**

Substitua a lógica do `computed(() => listaMesesSeletor)` pela chamada da função.

```typescript
import { formatarMesAno, gerarListaMesesSeletor } from '../shared/utils/meses'

// ... dentro do useDashboardViewModel ...

  // --- Seletor de Meses ---
  const listaMesesSeletor = computed(() => gerarListaMesesSeletor(props.faturasFechadas))
```

- [ ] **Step 2: Rodar testes do ViewModel (se existirem)**

Run: `npm test src/viewmodels/useDashboardViewModel.test.ts`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/viewmodels/useDashboardViewModel.ts
git commit -m "refactor: use gerarListaMesesSeletor utility in dashboard viewmodel"
```
