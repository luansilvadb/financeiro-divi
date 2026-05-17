<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import NovoLancamentoWizard from './components/ledger/NovoLancamentoWizard.vue'
import DashboardSaldos from './components/ledger/DashboardSaldos.vue'
import ActivityFeed from './components/ledger/ActivityFeed.vue'
import ConfiguracoesMembros from './components/ledger/ConfiguracoesMembros.vue'
import { Plus, X, Settings } from 'lucide-vue-next'
import { CalculadoraSaldos } from './modules/ledger/core/services/CalculadoraSaldos'
import { Transacao } from './modules/ledger/core/domain/Transacao'
import { useTransacoes } from './modules/ledger/composables/useTransacoes'
import { useMembros } from './modules/ledger/composables/useMembros'
import { useStorageSync } from './modules/ledger/composables/useStorageSync'

const currentView = ref<'dashboard' | 'wizard' | 'settings'>('dashboard')
const { transacoes, inicializar: inicializarTransacoes, salvar: salvarTransacao } = useTransacoes()
const { ativos, membros: todosMembros, inicializar: inicializarMembros } = useMembros()

// Ativa o listener global de sincronização multi-aba
useStorageSync()

const saldos = computed(() => {
  return CalculadoraSaldos.calcular(transacoes.value)
})

onMounted(async () => {
  await Promise.all([
    inicializarTransacoes(),
    inicializarMembros()
  ])
})

const handleSalvarTransacao = async (t: Transacao) => {
  await salvarTransacao(t)
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
          :membros="todosMembros"
          :transacoes="transacoes"
          @novo-lancamento="currentView = 'wizard'"
        />

        <ActivityFeed 
          :transacoes="transacoes"
          :membros="todosMembros"
        />
      </div>
      
      <NovoLancamentoWizard 
        v-else-if="currentView === 'wizard'"
        :membros="ativos"
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
