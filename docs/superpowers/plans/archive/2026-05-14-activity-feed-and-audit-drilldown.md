# Activity Feed and Audit Drilldown Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a chronological activity feed and a member-specific audit drilldown to provide transparency and proof of balances.

**Architecture:** Create a new `ActivityFeed` component for the general transaction list and enhance `DashboardSaldos` to handle member-specific transaction filtering (drilldown).

**Tech Stack:** Vue 3, TypeScript, Lucide Icons, Tailwind CSS.

---

### Task 1: Create ActivityFeed Component

**Files:**
- Create: `src/components/ledger/ActivityFeed.vue`

- [ ] **Step 1: Implement ActivityFeed.vue**

```vue
<script setup lang="ts">
import { Clock, User, ArrowUpRight, ArrowDownLeft } from 'lucide-vue-next'
import type { Transacao } from '../../modules/ledger/core/domain/Transacao'

interface Props {
  transacoes: Transacao[]
  membros: { id: string; nome: string }[]
}

const props = defineProps<Props>()

const getMembroNome = (id: string) => {
  return props.membros.find(m => m.id === id)?.nome || id
}

const sortedTransacoes = [...props.transacoes].sort((a, b) => b.data.getTime() - a.data.getTime())

const formatDate = (date: Date) => {
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}
</script>

<template>
  <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
    <div class="p-4 border-b border-gray-50 flex items-center gap-2">
      <Clock class="w-5 h-5 text-blue-600" />
      <h3 class="font-bold text-gray-800">Atividade Recente</h3>
    </div>

    <div class="divide-y divide-gray-50 max-h-96 overflow-y-auto">
      <div v-if="sortedTransacoes.length === 0" class="p-8 text-center text-gray-400 italic text-sm">
        Nenhuma transação encontrada.
      </div>
      
      <div 
        v-for="t in sortedTransacoes" 
        :key="t.id"
        class="p-4 hover:bg-gray-50 transition"
      >
        <div class="flex justify-between items-start mb-1">
          <span class="font-bold text-gray-800 text-sm">{{ t.descricao }}</span>
          <span class="font-bold text-blue-600">{{ t.total.formatar() }}</span>
        </div>
        
        <div class="flex justify-between items-center text-xs text-gray-500">
          <div class="flex items-center gap-1">
            <User class="w-3 h-3" />
            <span>Pago por <strong>{{ getMembroNome(t.origem_id) }}</strong></span>
          </div>
          <span>{{ formatDate(t.data) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
```

- [ ] **Step 2: Update App.vue to include ActivityFeed**

Modify `src/App.vue` to pass `transacoes` to `DashboardSaldos` and show `ActivityFeed` below it.

```vue
<!-- ... imports ... -->
import ActivityFeed from './components/ledger/ActivityFeed.vue'
<!-- ... -->

<!-- ... inside main ... -->
<div v-if="currentView === 'dashboard'" class="space-y-6">
  <DashboardSaldos 
    :saldos="saldos" 
    :membros="membros"
    :transacoes="transacoes"
    @novo-lancamento="currentView = 'wizard'"
  />
  
  <ActivityFeed 
    :transacoes="transacoes"
    :membros="membros"
  />
</div>
```

### Task 2: Implement Audit Drilldown in DashboardSaldos

**Files:**
- Modify: `src/components/ledger/DashboardSaldos.vue`

- [x] **Step 1: Update DashboardSaldos.vue script**

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'
import { User, ArrowRight, PlusCircle, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownLeft, X } from 'lucide-vue-next'
import { Dinheiro } from '../../shared/primitives/Dinheiro'
import { CalculadoraSaldos, type Acerto } from '../../modules/ledger/core/services/CalculadoraSaldos'
import type { Transacao } from '../../modules/ledger/core/domain/Transacao'

interface Props {
  saldos: Map<string, Dinheiro>
  membros: { id: string; nome: string }[]
  transacoes: Transacao[]
}

const props = defineProps<Props>()
const emit = defineEmits(['novo-lancamento'])

const selectedMemberId = ref<string | null>(null)

const getMembroNome = (id: string) => {
  return props.membros.find(m => m.id === id)?.nome || id
}

const acertos = computed(() => {
  return CalculadoraSaldos.calcularAcertos(props.saldos)
})

const saldosList = computed(() => {
  return props.membros.map(m => ({
    id: m.id,
    nome: m.nome,
    saldo: props.saldos.get(m.id) || Dinheiro.deCentavos(0)
  })).sort((a, b) => b.saldo.centavos - a.saldo.centavos)
})

const memberTransactions = computed(() => {
  if (!selectedMemberId.value) return []
  
  return props.transacoes
    .filter(t => 
      t.origem_id === selectedMemberId.value || 
      t.divisoes.some(d => d.membro_id === selectedMemberId.value)
    )
    .map(t => {
      const isCredit = t.origem_id === selectedMemberId.value
      const myShare = t.divisoes.find(d => d.membro_id === selectedMemberId.value)?.valor || Dinheiro.deCentavos(0)
      
      return {
        ...t,
        isCredit,
        myShare
      }
    })
    .sort((a, b) => b.data.getTime() - a.data.getTime())
})

const formatarDinheiro = (valor: Dinheiro) => {
  const absoluteValue = Math.abs(valor.centavos / 100).toFixed(2)
  return `R$ ${absoluteValue}`
}
</script>
```

- [ ] **Step 2: Update DashboardSaldos.vue template**

Make the cards clickable and add the drilldown section.

```vue
<template>
  <div class="max-w-md mx-auto space-y-6">
    <!-- Header/Resumo -->
    <div class="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-bold text-gray-800">Saldos</h2>
        <button 
          @click="emit('novo-lancamento')"
          class="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-full font-medium hover:bg-blue-700 transition shadow-sm"
        >
          <PlusCircle class="w-5 h-5" />
          Novo
        </button>
      </div>

      <div class="space-y-4">
        <div 
          v-for="item in saldosList" 
          :key="item.id"
          @click="selectedMemberId = selectedMemberId === item.id ? null : item.id"
          :class="[
            'flex items-center justify-between p-3 rounded-xl transition cursor-pointer',
            selectedMemberId === item.id ? 'bg-blue-50 ring-2 ring-blue-200' : 'bg-gray-50 hover:bg-gray-100'
          ]"
        >
          <div class="flex items-center gap-3">
            <div :class="['p-2 rounded-full', item.saldo.centavos >= 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600']">
              <User class="w-5 h-5" />
            </div>
            <span class="font-medium text-gray-700">{{ item.nome }}</span>
          </div>
          <div class="text-right">
            <div :class="['font-bold text-lg', item.saldo.centavos >= 0 ? 'text-green-600' : 'text-red-600']">
              {{ item.saldo.centavos > 0 ? '+' : '' }}{{ formatarDinheiro(item.saldo) }}
            </div>
            <div class="text-xs text-gray-400 uppercase font-semibold">
              {{ item.saldo.centavos >= 0 ? 'A receber' : 'A pagar' }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Drilldown Section -->
    <div v-if="selectedMemberId" class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
      <div class="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50">
        <div class="flex items-center gap-2">
          <TrendingDown class="w-5 h-5 text-gray-500" />
          <h3 class="font-bold text-gray-800">Extrato: {{ getMembroNome(selectedMemberId) }}</h3>
        </div>
        <button @click="selectedMemberId = null" class="text-gray-400 hover:text-gray-600 p-1">
          <X class="w-5 h-5" />
        </button>
      </div>

      <div class="divide-y divide-gray-50 max-h-64 overflow-y-auto">
        <div v-if="memberTransactions.length === 0" class="p-8 text-center text-gray-400 italic text-sm">
          Nenhuma transação para este membro.
        </div>
        <div 
          v-for="t in memberTransactions" 
          :key="t.id"
          class="p-4 text-sm"
        >
          <div class="flex justify-between items-start mb-1">
            <span class="font-medium text-gray-700">{{ t.descricao }}</span>
            <div class="flex flex-col items-end">
              <span v-if="t.isCredit" class="text-green-600 font-bold flex items-center gap-1">
                <ArrowUpRight class="w-3 h-3" />
                {{ t.total.formatar() }}
              </span>
              <span v-else class="text-red-600 font-bold flex items-center gap-1">
                <ArrowDownLeft class="w-3 h-3" />
                -{{ t.myShare.formatar() }}
              </span>
            </div>
          </div>
          <div class="text-[10px] text-gray-400 uppercase font-semibold">
            {{ t.isCredit ? 'Crédito (Pagou tudo)' : 'Débito (Sua parte)' }}
          </div>
        </div>
      </div>
    </div>
...
```

### Task 3: Commit Changes

- [ ] **Step 1: Commit**
`git add src && git commit -m "feat: add activity feed and audit drilldown to dashboard"`
