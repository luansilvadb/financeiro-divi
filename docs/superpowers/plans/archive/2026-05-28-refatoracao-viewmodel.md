# Refatoração do useDashboardViewModel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refatorar o hook `useDashboardViewModel.ts` extraindo a lógica de criação de faturas virtuais e a regra de validação de trancamento de período para funções puras auxiliares fora do hook, melhorando a modularidade e reduzindo a complexidade ciclomática.

**Architecture:** Mover a lógica complexa de computed properties para funções puras helper que recebem as propriedades reativas desestruturadas e retornam o estado derivado de forma síncrona.

**Tech Stack:** TypeScript, Vue 3, Vitest

---

### Task 1: Extrair a fábrica de Fatura Virtual

**Files:**
- Modify: `src/viewmodels/useDashboardViewModel.ts`

- [ ] **Step 1: Adicionar a função criarFaturaVirtual**
  Adicionar a seguinte função auxiliar no topo de `src/viewmodels/useDashboardViewModel.ts`, logo após as interfaces/propriedades importadas (por volta da linha 53):
  ```typescript
  function criarFaturaVirtual(
    p: { mes: number; ano: number },
    cartaoId: string,
    responsavelId: string
  ): Fatura {
    return new Fatura({
      id: `virtual-${p.mes}-${p.ano}`,
      cartaoId,
      periodo: { mes: p.mes, ano: p.ano },
      responsavelId,
      status: 'ABERTA'
    })
  }
  ```

- [ ] **Step 2: Substituir a criação manual de Fatura virtual no hook**
  Modificar as computed properties `faturasPeriodoSelecionado` e `faturaAtivaVisualizada` no hook `useDashboardViewModel` para utilizarem a nova função:
  * Na computed `faturasPeriodoSelecionado`:
    ```typescript
    if (faturasExistentes.length === 0) {
      return [
        criarFaturaVirtual(
          p,
          props.cartoes[0]?.id || 'PIX_DEFAULT_ID',
          props.membros[0]?.id || 'virtual-member'
        )
      ]
    }
    ```
  * Na computed `faturaAtivaVisualizada`:
    ```typescript
    if (faturaEncontrada) return faturaEncontrada

    return criarFaturaVirtual(
      p,
      props.cartoes[0]?.id || 'PIX_DEFAULT_ID',
      props.membros[0]?.id || 'virtual-member'
    )
    ```

- [ ] **Step 3: Rodar testes**
  Run: `npx vitest run`
  Expected: Todos os 251 testes passando.

- [ ] **Step 4: Commit**
  ```bash
  git add src/viewmodels/useDashboardViewModel.ts
  git commit -m "refactor: extract virtual invoice factory in useDashboardViewModel"
  ```

---

### Task 2: Extrair validador de trancamento de período

**Files:**
- Modify: `src/viewmodels/useDashboardViewModel.ts`

- [ ] **Step 1: Adicionar a função verificarPeriodoTrancado**
  Adicionar a seguinte função pura no topo do arquivo (logo abaixo de `obterPeriodoInicial`):
  ```typescript
  function verificarPeriodoTrancado(
    p: { mes: number; ano: number },
    faturasAbertas: Fatura[],
    faturasFechadas: Fatura[],
    cartoes: Cartao[]
  ): boolean {
    // Se não há faturas no período, tecnicamente não está trancado
    const temFaturaPixAberta = faturasAbertas.some(f =>
      f.cartaoId === 'PIX_DEFAULT_ID' &&
      f.periodo.mes === p.mes &&
      f.periodo.ano === p.ano
    )

    if (cartoes.length > 0) {
      const todosCartoesFechados = cartoes.every(cartao => {
        const fechada = faturasFechadas.find(f => f.cartaoId === cartao.id && f.periodo.mes === p.mes && f.periodo.ano === p.ano)
        if (fechada) return true

        const aberta = faturasAbertas.find(f => f.cartaoId === cartao.id && f.periodo.mes === p.mes && f.periodo.ano === p.ano)
        if (aberta) return false

        // Se não tem fatura, consideramos "aberto" para permitir o lançamento que irá criá-la
        return false
      })

      if (temFaturaPixAberta) return false
      return todosCartoesFechados
    }

    return faturasFechadas.some(f => f.periodo.mes === p.mes && f.periodo.ano === p.ano)
  }
  ```

- [ ] **Step 2: Substituir a lógica na computed faturaSelecionadaTrancada**
  Substituir o corpo de `faturaSelecionadaTrancada` pela chamada da função pura:
  ```typescript
  const faturaSelecionadaTrancada = computed(() => {
    return verificarPeriodoTrancado(
      periodoSelecionado.value,
      props.faturasAbertas,
      props.faturasFechadas,
      props.cartoes
    )
  })
  ```

- [ ] **Step 3: Rodar testes**
  Run: `npx vitest run`
  Expected: Todos os 251 testes passando.

- [ ] **Step 4: Rodar build de produção**
  Run: `npm run build`
  Expected: Build completado com sucesso sem erros.

- [ ] **Step 5: Commit**
  ```bash
  git add src/viewmodels/useDashboardViewModel.ts
  git commit -m "refactor: simplify faturaSelecionadaTrancada with verificarPeriodoTrancado helper"
  ```
