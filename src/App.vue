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
  // Simulação de fechamento no ambiente web
  window.close();
  // Fallback se window.close() for bloqueado
  alert('Comando de fechar recebido. No navegador, você pode fechar esta aba.');
}
</script>

<template>
  <div class="min-h-screen bg-transparent flex items-center justify-center p-4">
    <!-- Moldura de Janela do Windows 11 (Companion Shell) -->
    <div class="w-full max-w-[430px] h-[860px] bg-[#E8F0F8]/55 border border-black/10 rounded-f-lg shadow-2xl flex flex-col overflow-hidden relative backdrop-blur-3xl">
      
      <!-- Barra de Título Nativa do Windows 11 -->
      <div class="h-10 bg-white/40 border-b border-black/5 flex justify-between items-center px-4 select-none shrink-0">
        <div class="flex items-center gap-2">
          <!-- Ícone do App DIVI -->
          <span class="text-xs">⚡</span>
          <span class="text-[11px] font-semibold text-fluent-text-p2 uppercase tracking-wider">DIVI • Companion App</span>
        </div>
        <!-- Botões de Controle Clássicos -->
        <div class="flex items-center gap-4 text-fluent-text-p3">
          <span class="w-3 h-3 hover:text-fluent-text-p1 cursor-pointer flex items-center justify-center text-[10px]">─</span>
          <span class="w-3 h-3 hover:text-fluent-text-p1 cursor-pointer flex items-center justify-center text-[9px]">🗖</span>
          <span @click="closeApp" class="w-3 h-3 hover:text-red-600 cursor-pointer flex items-center justify-center text-[11px]">✕</span>
        </div>
      </div>

      <!-- Área Útil do App -->
      <div class="flex-1 overflow-y-auto px-5 py-6 pb-28 relative">
        <header class="text-center mb-6 pt-2">
          <!-- Fluent Badge -->
          <div class="inline-flex items-center gap-1.5 bg-fluent-tint-blue border border-fluent-accent/15 text-fluent-accent text-[10px] font-semibold tracking-wider uppercase py-1 px-2.5 rounded-f-sm mb-3">
            <span class="w-1.5 h-1.5 rounded-full bg-fluent-accent animate-pulse"></span>
            Fluent 2 Ecosystem
          </div>

          <h1 class="text-3xl font-bold tracking-tight text-fluent-text-p1 mb-0.5">
            DIVI
          </h1>
          <p class="text-[11px] text-fluent-text-p2 max-w-[280px] mx-auto leading-relaxed">
            Finanças residenciais com a simplicidade nativa do seu sistema.
          </p>

          <!-- Botão de Configuração (Adaptado do original) -->
          <div class="absolute right-4 top-16 flex gap-2 z-10">
            <button 
              v-if="currentView === 'dashboard'"
              @click="currentView = 'settings'"
              class="p-2 text-fluent-text-p3 hover:text-fluent-text-p1 hover:bg-white/40 rounded-full transition-all"
              aria-label="Configurações"
            >
              <Settings class="w-4 h-4" />
            </button>

            <button 
              v-if="currentView !== 'dashboard'"
              @click="currentView = 'dashboard'"
              class="p-2 text-fluent-text-p3 hover:text-fluent-text-p1 hover:bg-white/40 rounded-full transition-all"
              :aria-label="currentView === 'wizard' ? 'Cancelar lançamento' : 'Voltar'"
            >
              <X class="w-4 h-4" />
            </button>
          </div>
        </header>

        <!-- Dynamic View Router (Simulado com v-if original para manter compatibilidade) -->
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
