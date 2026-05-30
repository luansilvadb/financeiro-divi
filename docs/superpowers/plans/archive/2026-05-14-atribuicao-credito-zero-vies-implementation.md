# Atribuição Dinâmica de Crédito (Zero Viés) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar a lógica "Zero Viés" no Wizard de lançamento, removendo pré-seleções automáticas e exigindo a escolha explícita de quem participou e quem pagou.

**Architecture:** Refatoração do estado interno do `NovoLancamentoWizard.vue` para suportar seleção dinâmica de pagador (`pagador_id`) e atualização da lógica de validação (`canAdvance`) para garantir integridade dos dados antes do salvamento.

**Tech Stack:** Vue 3, Tailwind CSS, TypeScript.

---

### Task 1: Refatoração do Estado Inicial e Validação

**Files:**
- Modify: `src/components/ledger/NovoLancamentoWizard.vue`

- [ ] **Step 1: Remover pré-seleções automáticas do estado**
```typescript
const tipo = ref<'gasto' | 'ganho' | null>(null)
const fonte_id = ref<string | null>(null) // Agora opcional inicialmente
const beneficiarios_selecionados = ref<string[]>([]) // Começa vazio
```

- [ ] **Step 2: Atualizar `canAdvance` para incluir validação do pagador no Passo 3**
```typescript
const canAdvance = computed(() => {
  if (step.value === 1) return tipo.value !== null
  if (step.value === 2) return valor.value > 0 && descricao.value.length > 0
  if (step.value === 3) return beneficiarios_selecionados.value.length > 0 && fonte_id.value !== null
  return false
})
```

- [ ] **Step 3: Commit**
```bash
git add src/components/ledger/NovoLancamentoWizard.vue
git commit -m "refactor: remove default selections and update validation for zero bias logic"
```

### Task 2: UI do Passo 3 - Seleção Neutra de Participantes e Pagador

**Files:**
- Modify: `src/components/ledger/NovoLancamentoWizard.vue`

- [ ] **Step 1: Refinar a seção "Quem participa?" para ser neutra**
- [ ] **Step 2: Adicionar a nova seção "Quem pagou?" no Passo 3**
```vue
<div class="space-y-4">
  <p class="font-bold text-gray-800">Quem pagou o valor total?</p>
  <div class="flex gap-4 overflow-x-auto pb-2 -mx-2 px-2 no-scrollbar">
    <div 
      v-for="membro in props.membros" 
      :key="membro.id"
      @click="fonte_id = membro.id"
      class="flex flex-col items-center gap-2 cursor-pointer min-w-[70px]"
    >
      <div :class="['w-16 h-16 rounded-full flex items-center justify-center font-bold text-xl transition-all border-4', fonte_id === membro.id ? 'bg-blue-600 border-blue-100 text-white scale-105' : 'bg-gray-100 border-transparent text-gray-400']">
        {{ membro.nome.charAt(0) }}
      </div>
      <span :class="['text-xs font-bold transition-colors', fonte_id === membro.id ? 'text-blue-600' : 'text-gray-400']">
        {{ membro.nome.split(' ')[0] }}
      </span>
    </div>
  </div>
</div>
```

- [ ] **Step 3: Commit**
```bash
git add src/components/ledger/NovoLancamentoWizard.vue
git commit -m "feat: add explicit pagador selection in step 3"
```

### Task 3: Lógica de Finalização e Cálculo Justo

**Files:**
- Modify: `src/components/ledger/NovoLancamentoWizard.vue`

- [ ] **Step 1: Atualizar a função `finalizar` para usar o `fonte_id` selecionado**
```typescript
const finalizar = () => {
  if (!fonte_id.value) return

  const totalRaw = Dinheiro.deReais(valor.value)
  const total = tipo.value === 'ganho' ? Dinheiro.deCentavos(-totalRaw.centavos) : totalRaw

  const finalBeneficiarios = [...beneficiarios_selecionados.value]
  const partes = total.distribuir(finalBeneficiarios.length)
  
  const divisoes = finalBeneficiarios.map((id, index) => {
    return new Divisao(id, partes[index])
  })

  const transacao = new Transacao({
    id: crypto.randomUUID(),
    descricao: descricao.value,
    total,
    origem_id: fonte_id.value, // Membro que pagou
    pagador_id: 'eu', // Mantemos 'eu' como o pagador técnico do ledger (quem opera o app)
    divisoes,
    status: 'pendente',
    data: new Date()
  })

  emit('salvar', transacao)
  // ... reset logic
}
```

- [ ] **Step 2: Resetar o `fonte_id` após o salvamento**
```typescript
fonte_id.value = null
beneficiarios_selecionados.value = []
```

- [ ] **Step 3: Commit**
```bash
git add src/components/ledger/NovoLancamentoWizard.vue
git commit -m "feat: implement fair credit calculation using dynamic pagador"
```

### Task 4: Verificação e Testes Unitários

**Files:**
- Modify: `src/components/ledger/NovoLancamentoWizard.test.ts`

- [ ] **Step 1: Atualizar testes para verificar que o botão salvar só habilita com pagador selecionado**
- [ ] **Step 2: Adicionar teste para cenário onde outra pessoa (não "Eu") é o pagador**
- [ ] **Step 3: Executar testes**
Run: `npx vitest run src/components/ledger/NovoLancamentoWizard.test.ts`
Expected: PASS

- [ ] **Step 4: Commit**
```bash
git add src/components/ledger/NovoLancamentoWizard.test.ts
git commit -m "test: update tests for dynamic credit attribution"
```
