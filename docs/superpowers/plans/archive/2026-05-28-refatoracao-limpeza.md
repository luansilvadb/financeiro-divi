# Refatoração e Limpeza da Codebase Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refatorar a classe `GastoService` para reduzir a complexidade ciclomática do método `atualizarGastoCompleto` e remover o arquivo de testes temporários `src/scratch_debug.test.ts` da codebase.

**Architecture:** Separar a lógica do método `atualizarGastoCompleto` em métodos auxiliares privados e coesos dentro do `GastoService`, mapeando os Casos 1 (Grupo de Parcelas), 2 (Simples para Parcelado) e 3 (Simples para Simples).

**Tech Stack:** TypeScript, Vue 3, Vitest

---

### Task 1: Remoção de Código Morto (Arquivo Scratch)

**Files:**
- Delete: `src/scratch_debug.test.ts`

- [ ] **Step 1: Remover o arquivo de testes temporários**
  Executar remoção física do arquivo: `src/scratch_debug.test.ts`.

- [ ] **Step 2: Verificar a suíte de testes existente**
  Run: `npx vitest run`
  Expected: Todos os 251 testes remanescentes devem passar com sucesso.

- [ ] **Step 3: Commit**
  ```bash
  git add src/scratch_debug.test.ts
  git commit -m "cleanup: remove temporary scratch debug test file"
  ```

---

### Task 2: Refatoração de GastoService - Extração de Métodos de Período

**Files:**
- Modify: `src/models/services/GastoService.ts`

- [ ] **Step 1: Implementar obterPeriodosOriginal e obterPeriodosDepois**
  Adicionar os seguintes métodos auxiliares em `src/models/services/GastoService.ts`:
  ```typescript
  private async obterPeriodosOriginal(original: Gasto): Promise<{ mes: number; ano: number }[]> {
    const periodosOriginal: { mes: number; ano: number }[] = []
    if (original.grupoParcelasId) {
      const todosGastos = await this.gastoRepo.listarTodos()
      const gastosDoGrupo = todosGastos.filter(g => g.grupoParcelasId === original.grupoParcelasId)
      for (const g of gastosDoGrupo) {
        const fat = await this.faturaRepo.buscarPorId(g.faturaId)
        if (fat) {
          periodosOriginal.push({ mes: fat.periodo.mes, ano: fat.periodo.ano })
        }
      }
    } else {
      const fat = await this.faturaRepo.buscarPorId(original.faturaId)
      if (fat) {
        periodosOriginal.push({ mes: fat.periodo.mes, ano: fat.periodo.ano })
      }
    }
    return periodosOriginal
  }

  private async obterPeriodosDepois(gastoId: string): Promise<{ mes: number; ano: number }[]> {
    const periodosDepois: { mes: number; ano: number }[] = []
    const atualizado = await this.gastoRepo.buscarPorId(gastoId)
    if (atualizado) {
      if (atualizado.grupoParcelasId) {
        const todosGastos = await this.gastoRepo.listarTodos()
        const gastosDoGrupo = todosGastos.filter(g => g.grupoParcelasId === atualizado.grupoParcelasId)
        for (const g of gastosDoGrupo) {
          const fat = await this.faturaRepo.buscarPorId(g.faturaId)
          if (fat) {
            periodosDepois.push({ mes: fat.periodo.mes, ano: fat.periodo.ano })
          }
        }
      } else {
        const fat = await this.faturaRepo.buscarPorId(atualizado.faturaId)
        if (fat) {
          periodosDepois.push({ mes: fat.periodo.mes, ano: fat.periodo.ano })
        }
      }
    }
    return periodosDepois
  }
  ```

- [ ] **Step 2: Rodar testes**
  Run: `npx vitest run`
  Expected: Todos os testes passando (o novo código ainda não é invocado, mas precisa compilar sem erros).

- [ ] **Step 3: Commit**
  ```bash
  git add src/models/services/GastoService.ts
  git commit -m "refactor: extract period helper methods in GastoService"
  ```

---

### Task 3: Refatoração de GastoService - Caso 1 (Grupo de Parcelas)

**Files:**
- Modify: `src/models/services/GastoService.ts`

- [ ] **Step 1: Implementar atualizarGastoGrupoParcelas**
  Adicionar o método auxiliar privado:
  ```typescript
  private async atualizarGastoGrupoParcelas(
    gastoId: string,
    original: Gasto,
    dados: {
      descricao: string
      valorTotal: Dinheiro
      compradorId: string
      method: 'pix' | 'card'
      cardOwner: string | null
      divisoes: DivisaoDeGasto[]
      installments: number
    },
    resolvedCardOwner: string | null,
    cartaoReal: Cartao | undefined,
    todosCartoes: Cartao[]
  ): Promise<void> {
    const todosGastos = await this.gastoRepo.listarTodos()
    const gastosDoGrupo = todosGastos.filter(g => g.grupoParcelasId === original.grupoParcelasId)

    // Identificar faturas e classificá-las
    const statusFaturas = await Promise.all(
      gastosDoGrupo.map(async g => {
        const fat = await this.faturaRepo.buscarPorId(g.faturaId)
        return { gasto: g, fatura: fat }
      })
    )

    const possuiFechada = statusFaturas.some(sf => sf.fatura && sf.fatura.status !== 'ABERTA')

    if (possuiFechada) {
      const valorMudou = !original.valorTotal.equals(dados.valorTotal)
      const totalInstallmentsMudou = original.totalInstallments !== dados.installments
      const methodMudou = original.method !== dados.method
      const compradorMudou = original.compradorId !== dados.compradorId
      
      let divisoesMudaram = original.divisoes.length !== dados.divisoes.length
      if (!divisoesMudaram) {
        for (const dOriginal of original.divisoes) {
          const dNova = dados.divisoes.find(dn => dn.membroId === dOriginal.membroId)
          if (!dNova || !dNova.valor.equals(dOriginal.valor)) {
            divisoesMudaram = true
            break
          }
        }
      }

      if (valorMudou || totalInstallmentsMudou || methodMudou || compradorMudou || divisoesMudaram) {
        throw new Error('Não é possível alterar o valor, parcelamento, comprador ou divisões de um gasto que possui parcelas em faturas fechadas. Reabra as faturas anteriores para ajustar o rateio histórico.')
      }
    }

    // Se mudou o número total de parcelas ou o método de pagamento
    if (original.totalInstallments !== dados.installments || original.method !== dados.method) {
      if (possuiFechada) {
        throw new Error('Não é possível alterar o parcelamento ou método de pagamento de um gasto que possui parcelas em faturas fechadas')
      }

      // Encontrar a primeira parcela para saber o período inicial
      const primeiraParcela = gastosDoGrupo.reduce((prev, curr) => curr.installments > prev.installments ? curr : prev, gastosDoGrupo[0] || original)
      const faturaOriginal = await this.faturaRepo.buscarPorId(primeiraParcela.faturaId)
      if (faturaOriginal && typeof faturaOriginal.validarOperacaoPermitida === 'function') {
        faturaOriginal.validarOperacaoPermitida()
      }

      // Excluir todos do grupo
      await this.gastoRepo.excluirMuitos(gastosDoGrupo.map(g => g.id))

      // Relançar do período inicial
      if (!faturaOriginal) throw new Error(`Fatura original não encontrada para o gasto ${gastoId}`)
      const periodoInicial = faturaOriginal.periodo
      await this.lancarGastoOuEmprestimo({
        flow: original.isLoan ? 'loan' : 'expense',
        paymentMethod: dados.method,
        compradorId: dados.compradorId,
        valor: dados.valorTotal.centavos / 100,
        descricao: dados.descricao,
        divisoes: dados.divisoes,
        installments: dados.installments,
        cardOwnerId: dados.cardOwner,
        borrowerId: original.borrowerId,
        periodo: periodoInicial
      })
    } else {
      // Atualizar apenas parcelas em faturas abertas
      const faturasParaSalvar: Fatura[] = []
      const gastosParaSalvar: Gasto[] = []

      const todasFaturasPersistidas = await this.faturaRepo.listarTodas()

      for (const sf of statusFaturas) {
        if (sf.fatura && sf.fatura.status !== 'ABERTA') {
          continue // Ignora parcelas passadas fechadas
        }

        const g = sf.gasto
        let novaFaturaId = g.faturaId

        if (sf.fatura) {
          const cartaoId = (dados.method === 'card')
            ? (cartaoReal ? cartaoReal.id : (todosCartoes.length > 0 ? todosCartoes[0].id : 'PIX_DEFAULT_ID'))
            : 'PIX_DEFAULT_ID'
          const responsavelFaturaId = cartaoReal ? cartaoReal.responsavelPadraoId : dados.compradorId
          const novaFatura = await this.lancamentoService.obterOuCriarFaturaMemoria(cartaoId, sf.fatura.periodo.mes, sf.fatura.periodo.ano, responsavelFaturaId, faturasParaSalvar, todasFaturasPersistidas)
          if (novaFatura && typeof novaFatura.validarOperacaoPermitida === 'function') {
            novaFatura.validarOperacaoPermitida()
          }
          novaFaturaId = novaFatura.id
        }

        const novoG = new Gasto({
          id: g.id,
          faturaId: novaFaturaId,
          descricao: dados.descricao,
          valorTotal: dados.valorTotal,
          compradorId: dados.compradorId,
          divisoes: dados.divisoes,
          method: dados.method,
          cardOwner: resolvedCardOwner,
          installments: g.installments,
          totalInstallments: g.totalInstallments,
          grupoParcelasId: g.grupoParcelasId,
          isLoan: g.isLoan,
          borrowerId: g.borrowerId,
          recurringBillId: g.recurringBillId,
          isSettlement: g.isSettlement,
          settlementDetails: g.settlementDetails
        })
        gastosParaSalvar.push(novoG)
      }

      if (faturasParaSalvar.length > 0) {
        await this.faturaRepo.salvarMuitas(faturasParaSalvar)
      }
      if (gastosParaSalvar.length > 0) {
        await this.gastoRepo.salvarMuitos(gastosParaSalvar)
      }
    }
  }
  ```

- [ ] **Step 2: Rodar testes**
  Run: `npx vitest run`
  Expected: Todos os testes passando.

- [ ] **Step 3: Commit**
  ```bash
  git add src/models/services/GastoService.ts
  git commit -m "refactor: extract atualizarGastoGrupoParcelas in GastoService"
  ```

---

### Task 4: Refatoração de GastoService - Caso 2 e Caso 3

**Files:**
- Modify: `src/models/services/GastoService.ts`

- [ ] **Step 1: Implementar atualizarGastoSimplesParaParcelado e atualizarGastoSimplesParaSimples**
  Adicionar os métodos auxiliares privados:
  ```typescript
  private async atualizarGastoSimplesParaParcelado(
    gastoId: string,
    original: Gasto,
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
    const faturaOriginal = await this.faturaRepo.buscarPorId(original.faturaId)
    if (faturaOriginal && typeof faturaOriginal.validarOperacaoPermitida === 'function') {
      faturaOriginal.validarOperacaoPermitida()
    }

    // Deleta original
    await this.gastoRepo.excluir(original.id)

    // Relança parcelado
    if (!faturaOriginal) throw new Error(`Fatura original não encontrada para o gasto ${gastoId}`)
    const periodoInicial = faturaOriginal.periodo
    await this.lancarGastoOuEmprestimo({
      flow: original.isLoan ? 'loan' : 'expense',
      paymentMethod: dados.method,
      compradorId: dados.compradorId,
      valor: dados.valorTotal.centavos / 100,
      descricao: dados.descricao,
      divisoes: dados.divisoes,
      installments: dados.installments,
      cardOwnerId: dados.cardOwner,
      borrowerId: original.borrowerId,
      periodo: periodoInicial
    })
  }

  private async atualizarGastoSimplesParaSimples(
    original: Gasto,
    dados: {
      descricao: string
      valorTotal: Dinheiro
      compradorId: string
      method: 'pix' | 'card'
      cardOwner: string | null
      divisoes: DivisaoDeGasto[]
      installments: number
    },
    resolvedCardOwner: string | null,
    cartaoReal: Cartao | undefined,
    todosCartoes: Cartao[]
  ): Promise<void> {
    const faturaOriginal = await this.faturaRepo.buscarPorId(original.faturaId)
    if (faturaOriginal && typeof faturaOriginal.validarOperacaoPermitida === 'function') {
      faturaOriginal.validarOperacaoPermitida()
    }

    let novaFaturaId = original.faturaId
    if (faturaOriginal) {
      const cartaoId = (dados.method === 'card')
        ? (cartaoReal ? cartaoReal.id : (todosCartoes.length > 0 ? todosCartoes[0].id : 'PIX_DEFAULT_ID'))
        : 'PIX_DEFAULT_ID'
      const responsavelFaturaId = cartaoReal ? cartaoReal.responsavelPadraoId : dados.compradorId
      const novaFatura = await this.faturaRepo.assegurarObterOuCriarFatura(cartaoId, faturaOriginal.periodo.mes, faturaOriginal.periodo.ano, responsavelFaturaId)
      if (novaFatura && typeof novaFatura.validarOperacaoPermitida === 'function') {
        novaFatura.validarOperacaoPermitida()
      }
      novaFaturaId = novaFatura.id
    }

    const novoGasto = new Gasto({
      id: original.id,
      faturaId: novaFaturaId,
      descricao: dados.descricao,
      valorTotal: dados.valorTotal,
      compradorId: dados.compradorId,
      divisoes: dados.divisoes,
      method: dados.method,
      cardOwner: resolvedCardOwner,
      installments: dados.installments,
      totalInstallments: dados.installments,
      isLoan: original.isLoan,
      borrowerId: original.borrowerId,
      recurringBillId: original.recurringBillId,
      isSettlement: original.isSettlement,
      settlementDetails: original.settlementDetails
    })

    await this.gastoRepo.salvar(novoGasto)
  }
  ```

- [ ] **Step 2: Rodar testes**
  Run: `npx vitest run`
  Expected: Todos os testes passando.

- [ ] **Step 3: Commit**
  ```bash
  git add src/models/services/GastoService.ts
  git commit -m "refactor: extract Caso 2 and 3 helper methods in GastoService"
  ```

---

### Task 5: Refatoração de GastoService - Simplificação de atualizarGastoCompleto

**Files:**
- Modify: `src/models/services/GastoService.ts`

- [ ] **Step 1: Substituir corpo de atualizarGastoCompleto pelos novos métodos**
  Reescrever `atualizarGastoCompleto` de forma a usar os novos métodos extraídos:
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
    const membrosEnvolvidos = [dados.compradorId]
    dados.divisoes.forEach(d => {
      if (!membrosEnvolvidos.includes(d.membroId)) {
        membrosEnvolvidos.push(d.membroId)
      }
    })
    await this.lancamentoService.validarMembrosAtivos(membrosEnvolvidos)

    const original = await this.gastoRepo.buscarPorId(gastoId)
    if (!original) throw new Error('Gasto não encontrado')

    if (original.grupoParcelasId && original.installments !== original.totalInstallments) {
      throw new Error(
        'Este lançamento faz parte de um parcelamento. Para editá-lo, acesse a primeira parcela no período de origem do gasto.'
      )
    }

    if (!original.isSettlement) {
      let faturaIds: string[] = []
      if (original.grupoParcelasId) {
        const todos = await this.gastoRepo.listarTodos()
        const grupo = todos.filter(g => g.grupoParcelasId === original.grupoParcelasId)
        faturaIds = grupo.map(g => g.faturaId)
      } else {
        faturaIds = [original.faturaId]
      }

      const todosGastos = (await this.gastoRepo.listarTodos()) || []
      const temNettingNoPeriodo = todosGastos.some(
        g => faturaIds.includes(g.faturaId) && g.isSettlement
      )

      if (temNettingNoPeriodo) {
        throw new Error(
          'Não é possível alterar gastos comuns neste período pois já existem acertos de contas (Pix) confirmados. Estorne os acertos primeiro.'
        )
      }
    }

    const periodosOriginal = await this.obterPeriodosOriginal(original)

    const todosCartoes = (await this.cartaoRepo.listarTodos()) || []
    let cartaoReal: Cartao | undefined = undefined
    if (dados.method === 'card' && dados.cardOwner) {
      cartaoReal = todosCartoes.find(c => c.id === dados.cardOwner || c.responsavelPadraoId === dados.cardOwner)
    }
    const resolvedCardOwner = cartaoReal ? cartaoReal.responsavelPadraoId : null

    if (original.grupoParcelasId) {
      await this.atualizarGastoGrupoParcelas(gastoId, original, dados, resolvedCardOwner, cartaoReal, todosCartoes)
    } else if (dados.method === 'card' && dados.installments > 1) {
      await this.atualizarGastoSimplesParaParcelado(gastoId, original, dados)
    } else {
      await this.atualizarGastoSimplesParaSimples(original, dados, resolvedCardOwner, cartaoReal, todosCartoes)
    }

    const periodosDepois = await this.obterPeriodosDepois(gastoId)

    const todosPeriodos = [...periodosOriginal, ...periodosDepois]
    const periodosUnicos = todosPeriodos.filter((p, index, self) =>
      self.findIndex(item => item.mes === p.mes && item.ano === p.ano) === index
    )

    for (const p of periodosUnicos) {
      await this.estornoService.limparNettingDoPeriodo(p.mes, p.ano)
    }
  }
  ```

- [ ] **Step 2: Rodar testes**
  Run: `npx vitest run`
  Expected: Todos os 251 testes passando (isso garante que as refatorações mantêm o mesmo comportamento).

- [ ] **Step 3: Rodar compilação de produção**
  Run: `npm run build`
  Expected: O build do projeto deve rodar sem erros.

- [ ] **Step 4: Commit**
  ```bash
  git add src/models/services/GastoService.ts
  git commit -m "refactor: simplify atualizarGastoCompleto in GastoService"
  ```
