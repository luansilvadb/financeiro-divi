# Plano de Implementação: Restrições de Negócio no Parcelamento

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Impedir a edição de parcelamentos a partir de parcelas filhas e restringir a exclusão de gastos parcelados para ocorrer individualmente e em ordem cronológica reversa (de trás para frente: C -> B -> A).

**Architecture:** Modificar os métodos `excluirGasto` e `atualizarGastoCompleto` em `GastoService.ts` adicionando validações que consultam o grupo de parcelas no repositório de gastos para garantir a ordem lógica das operações. Ajustar os testes unitários afetados em `GastoService.test.ts`.

**Tech Stack:** TypeScript, Vitest, Clean Architecture / Domain Model.

---

### Tarefa 1: Validação de Edição Apenas na Parcela Mãe (Origem)

**Files:**
* Modify: `src/models/services/GastoService.ts:388-400`
* Test: `src/models/services/GastoService.test.ts`

- [ ] **Step 1.1: Escrever teste falho**
  Adicionar o seguinte teste unitário no final de [GastoService.test.ts](file:///d:/projetos/divi/src/models/services/GastoService.test.ts):
  ```typescript
  it('deve impedir a edição de um gasto parcelado a partir de uma parcela filha', async () => {
    const mockGastoRepo = { salvar: vi.fn(), salvarMuitos: vi.fn(), buscarPorFatura: vi.fn(), excluir: vi.fn(), excluirMuitos: vi.fn(), listarTodos: vi.fn(), buscarPorId: vi.fn() }
    const mockFaturaRepo = criarMockFaturaRepo()
    const mockCartaoRepo = { buscarPorId: vi.fn(), salvar: vi.fn(), listarTodos: vi.fn(), excluir: vi.fn() }

    const gastoFilha = new Gasto({
      id: 'g-filha',
      faturaId: 'f2',
      descricao: 'Original 2/2',
      valorTotal: Dinheiro.deReais(100),
      compradorId: 'm1',
      divisoes: [new DivisaoDeGasto('m1', Dinheiro.deReais(50))],
      method: 'card',
      cardOwner: 'm1',
      installments: 1,
      totalInstallments: 2,
      grupoParcelasId: 'grupo-x'
    })
    mockGastoRepo.buscarPorId.mockResolvedValue(gastoFilha)

    const service = new GastoService(mockGastoRepo as any, mockFaturaRepo as any, mockCartaoRepo as any)

    await expect(service.atualizarGastoCompleto('g-filha', {
      descricao: 'Editado',
      valorTotal: Dinheiro.deReais(120),
      compradorId: 'm1',
      method: 'card',
      cardOwner: 'c1',
      divisoes: [new DivisaoDeGasto('m1', Dinheiro.deReais(60))],
      installments: 2
    })).rejects.toThrow(
      'Este lançamento faz parte de um parcelamento. Para editá-lo, acesse a primeira parcela no período de origem do gasto.'
    )
  })
  ```

- [ ] **Step 1.2: Run test to verify it fails**
  Run: `npx vitest run src/models/services/GastoService.test.ts`
  Expected: FAIL (promise resolved 'undefined' instead of rejecting)

- [ ] **Step 1.3: Write minimal implementation**
  No método `atualizarGastoCompleto` em [GastoService.ts](file:///d:/projetos/divi/src/models/services/GastoService.ts), logo após obter o gasto original:
  ```typescript
    const original = await this.gastoRepo.buscarPorId(gastoId)
    if (!original) throw new Error('Gasto não encontrado')

    if (original.grupoParcelasId && original.installments !== original.totalInstallments) {
      throw new Error(
        'Este lançamento faz parte de um parcelamento. Para editá-lo, acesse a primeira parcela no período de origem do gasto.'
      )
    }
  ```

- [ ] **Step 1.4: Run test to verify it passes**
  Run: `npx vitest run src/models/services/GastoService.test.ts`
  Expected: PASS

- [ ] **Step 1.5: Commit**
  ```bash
  git add src/models/services/GastoService.ts src/models/services/GastoService.test.ts
  git commit -m "feat: restringe edicao de parcelado apenas para a primeira parcela (mae)"
  ```

---

### Tarefa 2: Exclusão de Trás para Frente (C ➔ B ➔ A)

**Files:**
* Modify: `src/models/services/GastoService.ts:211-236`
* Test: `src/models/services/GastoService.test.ts`

- [ ] **Step 2.1: Escrever testes falhos e ajustar testes legados**
  * Em [GastoService.test.ts](file:///d:/projetos/divi/src/models/services/GastoService.test.ts):
    1. Alterar o teste legado `'deve excluir todos os gastos do grupo (em cascata) quando um gasto do grupo eh excluido'` para validar que a exclusão da parcela mãe é bloqueada se existirem filhas:
       ```typescript
       it('deve impedir exclusão da parcela mãe se existirem parcelas subsequentes', async () => {
         // ... (mockar g1 installments=2, g2 installments=1)
         // tentar excluir g1 (mãe) deve rejeitar com o erro de subsequentes ativas
       })
       ```
    2. Alterar o teste legado `'deve excluir apenas parcelas em faturas abertas ao excluir grupo de parcelas'` para validar o mesmo comportamento reverso.
    3. Adicionar novos testes específicos no final do arquivo:
       ```typescript
       it('deve impedir a exclusão de uma parcela se houver parcelas subsequentes ativas no grupo', async () => {
         // mockar g1 (inst=2), g2 (inst=1)
         // tentar excluir g1 (subsequente g2 ativa existe) -> deve rejeitar com:
         // 'Não é possível excluir esta parcela pois existem parcelas subsequentes ativas. Exclua as parcelas futuras deste gasto primeiro.'
       })

       it('deve permitir a exclusão individual de uma parcela se ela for a última ativa no grupo', async () => {
         // mockar g1 (inst=2), g2 (inst=1)
         // excluir g2 (a última do grupo, installments=1) -> deve resolver e chamar excluir('g2') individualmente
       })
       ```

- [ ] **Step 2.2: Run test to verify it fails**
  Run: `npx vitest run src/models/services/GastoService.test.ts`
  Expected: FAIL

- [ ] **Step 2.3: Write minimal implementation**
  No método `excluirGasto` em [GastoService.ts](file:///d:/projetos/divi/src/models/services/GastoService.ts), substituir a lógica antiga de exclusão em cascata:
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

      const fatura = await this.faturaRepo.buscarPorId(gasto.faturaId)
      if (fatura && typeof fatura.validarOperacaoPermitida === 'function') {
        fatura.validarOperacaoPermitida()
      }
      await this.gastoRepo.excluir(id)
      if (fatura) {
        await this.limparNettingDoPeriodo(fatura.periodo.mes, fatura.periodo.ano)
      }
    }
  ```

- [ ] **Step 2.4: Run test to verify it passes**
  Run: `npx vitest run src/models/services/GastoService.test.ts`
  Expected: PASS

- [ ] **Step 2.5: Commit**
  ```bash
  git add src/models/services/GastoService.ts src/models/services/GastoService.test.ts
  git commit -m "feat: restringe exclusao de parcelados para ordem cronologica reversa"
  ```

---

### Tarefa 3: Validação Completa e UI

**Files:**
* Test: Run entire suite

- [ ] **Step 3.1: Executar toda a suíte de testes do projeto**
  Run: `npx vitest run`
  Expected: PASS (todos os 230+ testes devem passar com sucesso)
