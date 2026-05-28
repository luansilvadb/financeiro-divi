# Design Spec - Refatoração do EstornoService

**Data:** 2026-05-28  
**Autor:** Antigravity (Google DeepMind)

## Contexto e Objetivo

A classe `EstornoService.ts` gerencia a exclusão física e lógica de gastos, empréstimos e netting de períodos. Durante a análise de código, identificou-se que o método `excluirGasto` repete exatamente o mesmo bloco final de código de exclusão em dois branches condicionais (`if (gasto.grupoParcelasId)` e `else`).

Esta repetição viola o princípio DRY (Don't Repeat Yourself) e aumenta desnecessariamente a complexidade cognitiva do método. O objetivo deste design é extrair o trecho duplicado para após a condicional de validação de parcelas futuras, tornando o método linear e enxuto.

## Abordagem Proposta

### 1. Simplificação do fluxo de `excluirGasto`

Local: `src/models/services/EstornoService.ts`

- Apenas a validação de parcelas subsequentes (`temSubsequente`) permanecerá encapsulada no bloco condicional `if (gasto.grupoParcelasId)`.
- O bloco de exclusão física do gasto e limpeza do netting associado do período será movido para o nível principal do método:
```typescript
    const fatura = await this.faturaRepo.buscarPorId(gasto.faturaId)
    if (fatura && typeof fatura.validarOperacaoPermitida === 'function') {
      fatura.validarOperacaoPermitida()
    }
    await this.gastoRepo.excluir(id)
    if (fatura && !gasto.isSettlement) {
      await this.limparNettingDoPeriodo(fatura.periodo.mes, fatura.periodo.ano)
    }
```

## Impacto nos Testes

A alteração deve manter todos os testes unitários passando (`npx vitest run`) e a compilação do Vite funcionando perfeitamente (`npm run build`).

---
