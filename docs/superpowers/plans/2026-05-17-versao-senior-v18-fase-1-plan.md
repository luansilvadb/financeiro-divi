# DIVI Versão Sênior v18 — Plano de Implementação da Fase 1

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar o suporte a empréstimos pessoais e o seletor de parcelamento digitável na camada de domínio, persistência, composables e interface do usuário de forma 100% testada e retrocompatível.

**Architecture:** Segue a Abordagem A (empréstimos acoplados na classe Gasto com divisões otimizadas) e a trilha uniforme de 5 passos visuais no wizard de lançamentos.

**Tech Stack:** Vue 3, Composition API, TypeScript, LocalStorage, Vitest.

---

### Task 1: Extensão do Domínio Gasto

**Files:**
- Modify: `d:/projetos/divi/src/modules/ledger/core/domain/Gasto.ts`
- Test: `d:/projetos/divi/src/modules/ledger/core/domain/Gasto.test.ts`

- [ ] **Step 1: Escrever teste falho em `Gasto.test.ts`**

Adicione este bloco de testes em `d:/projetos/divi/src/modules/ledger/core/domain/Gasto.test.ts` para verificar os campos de parcelamento e empréstimo:

```typescript
  it('deve inicializar com campos padrão de parcelamento e empréstimo se não informados', () => {
    const total = Dinheiro.deCentavos(10000)
    const divisoes = [new DivisaoDeGasto('m1', Dinheiro.deCentavos(10000))]
    const gasto = new Gasto({
      id: 'g1',
      faturaId: 'f1',
      descricao: 'Mercado',
      valorTotal: total,
      compradorId: 'm1',
      divisoes
    })
    expect(gasto.installments).toBe(1)
    expect(gasto.isLoan).toBe(false)
    expect(gasto.borrowerId).toBeNull()
  })

  it('deve aceitar e preservar valores customizados de parcelamento e empréstimo', () => {
    const total = Dinheiro.deCentavos(10000)
    const divisoes = [new DivisaoDeGasto('m2', Dinheiro.deCentavos(10000))]
    const gasto = new Gasto({
      id: 'g1',
      faturaId: 'f1',
      descricao: 'Empréstimo',
      valorTotal: total,
      compradorId: 'm1',
      divisoes,
      installments: 3,
      isLoan: true,
      borrowerId: 'm2'
    })
    expect(gasto.installments).toBe(3)
    expect(gasto.isLoan).toBe(true)
    expect(gasto.borrowerId).toBe('m2')
  })
```

- [ ] **Step 2: Rodar teste para verificar se falha**

Run: `npx vitest run src/modules/ledger/core/domain/Gasto.test.ts`
Expected: Falha de compilação/teste pois os novos campos não existem em `GastoProps` ou na classe `Gasto`.

- [ ] **Step 3: Modificar `Gasto.ts` com a implementação mínima**

Edite `d:/projetos/divi/src/modules/ledger/core/domain/Gasto.ts`:

```typescript
export interface GastoProps {
  id: string
  faturaId: string
  descricao: string
  valorTotal: Dinheiro
  compradorId: string
  divisoes: ReadonlyArray<DivisaoDeGasto>
  
  // Novos campos (Fase 1)
  installments?: number
  isLoan?: boolean
  borrowerId?: string | null
}

export class Gasto {
  public readonly id: string
  public readonly faturaId: string
  public readonly descricao: string
  public readonly valorTotal: Dinheiro
  public readonly compradorId: string
  public readonly divisoes: ReadonlyArray<DivisaoDeGasto>
  
  // Novos campos (Fase 1)
  public readonly installments: number
  public readonly isLoan: boolean
  public readonly borrowerId: string | null

  constructor(props: GastoProps) {
    if (props.divisoes.length === 0) {
      throw new Error('Um gasto deve ter pelo menos uma divisão')
    }
    const soma = props.divisoes.reduce((acc, d) => acc.somar(d.valor), Dinheiro.deCentavos(0))
    if (!soma.equals(props.valorTotal)) {
      throw new Error('A soma das divisões deve ser igual ao valor total do gasto')
    }

    this.id = props.id
    this.faturaId = props.faturaId
    this.descricao = props.descricao
    this.valorTotal = props.valorTotal
    this.compradorId = props.compradorId
    this.divisoes = props.divisoes
    
    // Inicialização retrocompatível
    this.installments = props.installments || 1
    this.isLoan = props.isLoan || false
    this.borrowerId = props.borrowerId || null
  }
}
```

- [ ] **Step 4: Rodar teste para verificar se passa**

Run: `npx vitest run src/modules/ledger/core/domain/Gasto.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/modules/ledger/core/domain/Gasto.ts src/modules/ledger/core/domain/Gasto.test.ts
git commit -m "feat(domain): add loan and installment properties to Gasto entity"
```

---

### Task 2: Extensão da Persistência Gasto

**Files:**
- Modify: `d:/projetos/divi/src/modules/ledger/adapters/LocalStorageGastoRepository.ts`
- Test: `d:/projetos/divi/src/modules/ledger/adapters/LocalStorageGastoRepository.test.ts`

- [ ] **Step 1: Escrever teste falho em `LocalStorageGastoRepository.test.ts`**

Adicione este bloco de testes em `d:/projetos/divi/src/modules/ledger/adapters/LocalStorageGastoRepository.test.ts` para verificar o salvamento e hidratação dos novos campos:

```typescript
  it('deve salvar e carregar gastos contendo dados de parcelamento e empréstimos', async () => {
    const repo = new LocalStorageGastoRepository()
    const divisoes = [new DivisaoDeGasto('m2', Dinheiro.deCentavos(10000))]
    const gasto = new Gasto({
      id: 'gasto_loan_1',
      faturaId: 'f1',
      descricao: 'Empréstimo da Luz',
      valorTotal: Dinheiro.deCentavos(10000),
      compradorId: 'm1',
      divisoes,
      installments: 2,
      isLoan: true,
      borrowerId: 'm2'
    })

    await repo.salvar(gasto)
    const porFatura = await repo.buscarPorFatura('f1')
    const recuperado = porFatura.find(g => g.id === 'gasto_loan_1')

    expect(recuperado).toBeDefined()
    expect(recuperado!.installments).toBe(2)
    expect(recuperado!.isLoan).toBe(true)
    expect(recuperado!.borrowerId).toBe('m2')
  })
```

- [ ] **Step 2: Rodar teste para verificar se falha**

Run: `npx vitest run src/modules/ledger/adapters/LocalStorageGastoRepository.test.ts`
Expected: FAIL (porque o repositório ignora esses campos ao converter para DTO e hidrata com valores padrão).

- [ ] **Step 3: Modificar `LocalStorageGastoRepository.ts`**

Atualize `d:/projetos/divi/src/modules/ledger/adapters/LocalStorageGastoRepository.ts`:

```typescript
// No método salvar() - Linha 19-26
      const dtos = todos.map(g => ({
        id: g.id,
        faturaId: g.faturaId,
        descricao: g.descricao,
        valorTotalCentavos: g.valorTotal.centavos,
        compradorId: g.compradorId,
        divisoes: g.divisoes.map(d => ({ membroId: d.membroId, centavos: d.valor.centavos })),
        installments: g.installments,
        isLoan: g.isLoan,
        borrowerId: g.borrowerId
      }))

// No método listarTodos() - Linha 47-54
        return new Gasto({
          id: g.id,
          faturaId: g.faturaId,
          descricao: g.descricao,
          valorTotal: Dinheiro.deCentavos(g.valorTotalCentavos),
          compradorId,
          divisoes,
          installments: g.installments || 1,
          isLoan: g.isLoan || false,
          borrowerId: g.borrowerId || null
        })
```

- [ ] **Step 4: Rodar teste para verificar se passa**

Run: `npx vitest run src/modules/ledger/adapters/LocalStorageGastoRepository.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/modules/ledger/adapters/LocalStorageGastoRepository.ts src/modules/ledger/adapters/LocalStorageGastoRepository.test.ts
git commit -m "feat(persistence): add loan and installment mapping in LocalStorageGastoRepository"
```

---

### Task 3: Refatoração do Composable useNovoLancamentoWizard

**Files:**
- Modify: `d:/projetos/divi/src/modules/ledger/composables/useNovoLancamentoWizard.ts`
- Test: `d:/projetos/divi/src/modules/ledger/composables/useNovoLancamentoWizard.test.ts`

- [ ] **Step 1: Escrever testes falhos em `useNovoLancamentoWizard.test.ts`**

Substitua os testes antigos de `useNovoLancamentoWizard.test.ts` por testes robustos alinhados com o comportamento de 5 passos da v18:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createApp, defineComponent } from 'vue'
import { useNovoLancamentoWizard } from './useNovoLancamentoWizard'

function withSetup<T>(composable: () => T) {
  let result: T
  const app = createApp(defineComponent({
    setup() {
      result = composable()
      return () => {}
    }
  }))
  app.mount(document.createElement('div'))
  return [result!, app] as const
}

describe('useNovoLancamentoWizard - Sênior v18', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('deve inicializar com o estado padrão sênior', () => {
    const [{ step, totalSteps, wizFlow, wizPayment, installments, borrowerId }] = withSetup(() => useNovoLancamentoWizard([]))
    expect(step.value).toBe(1)
    expect(totalSteps.value).toBe(5)
    expect(wizFlow.value).toBe('expense')
    expect(wizPayment.value).toBe('pix')
    expect(installments.value).toBe(1)
    expect(borrowerId.value).toBeNull()
  })

  it('deve validar canAdvance nos passos do fluxo de Empréstimo', () => {
    const [{ step, wizFlow, compradorSelecionadoId, borrowerId, valor, descricao, canAdvance, next }] = withSetup(() => useNovoLancamentoWizard([]))
    
    // Passo 1: Escolha do fluxo
    wizFlow.value = 'loan'
    expect(canAdvance.value).toBe(true)
    next()

    // Passo 2: Lender
    expect(canAdvance.value).toBe(false)
    compradorSelecionadoId.value = 'luan'
    expect(canAdvance.value).toBe(true)
    next()

    // Passo 3: Borrower
    expect(canAdvance.value).toBe(false)
    borrowerId.value = 'joao'
    expect(canAdvance.value).toBe(true)
    next()

    // Passo 4: Valor
    expect(canAdvance.value).toBe(false)
    valor.value = 500
    expect(canAdvance.value).toBe(true)
    next()

    // Passo 5: Descrição/Lembrete
    expect(canAdvance.value).toBe(false)
    descricao.value = 'Empréstimo do Aluguel'
    expect(canAdvance.value).toBe(true)
  })
})
```

- [ ] **Step 2: Rodar teste para verificar se falha**

Run: `npx vitest run src/modules/ledger/composables/useNovoLancamentoWizard.test.ts`
Expected: FAIL (campos ausentes e falhas na contagem de passos).

- [ ] **Step 3: Escrever implementação completa do composable**

Substitua por completo o arquivo `d:/projetos/divi/src/modules/ledger/composables/useNovoLancamentoWizard.ts` com a implementação unificada detalhada na Seção 2 do spec de design:

```typescript
import { ref, computed } from 'vue'
import { Gasto } from '../core/domain/Gasto'
import { DivisaoDeGasto } from '../core/domain/DivisaoDeGasto'
import { LocalStorageGastoRepository } from '../adapters/LocalStorageGastoRepository'
import { LocalStorageFaturaRepository } from '../adapters/LocalStorageFaturaRepository'
import { Dinheiro } from '../../../shared/primitives/Dinheiro'

const gastoRepo = new LocalStorageGastoRepository()
const faturaRepo = new LocalStorageFaturaRepository()

export function useNovoLancamentoWizard(membros: { id: string; nome: string }[] = []) {
  const step = ref(1)

  // Controle de Fluxo v18
  const wizFlow = ref<'expense' | 'loan'>('expense')
  const wizPayment = ref<'pix' | 'card'>('pix')
  const wizCardOwner = ref<string | null>(null)

  // Dados do Lançamento
  const valor = ref(0)
  const descricao = ref('')
  const compradorSelecionadoId = ref('')
  const borrowerId = ref<string | null>(null)
  const installments = ref(1)

  // Divisão Imediata
  const querDividirAgora = ref(true)
  const participantesDivisao = ref<string[]>(membros.map(m => m.id))
  const modoDivisaoWizard = ref<'IGUAL' | 'MANUAL'>('IGUAL')
  const valoresDivisaoWizard = ref<Record<string, number>>({})

  const totalSteps = computed(() => 5)

  const next = () => {
    if (step.value < totalSteps.value) {
      step.value++
    }
  }

  const prev = () => {
    if (step.value > 1) {
      step.value--
    }
  }

  const canAdvance = computed(() => {
    if (step.value === 1) return true
    
    if (wizFlow.value === 'loan') {
      if (step.value === 2) return !!compradorSelecionadoId.value
      if (step.value === 3) return !!borrowerId.value
      if (step.value === 4) return valor.value > 0
      if (step.value === 5) return descricao.value.trim().length > 0
    } else {
      if (step.value === 2) return !!compradorSelecionadoId.value
      if (step.value === 3) return valor.value > 0
      if (step.value === 4) return descricao.value.trim().length > 0
      if (step.value === 5) {
        if (modoDivisaoWizard.value === 'IGUAL') {
          return participantesDivisao.value.length > 0
        } else {
          const soma = participantesDivisao.value.reduce((acc, id) => acc + (valoresDivisaoWizard.value[id] || 0), 0)
          return Math.abs(soma - valor.value) < 0.01
        }
      }
    }
    return false
  })

  const finalizarGastoOuEmprestimo = async () => {
    if (!compradorSelecionadoId.value) throw new Error('Selecione quem pagou/emprestou')
    if (!valor.value || isNaN(Number(valor.value))) throw new Error('Valor inválido')

    const total = Dinheiro.deReais(Number(valor.value))
    let divisoes: DivisaoDeGasto[] = []

    if (wizFlow.value === 'loan') {
      if (!borrowerId.value) throw new Error('Selecione quem pegou emprestado')
      divisoes = [new DivisaoDeGasto(borrowerId.value, total)]
    } else {
      if (participantesDivisao.value.length === 0) throw new Error('Selecione pelo menos uma pessoa para dividir')
      
      if (modoDivisaoWizard.value === 'IGUAL') {
        const partes = total.distribuir(participantesDivisao.value.length)
        divisoes = participantesDivisao.value.map((id, idx) => new DivisaoDeGasto(id, partes[idx]))
      } else {
        divisoes = participantesDivisao.value.map(id => new DivisaoDeGasto(id, Dinheiro.deReais(valoresDivisaoWizard.value[id] || 0)))
      }
    }

    const todasFaturas = await faturaRepo.listarTodas()
    const faturaAtiva = todasFaturas.find(f => f.status === 'ABERTA') || todasFaturas[0]
    
    if (!faturaAtiva) throw new Error('Nenhuma fatura aberta encontrada para registrar a despesa')

    const novoGasto = new Gasto({
      id: crypto.randomUUID(),
      faturaId: faturaAtiva.id,
      descricao: wizFlow.value === 'loan' ? (descricao.value.trim() || 'Empréstimo Pessoal') : descricao.value,
      valorTotal: total,
      compradorId: compradorSelecionadoId.value,
      divisoes,
      installments: installments.value,
      isLoan: wizFlow.value === 'loan',
      borrowerId: borrowerId.value
    })

    await gastoRepo.salvar(novoGasto)
    reset()
  }

  const reset = () => {
    step.value = 1
    wizFlow.value = 'expense'
    wizPayment.value = 'pix'
    wizCardOwner.value = null
    valor.value = 0
    descricao.value = ''
    compradorSelecionadoId.value = ''
    borrowerId.value = null
    installments.value = 1
    participantesDivisao.value = membros.map(m => m.id)
    modoDivisaoWizard.value = 'IGUAL'
    valoresDivisaoWizard.value = {}
  }

  return {
    step,
    totalSteps,
    wizFlow,
    wizPayment,
    wizCardOwner,
    valor,
    descricao,
    compradorSelecionadoId,
    borrowerId,
    installments,
    querDividirAgora,
    participantesDivisao,
    modoDivisaoWizard,
    valoresDivisaoWizard,
    canAdvance,
    next,
    prev,
    reset,
    finalizarGastoOuEmprestimo
  }
}
```

- [ ] **Step 4: Rodar testes do composable**

Run: `npx vitest run src/modules/ledger/composables/useNovoLancamentoWizard.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/modules/ledger/composables/useNovoLancamentoWizard.ts src/modules/ledger/composables/useNovoLancamentoWizard.test.ts
git commit -m "feat(composable): refactor useNovoLancamentoWizard for unified 5-step senior workflow"
```

---

### Task 4: Atualização da Interface Visual NovoLancamentoWizard.vue

**Files:**
- Modify: `d:/projetos/divi/src/components/ledger/NovoLancamentoWizard.vue`

- [ ] **Step 1: Reescrever NovoLancamentoWizard.vue**

Atualize o componente visual em `d:/projetos/divi/src/components/ledger/NovoLancamentoWizard.vue`. Implemente todos os passos dinâmicos, grids de avatars, seletor de parcelas digitável, chips inteligentes, feedback cognitivo de segurança e rateio otimizado.
