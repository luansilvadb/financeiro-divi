<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import NovoLancamentoWizard from './components/ledger/NovoLancamentoWizard.vue'
import DashboardSaldos from './components/ledger/DashboardSaldos.vue'
import ActivityFeed from './components/ledger/ActivityFeed.vue'
import { Plus, X } from 'lucide-vue-next'
import { LocalStorageTransacaoRepository } from './modules/ledger/adapters/LocalStorageTransacaoRepository'
import { CalculadoraSaldos } from './modules/ledger/core/services/CalculadoraSaldos'
import { Transacao } from './modules/ledger/core/domain/Transacao'

const currentView = ref<'dashboard' | 'wizard'>('dashboard')
const repository = new LocalStorageTransacaoRepository()
const transacoes = ref<Transacao[]>([])

const membros = [
  { id: 'luan', nome: 'Luan' },
  { id: 'maria', nome: 'Maria' },
  { id: 'joao', nome: 'João' },
  { id: 'paula', nome: 'Paula' }
]

const carregarTransacoes = async () => {
  transacoes.value = await repository.listarTodas()
}

const saldos = computed(() => {
  return CalculadoraSaldos.calcular(transacoes.value)
})

onMounted(async () => {
  await carregarTransacoes()
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
      
      <button 
        v-if="currentView === 'wizard'"
        @click="currentView = 'dashboard'"
        class="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200/50 rounded-full transition-all"
        aria-label="Cancelar lançamento"
      >
        <X class="w-6 h-6" />
      </button>
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
    </main>

    <footer class="max-w-md mx-auto mt-12 text-center text-gray-400 text-xs">
      &copy; 2026 DIVI - Máquina da Verdade
    </footer>

    <!-- Floating Action Button (FAB) -->
    <button 
      v-if="currentView === 'dashboard'"
      @click="currentView = 'wizard'"
      class="fixed bottom-10 right-6 w-16 h-16 bg-blue-900 text-white rounded-full flex items-center justify-center shadow-2xl border-4 border-white ring-4 ring-blue-900/5 hover:bg-blue-800 active:scale-90 transition-all z-[9999]"
      aria-label="Novo lançamento"
    >
      <Plus class="w-10 h-10 stroke-[3px]" />
    </button>
  </div>
</template>
