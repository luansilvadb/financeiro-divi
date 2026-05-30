# Refatoração do EstornoService - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminar código duplicado e reduzir a complexidade ciclomática do método `excluirGasto` em `EstornoService.ts` unificando o fluxo de exclusão física comum.

**Architecture:** Mover a lógica comum de validação de fatura permitida, exclusão física e limpeza de netting para o fluxo linear do método, deixando apenas validações específicas de parcelamentos subsequentes encapsuladas no bloco condicional.

**Tech Stack:** TypeScript, Vitest

---

### Task 1: Simplificar excluirGasto em EstornoService.ts

**Files:**
- Modify: `src/models/services/EstornoService.ts:89-118`

- [ ] **Step 1: Unificar a lógica de exclusão física**
  Modifique a parte final do método `excluirGasto` no arquivo `src/models/services/EstornoService.ts` para remover a duplicação e torná-lo linear:
  ```typescript
      if (gasto.grupoParcelasId) {
        const todos = (await this.gastoRepo.listarTodos()) || []
        const grupo = todos.filter(g => g.grupoParcelasId === gasto.grupoParcelasId)

        const temSubsequente = grupo.some(g => g.id !== gasto.id && g.installments < gasto.installments)
        if (temSubsequente) {
          throw new Error(
            'Não é possível excluir esta parcela pois existem parcelas subsequentes ativas. Exclua as parcelas futuras deste gasto primeiro.'
          )
        }
      }

      const fatura = await this.faturaRepo.buscarPorId(gasto.faturaId)
      if (fatura && typeof fatura.validarOperacaoPermitida === 'function') {
        fatura.validarOperacaoPermitida()
      }
      await this.gastoRepo.excluir(id)
      if (fatura && !gasto.isSettlement) {
        await this.limparNettingDoPeriodo(fatura.periodo.mes, fatura.periodo.ano)
      }
  ```

- [ ] **Step 2: Rodar testes automatizados**
  Run: `npx vitest run`
  Expected: PASS (todos os 257 testes passam, inclusive os de estorno)

- [ ] **Step 3: Validar compilação do projeto**
  Run: `npm run build`
  Expected: Build completado com sucesso sem erros de tipagem.

- [ ] **Step 4: Commit**
  ```bash
  git add src/models/services/EstornoService.ts
  git commit -m "refactor: eliminate duplicated delete logic in EstornoService"
  ```
