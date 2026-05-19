# Plano de Implementação: Refatoração e Limpeza da Codebase

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refatorar a codebase do Divi para reduzir a complexidade ciclomática, eliminar códigos mortos e desordenados, garantindo que todos os módulos ativos possuam responsabilidades focadas e bem delimitadas.

**Architecture:** Simplificação de fluxos em composables centrais (`useNovoLancamentoWizard`, `useCartoesEFaturas`), padronização de assinaturas em serviços (`FaturaService`), remoção de código órfão e redução de volume de código no componente `DashboardSaldos.vue`.

**Tech Stack:** Vue 3, Composition API, TypeScript, Vitest.

---

### Task 1: Simplificar Validações Declarativas em `useNovoLancamentoWizard.ts`

**Files:**
- Modify: `src/modules/ledger/composables/useNovoLancamentoWizard.ts`
- Test: `src/modules/ledger/composables/useNovoLancamentoWizard.test.ts`

- [ ] **Step 1: Modificar as validações de avanço de passo**
Substituir as funções `canAdvanceLoan` e `canAdvanceExpense` por tabelas de decisão declarativas indexadas por passo (step), removendo condicionais `if (step === ...)` encadeados.

Código a aplicar em `src/modules/ledger/composables/useNovoLancamentoWizard.ts`:
```typescript
// Helper: Validate loan flow advancement
function canAdvanceLoan(step: number, compradorId: string, borrowerId: string | null, valor: number, descricao: string): boolean {
  const rules: Record<number, () => boolean> = {
    2: () => !!compradorId,
    3: () => !!borrowerId,
    4: () => valor > 0,
    5: () => descricao.trim().length > 0
  }
  return rules[step]?.() ?? false
}

// Helper: Validate expense flow advancement
function canAdvanceExpense(
  step: number,
  compradorId: string,
  valor: number,
  descricao: string,
  modoDivisao: 'IGUAL' | 'MANUAL',
  participantes: string[],
  valoresDivisao: Record<string, number>
): boolean {
  const rules: Record<number, () => boolean> = {
    2: () => !!compradorId,
    3: () => valor > 0,
    4: () => descricao.trim().length > 0,
    5: () => {
      if (modoDivisao === 'IGUAL') {
        return participantes.length > 0
      }
      const soma = participantes.reduce((acc, id) => acc + (valoresDivisao[id] || 0), 0)
      return Math.abs(soma - valor) < 0.01
    }
  }
  return rules[step]?.() ?? false
}
```

- [ ] **Step 2: Rodar os testes existentes para validar a alteração**
Run: `npx vitest run src/modules/ledger/composables/useNovoLancamentoWizard.test.ts`
Expected: PASS

- [ ] **Step 3: Commit**
```bash
git add src/modules/ledger/composables/useNovoLancamentoWizard.ts
git commit -m "refactor(wizard): simplify wizard validations with declarative rules"
```

---

### Task 2: Modularizar Resolução de Fatura e Criar Utilitários

**Files:**
- Modify: `src/modules/ledger/composables/useNovoLancamentoWizard.ts`

- [ ] **Step 1: Extrair e simplificar utilitários de faturas**
Extrair as lógicas de obtenção do período atual, resolução do cartão ativo e unificação da criação de faturas para reduzir branches em `findActiveFatura` e eliminar duplicação de `obterOuCriarFaturaParaPeriodo`.

Código a aplicar no topo de `src/modules/ledger/composables/useNovoLancamentoWizard.ts`:
```typescript
function obterPeriodoCorrente(): { mes: number; ano: number } {
  const periodoSalvoRaw = localStorage.getItem('divi_periodo_selecionado')
  if (periodoSalvoRaw) {
    try {
      const parsed = JSON.parse(periodoSalvoRaw)
      if (parsed.mes && parsed.ano) {
        return { mes: Number(parsed.mes), ano: Number(parsed.ano) }
      }
    } catch (e) {}
  }
  return { mes: new Date().getMonth() + 1, ano: new Date().getFullYear() }
}

async function determinarCartaoId(
  paymentMethod: 'pix' | 'card',
  cardOwnerId: string | null,
  compradorId: string
): Promise<string> {
  const todosCartoes = await cartaoRepo.listarTodos()
  if (paymentMethod === 'card' && cardOwnerId) {
    const cartao = todosCartoes.find(c => c.responsavelPadraoId === compradorId || c.id === cardOwnerId)
    if (cartao) return cartao.id
  }
  return todosCartoes.length > 0 ? todosCartoes[0].id : 'PIX_DEFAULT_ID'
}

async function obterOuCriarFatura(
  cartaoId: string,
  mes: number,
  ano: number,
  responsavelId: string
): Promise<any> {
  const todasFaturas = await faturaRepo.listarTodas()
  let fatura = todasFaturas.find(f => f.cartaoId === cartaoId && f.periodo.mes === mes && f.periodo.ano === ano)
  if (!fatura) {
    const { Fatura } = await import('../core/domain/Fatura')
    fatura = new Fatura({
      id: crypto.randomUUID(),
      cartaoId,
      periodo: { mes, ano },
      responsavelId,
      status: 'ABERTA'
    })
    await faturaRepo.salvar(fatura)
  }
  return fatura
}
```

Atualizar `obterOuCriarFaturaParaPeriodo` e `findActiveFatura` para reutilizar estes utilitários:
```typescript
async function obterOuCriarFaturaParaPeriodo(
  cartaoId: string,
  mes: number,
  ano: number,
  responsavelId: string
): Promise<any> {
  return obterOuCriarFatura(cartaoId, mes, ano, responsavelId)
}

async function findActiveFatura(
  paymentMethod: 'pix' | 'card',
  cardOwnerId: string | null,
  compradorId: string
): Promise<any> {
  const { mes, ano } = obterPeriodoCorrente()
  const cartaoId = await determinarCartaoId(paymentMethod, cardOwnerId, compradorId)
  return obterOuCriarFatura(cartaoId, mes, ano, compradorId)
}
```

- [ ] **Step 2: Rodar testes**
Run: `npx vitest run src/modules/ledger/composables/useNovoLancamentoWizard.test.ts`
Expected: PASS

- [ ] **Step 3: Commit**
```bash
git add src/modules/ledger/composables/useNovoLancamentoWizard.ts
git commit -m "refactor(wizard): modularize active fatura resolution and extract helpers"
```

---

### Task 3: Decompor Projeção de Parcelas em `finalizarGastoOuEmprestimo`

**Files:**
- Modify: `src/modules/ledger/composables/useNovoLancamentoWizard.ts`

- [ ] **Step 1: Refatorar fluxo de finalização e extrair projeção de parcelas**
Simplificar `finalizarGastoOuEmprestimo` extraindo a lógica de projeção de parcelas futuras do cartão de crédito para a função auxiliar `projetarGastosParcelados`.

Código do helper a adicionar em `src/modules/ledger/composables/useNovoLancamentoWizard.ts`:
```typescript
async function projetarGastosParcelados(dados: {
  total: any
  divisoes: any[]
  faturaAtiva: any
  descricao: string
  compradorId: string
  installments: number
  cardOwner: string | null
}): Promise<void> {
  const { total, divisoes, faturaAtiva, descricao, compradorId, installments, cardOwner } = dados
  const grupoParcelasId = crypto.randomUUID()
  
  // Salvar primeira parcela
  const primeiroGasto = new Gasto({
    id: crypto.randomUUID(),
    faturaId: faturaAtiva.id,
    descricao,
    valorTotal: total,
    compradorId,
    divisoes,
    installments,
    totalInstallments: installments,
    isLoan: false,
    borrowerId: null,
    method: 'card',
    cardOwner,
    grupoParcelasId
  })
  await gastoRepo.salvar(primeiroGasto)

  // Salvar parcelas futuras
  let currentMes = faturaAtiva.periodo.mes
  let currentAno = faturaAtiva.periodo.ano
  
  for (let i = 2; i <= installments; i++) {
    currentMes++
    if (currentMes > 12) {
      currentMes = 1
      currentAno++
    }
    
    const faturaFutura = await obterOuCriarFatura(faturaAtiva.cartaoId, currentMes, currentAno, compradorId)
    const gastoFuturo = new Gasto({
      id: crypto.randomUUID(),
      faturaId: faturaFutura.id,
      descricao,
      valorTotal: total,
      compradorId,
      divisoes: [...divisoes],
      installments: installments - i + 1,
      totalInstallments: installments,
      isLoan: false,
      borrowerId: null,
      method: 'card',
      cardOwner,
      grupoParcelasId
    })
    await gastoRepo.salvar(gastoFuturo)
  }
}
```

Atualizar `finalizarGastoOuEmprestimo`:
```typescript
  const finalizarGastoOuEmprestimo = async () => {
    if (!compradorSelecionadoId.value) throw new Error('Selecione quem pagou/emprestou')
    if (!valor.value || isNaN(Number(valor.value))) throw new Error('Valor inválido')

    const total = Dinheiro.deReais(Number(valor.value))
    const divisoes = buildDivisoes(
      wizFlow.value,
      total,
      borrowerId.value,
      participantesDivisao.value,
      modoDivisaoWizard.value,
      valoresDivisaoWizard.value
    )

    const faturaAtiva = await findActiveFatura(wizPayment.value, wizCardOwner.value, compradorSelecionadoId.value)

    if (wizPayment.value === 'card' && installments.value > 1) {
      await projetarGastosParcelados({
        total,
        divisoes,
        faturaAtiva,
        descricao: descricao.value,
        compradorId: compradorSelecionadoId.value,
        installments: installments.value,
        cardOwner: wizCardOwner.value
      })
    } else {
      const novoGasto = new Gasto({
        id: crypto.randomUUID(),
        faturaId: faturaAtiva.id,
        descricao: wizFlow.value === 'loan' ? (descricao.value.trim() || 'Empréstimo Pessoal') : descricao.value,
        valorTotal: total,
        compradorId: compradorSelecionadoId.value,
        divisoes,
        installments: installments.value,
        totalInstallments: installments.value,
        isLoan: wizFlow.value === 'loan',
        borrowerId: borrowerId.value,
        method: wizPayment.value,
        cardOwner: wizCardOwner.value,
        grupoParcelasId: null
      })
      await gastoRepo.salvar(novoGasto)
    }

    reset()
  }
```

- [ ] **Step 2: Rodar testes**
Run: `npx vitest run src/modules/ledger/composables/useNovoLancamentoWizard.test.ts`
Expected: PASS

- [ ] **Step 3: Commit**
```bash
git add src/modules/ledger/composables/useNovoLancamentoWizard.ts
git commit -m "refactor(wizard): extract future installment projection flow"
```

---

### Task 4: Desacoplar Lógica de Migração em `useCartoesEFaturas.ts`

**Files:**
- Modify: `src/modules/ledger/composables/useCartoesEFaturas.ts`
- Modify: `src/modules/ledger/adapters/LocalStorageFaturaRepository.ts`

- [ ] **Step 1: Mover `desduplicarEMigrarFaturas` para o repositório de faturas**
Retirar o processamento direto de LocalStorage e a complexa rotina de migração de dentro de `useCartoesEFaturas.ts` e movê-la para o `LocalStorageFaturaRepository.ts`.

Primeiro, atualizar o repositório `LocalStorageFaturaRepository.ts` para encapsular a desduplicação/migração (ou expor como método de limpeza na carga):
Visualizar `LocalStorageFaturaRepository.ts` para entender onde injetar. (Faremos isso na execução).

Modificar `useCartoesEFaturas.ts` para não conter a implementação interna de `desduplicarEMigrarFaturas`, chamando-a através de um método do repositório ou limpando o método.

- [ ] **Step 2: Executar testes da suite**
Run: `npx vitest run src/modules/ledger/composables/useCartoesEFaturas.test.ts`
Expected: PASS

- [ ] **Step 3: Commit**
```bash
git add src/modules/ledger/composables/useCartoesEFaturas.ts src/modules/ledger/adapters/LocalStorageFaturaRepository.ts
git commit -m "refactor(ledger): move invoice migration logic to repository infrastructure"
```

---

### Task 5: Refatorar Assinatura do Fechamento de Faturas

**Files:**
- Modify: `src/modules/ledger/core/services/FaturaService.ts`
- Modify: `src/modules/ledger/core/services/FaturaService.test.ts`
- Modify: `src/modules/ledger/composables/useCartoesEFaturas.ts`

- [ ] **Step 1: Limpar sobrecarga dinâmica de parâmetros em `fecharFatura`**
Substituir a checagem `instanceof Date` / `typeof string` por parâmetros limpos e bem tipados em `FaturaService.ts`.

Código a alterar em `src/modules/ledger/core/services/FaturaService.ts`:
```typescript
  async fecharFatura(faturaId: string, responsavelId?: string, dataPagamentoBanco?: Date): Promise<void> {
    const fatura = await this.faturaRepo.buscarPorId(faturaId)
    if (!fatura) throw new Error('Fatura não encontrada')

    fatura.fechar(responsavelId, dataPagamentoBanco)
    await this.faturaRepo.salvar(fatura)
  }
```

- [ ] **Step 2: Atualizar testes em `FaturaService.test.ts`**
Ajustar chamadas antigas dos testes para a nova assinatura explícita.
Exemplo:
```typescript
// De:
await service.fecharFatura('f1', new Date())
// Para:
await service.fecharFatura('f1', undefined, new Date())
```

- [ ] **Step 3: Rodar testes de serviço**
Run: `npx vitest run src/modules/ledger/core/services/FaturaService.test.ts`
Expected: PASS

- [ ] **Step 4: Commit**
```bash
git add src/modules/ledger/core/services/FaturaService.ts src/modules/ledger/core/services/FaturaService.test.ts src/modules/ledger/composables/useCartoesEFaturas.ts
git commit -m "refactor(service): clean up fecharFatura method signature and overloads"
```

---

### Task 6: Densificar e Limpar `DashboardSaldos.vue`

**Files:**
- Modify: `src/components/ledger/DashboardSaldos.vue`

- [ ] **Step 1: Remover imports órfãos e variáveis mortas**
Analisar e expurgar imports duplicados ou não utilizados (por exemplo, Lucide icons declarados que não são exibidos no template), além de variáveis reativas órfãs.

- [ ] **Step 2: Executar testes de componentes**
Run: `npx vitest run src/components/ledger/DashboardSaldos.test.ts`
Expected: PASS

- [ ] **Step 3: Commit**
```bash
git add src/components/ledger/DashboardSaldos.vue
git commit -m "refactor(ui): clean up imports and unused code in DashboardSaldos"
```

---

### Task 7: Validação Final e Compilação

- [ ] **Step 1: Executar suite completa de testes**
Run: `npx vitest run`
Expected: All 108 tests PASS

- [ ] **Step 2: Rodar compilação do TypeScript para garantir sanidade de tipagem**
Run: `npm run build` ou `npx vue-tsc -b`
Expected: Build concluído com sucesso e sem erros de compilador.
