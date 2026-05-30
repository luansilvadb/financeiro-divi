# Refatoração do GastoService Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refatorar o método `atualizarGastoCompleto` no `GastoService` para reduzir a complexidade ciclomática e melhorar a legibilidade.

**Architecture:** Decomposição do método principal em métodos privados especializados, extração de lógica de busca de períodos e uso de guard clauses para simplificar o fluxo de decisão.

**Tech Stack:** TypeScript, Vitest.

---

### Task 1: Extrair Cálculo de Períodos Genérico

**Files:**
- Modify: `src/models/services/GastoService.ts`

- [ ] **Step 1: Criar o método privado `obterPeriodosDoGasto`**

```typescript
  private async obterPeriodosDoGasto(gasto: Gasto): Promise<{ mes: number; ano: number }[]> {
    const periodos: { mes: number; ano: number }[] = []
    
    const gastosParaProcessar = gasto.grupoParcelasId 
      ? (await this.gastoRepo.listarTodos()).filter(g => g.grupoParcelasId === gasto.grupoParcelasId)
      : [gasto]

    for (const g of gastosParaProcessar) {
      const fat = await this.faturaRepo.buscarPorId(g.faturaId)
      if (fat) {
        periodos.push({ mes: fat.periodo.mes, ano: fat.periodo.ano })
      }
    }
    return periodos
  }
```

- [ ] **Step 2: Substituir `obterPeriodosOriginal` e `obterPeriodosDepois` pelo novo método**

```typescript
    // No atualizarGastoCompleto:
    const periodosOriginal = await this.obterPeriodosDoGasto(original)
    // ...
    const atualizado = await this.gastoRepo.buscarPorId(gastoId)
    const periodosDepois = atualizado ? await this.obterPeriodosDoGasto(atualizado) : []
```

- [ ] **Step 3: Remover métodos antigos `obterPeriodosOriginal` e `obterPeriodosDepois`**

- [ ] **Step 4: Rodar testes para garantir que nada quebrou**

Run: `npx vitest run src/models/services/GastoService.test.ts`
Expected: PASS

### Task 2: Refatorar `atualizarGastoCompleto` para Orquestração

**Files:**
- Modify: `src/models/services/GastoService.ts`

- [ ] **Step 1: Simplificar o corpo do `atualizarGastoCompleto` com guard clauses e decomposição**

```typescript
  async atualizarGastoCompleto(
    gastoId: string,
    dados: {
      descricao: string
      valorTotal: Dinheiro
      compradorId: string
      method: 'pix' | 'card'
      cardOwner: string | null
      divisoes: DivisaoDeGasto[]
      installments: number
    }
  ): Promise<void> {
    await this.validarMembrosAtivosParaAtualizacao(dados)

    const original = await this.validarEObterOriginal(gastoId)
    await this.validarNettingNoPeriodo(original)

    const periodosOriginal = await this.obterPeriodosDoGasto(original)

    const todosCartoes = (await this.cartaoRepo.listarTodos()) || []
    const { cartaoReal, resolvedCardOwner } = this.resolverCartaoEResponsavel(dados.method, dados.cardOwner, todosCartoes)

    await this.executarAtualizacaoPorTipo(gastoId, original, dados, resolvedCardOwner, cartaoReal, todosCartoes)

    await this.limparNettingDosPeriodosAfetados(gastoId, periodosOriginal)
  }
```

- [ ] **Step 2: Implementar métodos auxiliares `validarMembrosAtivosParaAtualizacao`, `executarAtualizacaoPorTipo` e `limparNettingDosPeriodosAfetados`**

```typescript
  private async validarMembrosAtivosParaAtualizacao(dados: any): Promise<void> {
    const membrosEnvolvidos = [dados.compradorId, ...dados.divisoes.map((d: any) => d.membroId)]
    const membrosUnicos = Array.from(new Set(membrosEnvolvidos))
    await this.lancamentoService.validarMembrosAtivos(membrosUnicos)
  }

  private async executarAtualizacaoPorTipo(
    gastoId: string,
    original: Gasto,
    dados: any,
    resolvedCardOwner: string | null,
    cartaoReal: Cartao | undefined,
    todosCartoes: Cartao[]
  ): Promise<void> {
    if (original.grupoParcelasId) {
      await this.atualizarGastoGrupoParcelas(gastoId, original, dados, resolvedCardOwner, cartaoReal, todosCartoes)
    } else if (dados.method === 'card' && dados.installments > 1) {
      await this.atualizarGastoSimplesParaParcelado(gastoId, original, dados)
    } else {
      await this.atualizarGastoSimplesParaSimples(original, dados, resolvedCardOwner, cartaoReal, todosCartoes)
    }
  }

  private async limparNettingDosPeriodosAfetados(gastoId: string, periodosOriginal: { mes: number; ano: number }[]): Promise<void> {
    const atualizado = await this.gastoRepo.buscarPorId(gastoId)
    const periodosDepois = atualizado ? await this.obterPeriodosDoGasto(atualizado) : []

    const todosPeriodos = [...periodosOriginal, ...periodosDepois]
    const periodosUnicos = todosPeriodos.filter((p, index, self) =>
      self.findIndex(item => item.mes === p.mes && item.ano === p.ano) === index
    )

    for (const p of periodosUnicos) {
      await this.estornoService.limparNettingDoPeriodo(p.mes, p.ano)
    }
  }
```

- [ ] **Step 3: Rodar testes finais**

Run: `npx vitest run src/models/services/GastoService.test.ts`
Expected: PASS
