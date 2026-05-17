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

const closeApp = () => {
  console.log('Fechando o aplicativo DIVI...')
  currentView.value = 'dashboard'
}
</script>

<template>
  <div class="min-h-screen bg-transparent flex items-center justify-center p-4">
    <!-- Moldura de Janela do Windows 11 (Companion Shell) -->
    <div class="w-full max-w-[430px] h-[860px] bg-white/20 border border-black/10 rounded-f-lg shadow-2xl flex flex-col overflow-hidden relative backdrop-blur-3xl">
      
      <!-- Barra de Título Nativa do Windows 11 -->
      <div class="h-10 bg-white/40 border-b border-black/5 flex justify-between items-center px-4 select-none shrink-0 z-20">
        <div class="flex items-center gap-2">
          <!-- Ícone do App DIVI -->
          <span class="text-xs">⚡</span>
          <span class="text-[11px] font-semibold text-fluent-text-p2 uppercase tracking-wider">DIVI • Companion App</span>
        </div>
        <!-- Botões de Controle Clássicos -->
        <div class="flex items-center gap-4 text-fluent-text-p3">
          <span class="w-3 h-3 hover:text-fluent-text-p1 cursor-pointer flex items-center justify-center text-[10px]">─</span>
          <span class="w-3 h-3 hover:text-fluent-text-p1 cursor-pointer flex items-center justify-center text-[9px]">🗖</span>
          <span @click="closeApp" class="w-3 h-3 hover:text-red-600 cursor-pointer flex items-center justify-center text-[11px] transition-colors">✕</span>
        </div>
      </div>

      <!-- Área Útil do App -->
      <div class="flex-1 overflow-y-auto px-5 py-6 pb-28 relative">
        <header class="relative text-center mb-6 pt-2">
          <!-- Fluent Badge -->
          <div class="inline-flex items-center gap-1.5 bg-fluent-tint-blue border border-fluent-accent/15 text-fluent-accent text-[10px] font-semibold tracking-wider uppercase py-1 px-2.5 rounded-f-sm mb-3">
            <span class="w-1.5 h-1.5 rounded-full bg-fluent-accent animate-pulse"></span>
            Fluent 2 Ecosystem
          </div>

          <h1 class="text-3xl font-bold tracking-tight text-fluent-text-p1 mb-0.5">
            DIVI
          </h1>
          <p class="text-[11px] text-fluent-text-p2 max-w-[280px] mx-auto leading-relaxed">
            Despesas da casa divididas com inteligência e zero atrito.
          </p>
          
          <!-- Botão de Configuração e Navegação -->
          <div class="absolute right-0 top-1/2 -translate-y-1/2 flex gap-2 z-10">
            <button 
              v-if="currentView === 'dashboard'"
              @click="currentView = 'settings'"
              class="p-2 text-fluent-text-p2 hover:text-fluent-text-p1 hover:bg-black/5 rounded-full transition-all"
              aria-label="Configurações"
            >
              <Settings class="w-5 h-5" />
            </button>

            <button 
              v-if="currentView !== 'dashboard'"
              @click="currentView = 'dashboard'"
              class="p-2 text-fluent-text-p2 hover:text-fluent-text-p1 hover:bg-black/5 rounded-full transition-all"
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

        <footer class="max-w-md mx-auto mt-12 text-center text-fluent-text-p3 text-[10px]">
          &copy; 2026 DIVI - Máquina da Verdade
        </footer>
      </div>

      <!-- Botão Flutuante (FAB) Estilo Fluent 2 - Acrílico Azul -->
      <button 
        v-if="currentView === 'dashboard'"
        @click="currentView = 'wizard'"
        class="fixed bottom-6 right-6 w-12 h-12 bg-fluent-accent text-white rounded-full flex items-center justify-center shadow-lg hover:bg-fluent-accent-hover active:bg-fluent-accent-active hover:scale-105 active:scale-95 transition-all duration-200 z-[999]"
        aria-label="Novo lançamento"
      >
        <Plus class="w-6 h-6 stroke-[3px]" />
      </button>
    </div>
  </div>
</template>
