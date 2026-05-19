<script setup lang="ts">
import { ref, onMounted } from 'vue'
import NovoLancamentoWizard from './components/ledger/NovoLancamentoWizard.vue'
import DashboardSaldos from './components/ledger/DashboardSaldos.vue'
import ConfiguracoesMembros from './components/ledger/ConfiguracoesMembros.vue'
import BottomSheet from './components/ui/BottomSheet.vue'
import { Plus } from 'lucide-vue-next'
import { useMembros } from './modules/ledger/composables/useMembros'
import { useCartoesEFaturas } from './modules/ledger/composables/useCartoesEFaturas'
import { useStorageSync } from './modules/ledger/composables/useStorageSync'
import { useBottomSheetState } from './composables/useBottomSheetState'
import BottomTabBar, { type Tab } from './components/ui/BottomTabBar.vue'

const currentView = ref<'dashboard' | 'wizard' | 'settings'>('dashboard')
const activeTab = ref<Tab>('hoje')
const { isAnyBottomSheetOpen } = useBottomSheetState()
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
const isPeriodLocked = ref(false)
</script>

<template>
  <div class="min-h-screen bg-canvas text-graphite font-sans selection:bg-ember/20">
    <div class="max-w-[1200px] mx-auto px-4 md:px-6 pt-2 md:pt-4 pb-36 md:pb-16 relative">
      <!-- Main Content -->
      <main class="relative z-10">
        <DashboardSaldos 
          :membros="todosMembros"
          :faturasAbertas="faturasAbertas"
          :faturasFechadas="faturasFechadas"
          :acertosPendentes="acertos"
          :cartoes="cartoes"
          :calcular-consumo="calcularConsumoMembro"
          :calcular-adiantamento="calcularAdiantamentoMembro"
          :active-tab="activeTab"
          @quitarAcerto="quitarAcertoMembro"
          @fecharFatura="fecharFaturaManual"
          @reabrirFatura="reabrirFaturaManual"
          @openSettings="currentView = 'settings'"
          @periodoStatusChanged="(locked) => isPeriodLocked = locked"
        />
      </main>
    </div>



    <!-- Floating Action Button (FAB) -->
    <Transition name="fab-zoom">
      <button
        v-if="currentView === 'dashboard' && !isAnyBottomSheetOpen"
        :disabled="isPeriodLocked"
        class="fixed bottom-6 left-0 right-0 mx-auto w-14 h-14 rounded-full shadow-xl z-[100] active:scale-95 flex items-center justify-center transition-all duration-300 bg-gradient-to-br from-zinc-800 to-black hover:from-zinc-700 hover:to-zinc-950 text-white border border-zinc-700/50 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed disabled:from-zinc-900 disabled:to-zinc-950 disabled:text-zinc-600 disabled:border-zinc-850 disabled:scale-100 disabled:shadow-none"
        @click="currentView = 'wizard'"
        data-testid="novo-lancamento-fab"
      >
        <Plus class="w-7 h-7 stroke-[3px]" />
      </button>
    </Transition>

    <!-- BottomSheet do Wizard de Novo Lançamento -->
    <BottomSheet 
      :model-value="currentView === 'wizard'"
      @update:model-value="(val) => { if (!val) currentView = 'dashboard' }"
      width-class="md:w-[560px]"
      max-height="95dvh"
    >
      <NovoLancamentoWizard 
        v-if="currentView === 'wizard'"
        :membros="ativos"
        @salvar="handleSalvarTransacao"
        @cancelar="currentView = 'dashboard'"
      />
    </BottomSheet>

    <!-- BottomSheet de Configurações -->
    <BottomSheet 
      :model-value="currentView === 'settings'"
      @update:model-value="(val) => { if (!val) currentView = 'dashboard' }"
      width-class="md:w-[560px]"
      max-height="90dvh"
    >
      <div class="flex-grow overflow-y-auto custom-scrollbar p-6 sm:p-8">
        <ConfiguracoesMembros />
      </div>
    </BottomSheet>

    <BottomTabBar v-model="activeTab" />
  </div>
</template>

<style>
/* Smooth transitions between views */
.v-enter-active,
.v-leave-active {
  transition: opacity 0.5s ease;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
}

/* Zoom effect for FAB */
.fab-zoom-enter-active,
.fab-zoom-leave-active {
  transition: transform 0.25s ease-out, opacity 0.2s ease;
  transform-origin: center center;
}

.fab-zoom-enter-from,
.fab-zoom-leave-to {
  opacity: 0;
  transform: scale(0.8);
}
</style>
