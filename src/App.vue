<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import NovoLancamentoWizard from './components/ledger/NovoLancamentoWizard.vue'
import DashboardSaldos from './components/ledger/DashboardSaldos.vue'
import ActivityFeed from './components/ledger/ActivityFeed.vue'
import { Plus } from 'lucide-vue-next'
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
    <header class="max-w-md mx-auto mb-8 text-center">
      <h1 class="text-3xl font-extrabold text-blue-900 tracking-tight">DIVI</h1>
      <p class="text-blue-600 font-medium">Orquestrador Financeiro</p>
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

    <!-- Floating Action Button (FAB) Moderno -->
    <button 
      v-if="currentView === 'dashboard'"
      @click="currentView = 'wizard'"
      class="fixed bottom-10 right-6 w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 text-white rounded-2xl flex items-center justify-center shadow-[0_10px_25px_-5px_rgba(37,99,235,0.4)] hover:shadow-[0_15px_30px_-5px_rgba(37,99,235,0.5)] hover:-translate-y-1 active:scale-95 transition-all duration-300 z-[9999] group"
      aria-label="Novo lançamento"
    >
      <Plus class="w-8 h-8 transition-transform duration-500 group-hover:rotate-90" />
      
      <!-- Efeito de brilho interno sutil -->
      <div class="absolute inset-0 rounded-2xl border border-white/20 pointer-events-none"></div>
    </button>
  </div>
</template>
