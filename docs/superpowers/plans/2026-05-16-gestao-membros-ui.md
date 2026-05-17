# Gestão de Moradores UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the management interface for members (moradores) and integrate it into the main application.

**Architecture:** Use the existing `useMembros` composable to manage the state. Create a new component `ConfiguracoesMembros.vue` for the management UI and update `App.vue` to handle the new view and replace hardcoded data.

**Tech Stack:** Vue 3 (Composition API), TypeScript, Tailwind CSS, Lucide Vue Next.

---

### Task 1: Criar componente ConfiguracoesMembros.vue

**Files:**
- Create: `src/components/ledger/ConfiguracoesMembros.vue`

- [ ] **Step 1: Implementar o componente de configurações**

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useMembros } from '../../modules/ledger/composables/useMembros'
import { UserPlus, UserMinus, ArrowLeft } from 'lucide-vue-next'

const { membros, adicionarMembro, desativarMembro } = useMembros()
const novoNome = ref('')

const emit = defineEmits(['voltar'])

const handleAdicionar = async () => {
  if (novoNome.value.trim()) {
    await adicionarMembro(novoNome.value.trim())
    novoNome.value = ''
  }
}
</script>

<template>
  <div class="max-w-md mx-auto space-y-6">
    <div class="flex items-center gap-4 mb-2">
      <button @click="emit('voltar')" class="p-2 hover:bg-gray-200 rounded-full transition-colors">
        <ArrowLeft class="w-6 h-6 text-gray-600" />
      </button>
      <h2 class="text-2xl font-bold text-gray-800">Gerenciar Moradores</h2>
    </div>

    <!-- Adicionar Novo -->
    <div class="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
      <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Adicionar Novo Morador</h3>
      <div class="flex gap-2">
        <input 
          v-model="novoNome"
          type="text" 
          placeholder="Nome do morador"
          class="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
          @keyup.enter="handleAdicionar"
        />
        <button 
          @click="handleAdicionar"
          class="bg-blue-900 text-white p-2 rounded-xl hover:bg-blue-800 transition-colors disabled:opacity-50"
          :disabled="!novoNome.trim()"
        >
          <UserPlus class="w-6 h-6" />
        </button>
      </div>
    </div>

    <!-- Lista de Membros -->
    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div class="divide-y divide-gray-50">
        <div 
          v-for="membro in membros" 
          :key="membro.id"
          class="p-4 flex justify-between items-center"
          :class="{ 'opacity-50 grayscale': !membro.ativo }"
        >
          <div>
            <span class="font-bold text-gray-800">{{ membro.nome }}</span>
            <span v-if="!membro.ativo" class="ml-2 text-xs text-gray-400 italic">(Desativado)</span>
          </div>
          
          <button 
            v-if="membro.ativo"
            @click="desativarMembro(membro.id)"
            class="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Desativar morador"
          >
            <UserMinus class="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ledger/ConfiguracoesMembros.vue
git commit -m "feat(ui): adicionar tela de gestão de moradores"
```

---

### Task 2: Integrar useMembros no App.vue

**Files:**
- Modify: `src/App.vue`

- [ ] **Step 1: Substituir membros hardcoded e integrar a nova View**

```vue
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import NovoLancamentoWizard from './components/ledger/NovoLancamentoWizard.vue'
import DashboardSaldos from './components/ledger/DashboardSaldos.vue'
import ActivityFeed from './components/ledger/ActivityFeed.vue'
import ConfiguracoesMembros from './components/ledger/ConfiguracoesMembros.vue'
import { Plus, X, Settings } from 'lucide-vue-next'
import { LocalStorageTransacaoRepository } from './modules/ledger/adapters/LocalStorageTransacaoRepository'
import { CalculadoraSaldos } from './modules/ledger/core/services/CalculadoraSaldos'
import { Transacao } from './modules/ledger/core/domain/Transacao'
import { useMembros } from './modules/ledger/composables/useMembros'

const currentView = ref<'dashboard' | 'wizard' | 'settings'>('dashboard')
const repository = new LocalStorageTransacaoRepository()
const transacoes = ref<Transacao[]>([])
const { ativos: membros, carregar: carregarMembros } = useMembros()

const carregarTransacoes = async () => {
  transacoes.value = await repository.listarTodas()
}

const saldos = computed(() => {
  return CalculadoraSaldos.calcular(transacoes.value)
})

onMounted(async () => {
  await Promise.all([
    carregarTransacoes(),
    carregarMembros()
  ])
})

const handleSalvarTransacao = async (t: Transacao) => {
  await repository.salvar(t)
  await carregarTransacoes()
  currentView.value = 'dashboard'
}
</script>

<template>
  <div class="min-h-screen bg-gray-100 py-10 px-4 pb-24">
    <header class="relative max-w-md mx-auto mb-8 text-center">
      <h1 class="text-3xl font-extrabold text-blue-900 tracking-tight">DIVI</h1>
      <p class="text-blue-600 font-medium">Orquestrador Financeiro</p>
      
      <div class="absolute right-0 top-1/2 -translate-y-1/2 flex gap-2">
        <button 
          v-if="currentView === 'dashboard'"
          @click="currentView = 'settings'"
          class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200/50 rounded-full"
          aria-label="Configurações"
        >
          <Settings class="w-6 h-6" />
        </button>

        <button 
          v-if="currentView !== 'dashboard'"
          @click="currentView = 'dashboard'"
          class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200/50 rounded-full"
          :aria-label="currentView === 'wizard' ? 'Cancelar lançamento' : 'Voltar'"
        >
          <X class="w-6 h-6" />
        </button>
      </div>
    </header>

    <main>
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
      
      <NovoLancamentoWizard 
        v-else-if="currentView === 'wizard'"
        :membros="membros"
        @salvar="handleSalvarTransacao"
        @cancelar="currentView = 'dashboard'"
      />

      <ConfiguracoesMembros
        v-else-if="currentView === 'settings'"
        @voltar="currentView = 'dashboard'"
      />
    </main>

    <footer class="max-w-md mx-auto mt-12 text-center text-gray-400 text-xs">
      &copy; 2026 DIVI - Máquina da Verdade
    </footer>

    <button 
      v-if="currentView === 'dashboard'"
      @click="currentView = 'wizard'"
      class="fixed bottom-10 right-6 w-16 h-16 bg-blue-900 text-white rounded-full flex items-center justify-center shadow-2xl border-4 border-white ring-4 ring-blue-900/5 hover:bg-blue-800 z-[9999]"
      aria-label="Novo lançamento"
    >
      <Plus class="w-10 h-10 stroke-[3px]" />
    </button>
  </div>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add src/App.vue
git commit -m "feat(ui): integrar gestão de moradores no App.vue"
```

---

### Task 3: Verificação Final

- [ ] **Step 1: Verificar se os moradores iniciais são carregados corretamente**
- [ ] **Step 2: Verificar se é possível adicionar um novo morador**
- [ ] **Step 3: Verificar se é possível desativar um morador e se ele some do Dashboard**
- [ ] **Step 4: Verificar se o Wizard usa os moradores atualizados**
