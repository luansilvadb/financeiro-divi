# Otimização do Wizard de Lançamentos - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Otimizar as funções de validação de passos `canAdvanceLoan` e `canAdvanceExpense` em `useNovoLancamentoWizard.ts` com estruturas `switch/case` clássicas para evitar alocações repetidas de objetos/funções em runtime.

**Architecture:** Substituir a criação dinâmica de Records de funções por condicionais estáticas `switch` baseadas no número do passo (`step`).

**Tech Stack:** TypeScript, Vue 3, Vitest

---

### Task 1: Otimizar validações em useNovoLancamentoWizard.ts

**Files:**
- Modify: `src/viewmodels/useNovoLancamentoWizard.ts:10-43`

- [ ] **Step 1: Substituir lógica dinâmica por switch/case**
  Modifique as funções auxiliares no topo de `src/viewmodels/useNovoLancamentoWizard.ts` para a nova estrutura baseada em `switch`:
  ```typescript
  function canAdvanceLoan(step: number, compradorId: string, borrowerId: string | null, valor: number, descricao: string): boolean {
    switch (step) {
      case 2:
        return !!compradorId
      case 3:
        return !!borrowerId
      case 4:
        return valor > 0
      case 5:
        return descricao.trim().length > 0
      default:
        return false
    }
  }

  function canAdvanceExpense(
    step: number,
    compradorId: string,
    valor: number,
    descricao: string,
    modoDivisao: 'IGUAL' | 'MANUAL',
    participantes: string[],
    valoresDivisao: Record<string, number>
  ): boolean {
    switch (step) {
      case 2:
        return !!compradorId
      case 3:
        return valor > 0
      case 4:
        return descricao.trim().length > 0
      case 5:
        if (modoDivisao === 'IGUAL') {
          return participantes.length > 0
        }
        const valorCentavos = Math.round(valor * 100)
        const somaCentavos = participantes.reduce((acc, id) => acc + Math.round((valoresDivisao[id] || 0) * 100), 0)
        return Math.abs(somaCentavos - valorCentavos) <= 1
      default:
        return false
    }
  }
  ```

- [ ] **Step 2: Rodar testes da suíte do wizard**
  Run: `npx vitest run src/viewmodels/useNovoLancamentoWizard.test.ts`
  Expected: PASS (todos os 13 testes do hook passam sem falhas)

- [ ] **Step 3: Rodar a suíte completa de testes**
  Run: `npx vitest run`
  Expected: PASS (todos os 257 testes passam)

- [ ] **Step 4: Validar build de produção**
  Run: `npm run build`
  Expected: Build completado com sucesso sem erros de tipagem.

- [ ] **Step 5: Commit**
  ```bash
  git add src/viewmodels/useNovoLancamentoWizard.ts
  git commit -m "perf: optimize wizard step validations using static switch-case"
  ```
