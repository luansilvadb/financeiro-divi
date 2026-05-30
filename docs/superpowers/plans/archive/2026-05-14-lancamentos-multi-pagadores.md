# Lançamentos Multi-Pagadores (Rateio Realista) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir que transações sejam pagas por múltiplos membros com valores arbitrários, refletindo pagamentos parciais e "vaquinhas".

**Architecture:** Refatorar a entidade `Transacao` para remover o pagador único em favor de uma lista de `pagamentos`. Atualizar o `NovoLancamentoWizard` para permitir a entrada desses valores manualmente no Passo 3, com validação de soma.

**Tech Stack:** Vue 3, TypeScript, Vitest.

---

### Task 1: Refatoração do Domínio (Transacao)

**Files:**
- Modify: `src/modules/ledger/core/domain/Transacao.ts`
- Modify: `src/modules/ledger/core/domain/Transacao.test.ts`

- [ ] **Step 1: Remover `pagador_id` da entidade `Transacao`**

A entidade já possui `pagamentos`, mas ainda mantém `pagador_id`. Vamos removê-lo pois agora múltiplos membros podem pagar.

```typescript
// src/modules/ledger/core/domain/Transacao.ts

export interface TransacaoProps {
  id: string
  descricao: string
  total: Dinheiro
  pagamentos: Pagamento[]
  // pagador_id removido
  divisoes: Divisao[]
  status: TransacaoStatus
  data: Date
}

export class Transacao {
  public readonly id: string
  public readonly descricao: string
  public readonly total: Dinheiro
  public readonly pagamentos: Pagamento[]
  // pagador_id removido
  public readonly divisoes: Divisao[]
  public readonly status: TransacaoStatus
  public readonly data: Date

  constructor(props: TransacaoProps) {
    validarSomaDivisoes(props.divisoes, props.total)
    validarSomaPagamentos(props.pagamentos, props.total)
    
    this.id = props.id
    this.descricao = props.descricao
    this.total = props.total
    this.pagamentos = props.pagamentos
    this.divisoes = props.divisoes
    this.status = props.status
    this.data = props.data
  }
}
```

- [ ] **Step 2: Atualizar testes de `Transacao`**

Remover o campo `pagador_id` das instâncias nos testes.

- [ ] **Step 3: Executar testes de domínio**

Run: `npm test src/modules/ledger/core/domain/Transacao.test.ts`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/modules/ledger/core/domain/Transacao.ts src/modules/ledger/core/domain/Transacao.test.ts
git commit -m "refactor: remove redundant pagador_id from Transacao entity"
```

---

### Task 2: Atualização do Wizard - Estado e Lógica de Pagamentos

**Files:**
- Modify: `src/components/ledger/NovoLancamentoWizard.vue`

- [ ] **Step 1: Adicionar estado para pagamentos manuais**

No script do Wizard, vamos substituir `fonte_id` por um Map ou objeto que armazene quanto cada membro pagou.

```typescript
// src/components/ledger/NovoLancamentoWizard.vue

// Substituir: const fonte_id = ref<string | null>(null)
// Por:
const pagamentos = ref<Record<string, number>>({})

// Inicializar pagamentos com 0 para todos os membros
watch(() => props.membros, (novos) => {
  novos.forEach(m => {
    if (pagamentos.value[m.id] === undefined) {
      pagamentos.value[m.id] = 0
    }
  })
}, { immediate: true })
```

- [ ] **Step 2: Implementar computada para soma dos pagamentos e restante**

```typescript
const somaPagamentos = computed(() => {
  return Object.values(pagamentos.value).reduce((acc, val) => acc + (val || 0), 0)
})

const restantePagamento = computed(() => {
  return valor.value - somaPagamentos.value
})

const pagamentosEquilibrados = computed(() => {
  // Usar pequena margem para evitar erros de ponto flutuante no input manual
  return Math.abs(restantePagamento.value) < 0.001
})
```

- [ ] **Step 3: Atualizar `canAdvance` para o Passo 3**

```typescript
const canAdvance = computed(() => {
  if (step.value === 1) return tipo.value !== null
  if (step.value === 2) return valor.value > 0 && descricao.value.length > 0
  if (step.value === 3) return beneficiarios_selecionados.value.length > 0 && pagamentosEquilibrados.value
  return false
})
```

- [ ] **Step 4: Commit**

```bash
git add src/components/ledger/NovoLancamentoWizard.vue
git commit -m "feat: add multi-payment state and validation to wizard"
```

---

### Task 3: Atualização do Wizard - Interface de Rateio Realista

**Files:**
- Modify: `src/components/ledger/NovoLancamentoWizard.vue`

- [ ] **Step 1: Implementar UI de inputs de pagamento no Passo 3**

Substituir a seleção de "Quem pagou o valor total?" pela lista de inputs.

```vue
<!-- Passo 3 - Seção de Pagadores -->
<div class="space-y-4 border-t pt-6">
  <div class="flex justify-between items-center">
    <p class="font-bold text-gray-800">Quem abriu a carteira?</p>
    <div :class="['text-xs font-black px-2 py-1 rounded-full', pagamentosEquilibrados ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700']">
      {{ pagamentosEquilibrados ? '✅ Equilibrado' : `Faltam R$ ${restantePagamento.toFixed(2)}` }}
    </div>
  </div>

  <div class="space-y-3">
    <div v-for="membro in props.membros" :key="membro.id" class="flex items-center gap-4 bg-gray-50 p-3 rounded-2xl">
      <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600 text-sm">
        {{ membro.nome.charAt(0) }}
      </div>
      <div class="flex-1">
        <span class="block text-sm font-bold text-gray-700">{{ membro.nome }}</span>
      </div>
      <div class="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-gray-200 focus-within:border-blue-500 transition-all">
        <span class="text-xs font-bold text-gray-400">R$</span>
        <input 
          v-model.number="pagamentos[membro.id]" 
          type="number" 
          step="0.01"
          class="w-20 text-right font-bold text-gray-800 focus:outline-none bg-transparent"
          placeholder="0,00"
        />
      </div>
    </div>
  </div>
</div>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ledger/NovoLancamentoWizard.vue
git commit -m "feat: implement multi-payer input UI in wizard step 3"
```

---

### Task 4: Atualização da Lógica de Finalização

**Files:**
- Modify: `src/components/ledger/NovoLancamentoWizard.vue`

- [ ] **Step 1: Atualizar método `finalizar`**

Transformar o objeto `pagamentos` em uma lista de objetos `Pagamento` com instâncias de `Dinheiro`.

```typescript
const finalizar = () => {
  const totalRaw = Dinheiro.deReais(valor.value)
  const total = tipo.value === 'ganho' ? Dinheiro.deCentavos(-totalRaw.centavos) : totalRaw

  const finalBeneficiarios = [...beneficiarios_selecionados.value]
  const partes = total.distribuir(finalBeneficiarios.length)
  const divisoes = finalBeneficiarios.map((id, index) => new Divisao(id, partes[index]))

  // Gerar lista de pagamentos
  const listaPagamentos = Object.entries(pagamentos.value)
    .filter(([_, val]) => val > 0)
    .map(([membro_id, val]) => ({
      membro_id,
      valor: Dinheiro.deReais(val)
    }))

  const transacao = new Transacao({
    id: crypto.randomUUID(),
    descricao: descricao.value,
    total,
    pagamentos: listaPagamentos,
    divisoes,
    status: 'pendente',
    data: new Date()
  })

  emit('salvar', transacao)
  
  // Limpar rascunho e resetar (incluindo pagamentos)
  localStorage.removeItem(STORAGE_KEY)
  step.value = 1
  valor.value = 0
  descricao.value = ''
  tipo.value = null
  beneficiarios_selecionados.value = []
  Object.keys(pagamentos.value).forEach(k => pagamentos.value[k] = 0)
}
```

- [ ] **Step 2: Atualizar persistência do rascunho**

Garantir que os pagamentos sejam salvos no `localStorage`.

- [ ] **Step 3: Commit**

```bash
git add src/components/ledger/NovoLancamentoWizard.vue
git commit -m "feat: update wizard finalization logic for multi-payments"
```

---

### Task 5: Verificação e Testes E2E (Simulados)

**Files:**
- Modify: `src/components/ledger/NovoLancamentoWizard.test.ts`

- [ ] **Step 1: Adicionar caso de teste para multi-pagadores no Wizard**

Verificar se o Wizard emite o evento `salvar` com múltiplos pagadores.

- [ ] **Step 2: Executar todos os testes**

Run: `npm test`
Expected: ALL PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/ledger/NovoLancamentoWizard.test.ts
git commit -m "test: add test case for multi-payer wizard flow"
```
