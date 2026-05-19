<script setup lang="ts">
import { ref, onMounted } from 'vue'
import NovoLancamentoWizard from './components/ledger/NovoLancamentoWizard.vue'
import DashboardSaldos from './components/ledger/DashboardSaldos.vue'
import ConfiguracoesMembros from './components/ledger/ConfiguracoesMembros.vue'
import Button from './components/ui/Button.vue'
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
</script>

<template>
  <div class="min-h-screen bg-canvas text-graphite font-sans selection:bg-ember/20">
    <div class="max-w-[1200px] mx-auto px-4 md:px-6 py-8 md:py-16 pb-36 md:pb-16 relative">
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
        />
      </main>
    </div>



    <!-- Floating Action Button (FAB) -->
    <Button
      v-if="currentView === 'dashboard' && !isAnyBottomSheetOpen"
      variant="primary"
      class="fixed bottom-6 left-1/2 -translate-x-1/2 w-14 h-14 p-0 rounded-full shadow-lg z-[100] active:scale-95 border-4 border-card"
      @click="currentView = 'wizard'"
      data-testid="novo-lancamento-fab"
    >
      <Plus class="w-7 h-7 stroke-[3px]" />
    </Button>

    <!-- Bottomsheet Não Modal do Wizard de Novo Lançamento -->
    <BottomSheet 
      :model-value="currentView === 'wizard'"
      @update:model-value="(val) => { if (!val) currentView = 'dashboard' }"
      width-class="md:w-[560px]"
    >
      <div class="flex-grow overflow-y-auto custom-scrollbar flex flex-col">
        <NovoLancamentoWizard 
          :membros="ativos"
          @salvar="handleSalvarTransacao"
          @cancelar="currentView = 'dashboard'"
        />
      </div>
    </BottomSheet>

    <!-- Bottomsheet Não Modal de Configurações -->
    <BottomSheet 
      :model-value="currentView === 'settings'"
      @update:model-value="(val) => { if (!val) currentView = 'dashboard' }"
      width-class="md:w-[560px]"
    >
      <div class="flex-grow overflow-y-auto custom-scrollbar flex flex-col p-6">
        <ConfiguracoesMembros />
      </div>
    </BottomSheet>

    <BottomTabBar v-if="!isAnyBottomSheetOpen" v-model="activeTab" />
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
</style>
