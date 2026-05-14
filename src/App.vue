<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import NovoLancamentoWizard from './components/ledger/NovoLancamentoWizard.vue'
import DashboardSaldos from './components/ledger/DashboardSaldos.vue'
import ActivityFeed from './components/ledger/ActivityFeed.vue'
import { LocalStorageTransacaoRepository } from './modules/ledger/adapters/LocalStorageTransacaoRepository'
import { CalculadoraSaldos } from './modules/ledger/core/services/CalculadoraSaldos'
import { Transacao } from './modules/ledger/core/domain/Transacao'

const currentView = ref<'dashboard' | 'wizard'>('dashboard')
const repository = new LocalStorageTransacaoRepository()
const transacoes = ref<Transacao[]>([])

const membros = [
  { id: 'eu', nome: 'Luan (Você)' },
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
  <div class="min-h-screen bg-gray-100 py-10 px-4">
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
  </div>
</template>
