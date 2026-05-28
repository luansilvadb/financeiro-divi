# Design Spec - Otimização de Validações do Wizard de Lançamentos

**Data:** 2026-05-28  
**Autor:** Antigravity (Google DeepMind)

## Contexto e Objetivo

O hook `useNovoLancamentoWizard.ts` gerencia o estado do formulário de novo lançamento em 5 passos. Para avaliar se o usuário pode avançar ao próximo passo, as funções auxiliares `canAdvanceLoan` e `canAdvanceExpense` criam a cada chamada uma estrutura de mapeamento chave-valor (`Record<number, () => boolean>`) com funções anônimas na memória heap.

Como a computada `canAdvance` depende dos valores em tempo real digitados no formulário, a reavaliação é disparada frequentemente na digitação. O objetivo deste design é otimizar esse fluxo utilizando condicionais estáticas `switch/case`, eliminando a alocação redundante de memória em runtime e aumentando a legibilidade.

## Abordagem Proposta

### 1. Refatorar canAdvanceLoan e canAdvanceExpense

Local: `src/viewmodels/useNovoLancamentoWizard.ts`

Substituir o mapeamento dinâmico por um `switch(step)` em ambas as funções:

- Em `canAdvanceLoan`:
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
```

- Em `canAdvanceExpense`:
```typescript
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

## Impacto nos Testes

Os testes da suíte do wizard (`useNovoLancamentoWizard.test.ts` e `NovoLancamentoWizard.test.ts`) devem passar normalmente sem qualquer alteração no comportamento esperado do componente.

---
