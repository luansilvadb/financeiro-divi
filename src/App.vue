<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import NovoLancamentoWizard from './components/ledger/NovoLancamentoWizard.vue'
import DashboardSaldos from './components/ledger/DashboardSaldos.vue'
import { LocalStorageTransacaoRepository } from './modules/ledger/adapters/LocalStorageTransacaoRepository'
import { CalculadoraSaldos } from './modules/ledger/core/services/CalculadoraSaldos'
import type { Transacao } from './modules/ledger/core/domain/Transacao'
import type { Dinheiro } from './shared/primitives/Dinheiro'

const currentView = ref<'dashboard' | 'wizard'>('dashboard')
const repository = new LocalStorageTransacaoRepository()
const transacoes = ref<Transacao[]>([])

const membros = [
  { id: 'eu', nome: 'Eu' },
  { id: 'colega_x', nome: 'Colega X' },
  { id: 'colega_y', nome: 'Colega Y' }
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
      <DashboardSaldos 
        v-if="currentView === 'dashboard'" 
        :saldos="saldos" 
        :membros="membros"
        @novo-lancamento="currentView = 'wizard'"
      />
      
      <NovoLancamentoWizard 
        v-else-if="currentView === 'wizard'"
        @salvar="handleSalvarTransacao"
        @cancelar="currentView = 'dashboard'"
      />
    </main>

    <footer class="max-w-md mx-auto mt-12 text-center text-gray-400 text-xs">
      &copy; 2026 DIVI - Máquina da Verdade
    </footer>
  </div>
</template>
