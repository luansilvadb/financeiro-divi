# Refatoração do Dashboard e Extrato de Membros Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refatorar o `DashboardSaldos.vue` movendo a lógica de extrato para o Core Domain e quebrando a UI em componentes modulares.

**Architecture:** Transferência de lógica de negócio para `CalculadoraSaldos.ts` e criação de componentes de UI especializados (`CardSaldoMembro`, `ItemExtratoCard`) seguindo os princípios de Arquitetura Hexagonal e Componentes Pequenos.

**Tech Stack:** Vue 3, TypeScript, Vitest, Tailwind CSS.

---

### Task 1: Core - Implementar `obterExtratoMembro` na `CalculadoraSaldos`

**Files:**
- Modify: `src/modules/ledger/core/services/CalculadoraSaldos.ts`
- Modify: `src/modules/ledger/core/services/CalculadoraSaldos.test.ts`

- [ ] **Step 1: Escrever teste para `obterExtratoMembro`**

```typescript
// Adicionar ao src/modules/ledger/core/services/CalculadoraSaldos.test.ts
it('deve calcular o extrato detalhado com saldo acumulado para um membro', () => {
  const t1 = new Transacao({
    id: 't1',
    descricao: 'Mercado',
    total: Dinheiro.deReais(100),
    pagamentos: [{ membro_id: 'luan', valor: Dinheiro.deReais(100) }],
    divisoes: [
      new Divisao('luan', Dinheiro.deReais(50)),
      new Divisao('maria', Dinheiro.deReais(50))
    ],
    status: 'pendente',
    data: new Date('2026-05-01')
  })

  const extrato = CalculadoraSaldos.obterExtratoMembro('luan', [t1])
  expect(extrato).toHaveLength(1)
  expect(extrato[0].valorLiquido.centavos).toBe(5000) // Pagou 100, consumiu 50
  expect(extrato[0].saldoAcumulado.centavos).toBe(5000)
})
```

- [ ] **Step 2: Executar teste para verificar falha**

Run: `npx vitest src/modules/ledger/core/services/CalculadoraSaldos.test.ts`
Expected: FAIL (método não existe)

- [ ] **Step 3: Implementar `obterExtratoMembro`**

```typescript
// Em src/modules/ledger/core/services/CalculadoraSaldos.ts

export interface ItemExtrato {
  id: string
  descricao: string
  data: Date
  valorPago: Dinheiro
  valorConsumido: Dinheiro
  valorLiquido: Dinheiro
  saldoAcumulado: Dinheiro
}

// Dentro da classe CalculadoraSaldos
static obterExtratoMembro(membroId: string, transacoes: Transacao[]): ItemExtrato[] {
  const transacoesOrdenadas = [...transacoes].sort((a, b) => a.data.getTime() - b.data.getTime())
  
  let saldoAcumulado = Dinheiro.deCentavos(0)
  
  return transacoesOrdenadas.map(t => {
    const valorPago = t.pagamentos.find(p => p.membro_id === membroId)?.valor || Dinheiro.deCentavos(0)
    const valorConsumido = t.divisoes.find(d => d.beneficiario_id === membroId)?.valor || Dinheiro.deCentavos(0)
    const valorLiquido = valorPago.subtrair(valorConsumido)
    
    saldoAcumulado = saldoAcumulado.somar(valorLiquido)
    
    return {
      id: t.id,
      descricao: t.descricao,
      data: t.data,
      valorPago,
      valorConsumido,
      valorLiquido,
      saldoAcumulado
    }
  })
}
```

- [ ] **Step 4: Executar teste para verificar sucesso**

Run: `npx vitest src/modules/ledger/core/services/CalculadoraSaldos.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/modules/ledger/core/services/CalculadoraSaldos.ts src/modules/ledger/core/services/CalculadoraSaldos.test.ts
git commit -m "feat(ledger): implementar obterExtratoMembro na CalculadoraSaldos"
```

---

### Task 2: UI - Criar Componente `CardSaldoMembro.vue`

**Files:**
- Create: `src/components/ledger/dashboard/CardSaldoMembro.vue`

- [ ] **Step 1: Implementar o componente de card**

Extrair o HTML e classes Tailwind do card individual de saldo de `DashboardSaldos.vue`.

```vue
<script setup lang="ts">
import { User, ChevronDown, ChevronUp } from 'lucide-vue-next'
import { Dinheiro } from '../../../shared/primitives/Dinheiro'

defineProps<{
  nome: string
  saldo: Dinheiro
  isExpanded: boolean
}>()

defineEmits(['toggle'])

const formatarDinheiro = (valor: Dinheiro) => {
  return valor.formatar()
}
</script>

<template>
  <div class="rounded-xl overflow-hidden border border-gray-100 mb-4">
    <div 
      @click="$emit('toggle')"
      :class="['flex items-center justify-between p-3 cursor-pointer transition-colors', isExpanded ? 'bg-blue-50' : 'bg-gray-50 hover:bg-gray-100']"
    >
      <div class="flex items-center gap-3">
        <div :class="['p-2 rounded-full', saldo.centavos >= 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600']">
          <User class="w-5 h-5" />
        </div>
        <span class="font-medium text-gray-700">{{ nome }}</span>
      </div>
      <div class="flex items-center gap-4">
        <div class="text-right">
          <div :class="['font-bold text-lg', saldo.centavos >= 0 ? 'text-green-600' : 'text-red-600']">
            {{ saldo.centavos > 0 ? '+' : '' }}{{ formatarDinheiro(saldo) }}
          </div>
        </div>
        <component :is="isExpanded ? ChevronUp : ChevronDown" class="w-4 h-4 text-gray-400" />
      </div>
    </div>
    
    <div v-if="isExpanded" class="bg-white border-t border-blue-50 p-4 space-y-4">
      <slot name="details" />
    </div>
  </div>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ledger/dashboard/CardSaldoMembro.vue
git commit -m "feat(ui): criar componente CardSaldoMembro"
```

---

### Task 3: UI - Criar Componente `ItemExtratoCard.vue`

**Files:**
- Create: `src/components/ledger/dashboard/ItemExtratoCard.vue`

- [ ] **Step 1: Implementar o card de item do extrato**

Extrair a lógica visual do card de transação do drilldown.

```vue
<script setup lang="ts">
import { Dinheiro } from '../../../shared/primitives/Dinheiro'

interface ItemExtrato {
  id: string
  descricao: string
  data: Date
  valorPago: Dinheiro
  valorConsumido: Dinheiro
  valorLiquido: Dinheiro
  saldoAcumulado: Dinheiro
}

defineProps<{
  item: ItemExtrato
}>()

const formatDataCurta = (date: Date) => {
  return new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).toUpperCase()
}

const formatarDinheiro = (valor: Dinheiro) => {
  return valor.formatar()
}
</script>

<template>
  <div class="bg-[#FAFAFA] rounded-[24px] shadow-sm border border-slate-100 relative overflow-hidden flex flex-col mb-4">
    <!-- Borda Semântica Lateral -->
    <div :class="['absolute top-0 left-0 w-1.5 h-full', 
                   item.valorLiquido.centavos > 0 ? 'bg-emerald-500' : (item.valorLiquido.centavos === 0 ? 'bg-slate-300' : 'bg-red-500')]"></div>

    <div class="p-6 pb-4 flex justify-between items-center">
      <div class="flex-1">
        <h2 class="text-[17px] font-bold text-slate-800 leading-tight">{{ item.descricao }}</h2>
        <span :class="['inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-black mt-2 uppercase tracking-tighter border',
                        item.valorLiquido.centavos > 0 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                        (item.valorLiquido.centavos === 0 ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-red-50 text-red-600 border-red-100')]">
          {{ item.valorLiquido.centavos > 0 ? 'CRÉDITO' : (item.valorLiquido.centavos === 0 ? 'NEUTRO' : 'DÉBITO') }}
        </span>
      </div>
      <div class="text-right">
        <div :class="['text-2xl font-mono font-black tracking-tighter', 
                      item.valorLiquido.centavos > 0 ? 'text-emerald-600' : (item.valorLiquido.centavos === 0 ? 'text-slate-400' : 'text-red-600')]">
          {{ item.valorLiquido.centavos > 0 ? '+' : '' }}{{ formatarDinheiro(item.valorLiquido).replace('R$', '').trim() }}
        </div>
        <p class="text-[10px] font-bold text-slate-300 mt-1 uppercase tracking-widest">{{ formatDataCurta(item.data) }}</p>
      </div>
    </div>

    <div class="mx-6 py-5 flex border-t border-slate-50">
      <div class="flex-1 space-y-1 pr-4 border-r border-slate-50">
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Você Pagou</span>
        <p class="text-sm font-mono font-bold text-slate-800">{{ formatarDinheiro(item.valorPago) }}</p>
      </div>
      <div class="flex-1 space-y-1 pl-6">
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sua Parte</span>
        <p class="text-sm font-mono font-bold text-slate-800">{{ formatarDinheiro(item.valorConsumido) }}</p>
      </div>
    </div>
  </div>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ledger/dashboard/ItemExtratoCard.vue
git commit -m "feat(ui): criar componente ItemExtratoCard"
```

---

### Task 4: Refatorar `DashboardSaldos.vue`

**Files:**
- Modify: `src/components/ledger/DashboardSaldos.vue`

- [ ] **Step 1: Limpar lógica do componente e integrar novos sub-componentes**

```vue
<script setup lang="ts">
import { computed, ref } from 'vue'
import { Dinheiro } from '../../shared/primitives/Dinheiro'
import { CalculadoraSaldos } from '../../modules/ledger/core/services/CalculadoraSaldos'
import { Transacao } from '../../modules/ledger/core/domain/Transacao'
import CardSaldoMembro from './dashboard/CardSaldoMembro.vue'
import ItemExtratoCard from './dashboard/ItemExtratoCard.vue'

interface Props {
  saldos: Map<string, Dinheiro>
  membros: { id: string; nome: string }[]
  transacoes: Transacao[]
}

const props = defineProps<Props>()
const selectedMemberId = ref<string | null>(null)

const saldosList = computed(() => {
  return props.membros.map(m => ({
    id: m.id,
    nome: m.nome,
    saldo: props.saldos.get(m.id) || Dinheiro.deCentavos(0)
  })).sort((a, b) => b.saldo.centavos - a.saldo.centavos)
})

const getExtrato = (id: string) => {
  return CalculadoraSaldos.obterExtratoMembro(id, props.transacoes).reverse() // Mostrar mais recentes primeiro
}

const toggleDrilldown = (id: string) => {
  selectedMemberId.value = selectedMemberId.value === id ? null : id
}
</script>

<template>
  <div class="max-w-md mx-auto space-y-6">
    <div class="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
      <h2 class="text-2xl font-bold text-gray-800 mb-6">Saldos</h2>

      <CardSaldoMembro 
        v-for="item in saldosList" 
        :key="item.id"
        :nome="item.nome"
        :saldo="item.saldo"
        :is-expanded="selectedMemberId === item.id"
        @toggle="toggleDrilldown(item.id)"
      >
        <template #details>
          <ItemExtratoCard 
            v-for="extratoItem in getExtrato(item.id)" 
            :key="extratoItem.id"
            :item="extratoItem"
          />
        </template>
      </CardSaldoMembro>
    </div>
  </div>
</template>
```

- [ ] **Step 2: Executar testes de UI existentes**

Run: `npx vitest src/components/ledger/DashboardSaldos.test.ts`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/ledger/DashboardSaldos.vue
git commit -m "refactor(ui): simplificar DashboardSaldos usando novos componentes e service"
```
