<script setup lang="ts">
import { ref, onMounted } from 'vue'
import NovoLancamentoWizard from './components/ledger/NovoLancamentoWizard.vue'
import DashboardSaldos from './components/ledger/DashboardSaldos.vue'
import ConfiguracoesMembros from './components/ledger/ConfiguracoesMembros.vue'
import { Plus, X, Settings } from 'lucide-vue-next'
import { useMembros } from './modules/ledger/composables/useMembros'
import { useCartoesEFaturas } from './modules/ledger/composables/useCartoesEFaturas'
import { useStorageSync } from './modules/ledger/composables/useStorageSync'

const currentView = ref<'dashboard' | 'wizard' | 'settings'>('dashboard')
const { ativos, membros: todosMembros, inicializar: inicializarMembros } = useMembros()
const {
  cartoes,
  acertos,
  inicializar: inicializarCartoes,
  fecharFaturaManual,
  reabrirFaturaManual,
  quitarAcertoMembro,
  faturasAbertas,
  faturasFechadas,
  calcularConsumoMembro,
  calcularAdiantamentoMembro
} = useCartoesEFaturas()

// Ativa o listener global de sincronização multi-aba
useStorageSync()

onMounted(async () => {
  await Promise.all([
    inicializarMembros(),
    inicializarCartoes()
  ])
})

const handleSalvarTransacao = async () => {
  await inicializarCartoes()
  currentView.value = 'dashboard'
}
</script>

<template>
  <div class="min-h-screen bg-divi-bg text-divi-t1 flex flex-col items-center overflow-x-hidden font-sans">
    <div class="w-full max-w-[430px] min-h-screen flex flex-col px-4 pt-14 pb-24 relative">
      <header class="relative text-center mb-6 pt-4">
        <!-- Badge Premium -->
        <div class="inline-flex items-center gap-1.5 bg-divi-emerald-dim border border-emerald-500/20 text-[#34D399] text-[10px] font-black tracking-widest uppercase py-1.5 px-3 rounded-full mb-3 shadow-[0_0_12px_rgba(16,185,129,0.1)]">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          💎 SÊNIOR V19 PREMIUM
        </div>

        <h1 class="text-4xl font-black tracking-tighter bg-gradient-to-br from-slate-50 to-slate-400 bg-clip-text text-transparent mb-1">
          DIVI
        </h1>
        <p class="text-xs text-divi-t2 leading-relaxed max-w-[280px] mx-auto">
          Despesas da casa divididas com inteligência e zero atrito.
        </p>
        
        <!-- Botão de Configuração e Navegação -->
        <div class="absolute right-0 top-1/2 -translate-y-1/2 flex gap-2 z-10">
          <button 
            v-if="currentView === 'dashboard'"
            @click="currentView = 'settings'"
            class="p-2 text-divi-t3 hover:text-divi-t1 hover:bg-divi-s2 rounded-full transition-all"
            aria-label="Configurações"
          >
            <Settings class="w-5 h-5" />
          </button>

          <button 
            v-if="currentView !== 'dashboard'"
            @click="currentView = 'dashboard'"
            class="p-2 text-divi-t3 hover:text-divi-t1 hover:bg-divi-s2 rounded-full transition-all"
            :aria-label="currentView === 'wizard' ? 'Cancelar lançamento' : 'Voltar'"
          >
            <X class="w-5 h-5" />
          </button>
        </div>
      </header>

      <main class="flex-1">
        <div v-if="currentView === 'dashboard'" class="space-y-6">
          <DashboardSaldos 
            :membros="todosMembros"
            :faturasAbertas="faturasAbertas"
            :faturasFechadas="faturasFechadas"
            :acertosPendentes="acertos"
            :cartoes="cartoes"
            :calcular-consumo="calcularConsumoMembro"
            :calcular-adiantamento="calcularAdiantamentoMembro"
            @quitarAcerto="quitarAcertoMembro"
            @fecharFatura="fecharFaturaManual"
            @reabrirFatura="reabrirFaturaManual"
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

      <footer class="max-w-md mx-auto mt-12 text-center text-divi-t4 text-xs">
        &copy; 2026 DIVI - Máquina da Verdade
      </footer>

      <!-- Botão Flutuante (FAB) Premium v19 -->
      <button 
        v-if="currentView === 'dashboard'"
        @click="currentView = 'wizard'"
        class="fixed bottom-8 right-1/2 translate-x-1/2 w-14 h-14 bg-divi-primary text-white rounded-full flex items-center justify-center shadow-[0_0_24px_rgba(99,102,241,0.55)] border border-indigo-400/30 hover:scale-105 active:scale-95 transition-all duration-300 z-[9999]"
        aria-label="Novo lançamento"
      >
        <Plus class="w-7 h-7 stroke-[3px] filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]" />
      </button>
    </div>
  </div>
</template>
