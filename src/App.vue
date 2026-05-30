<script setup lang="ts">
import { ref, onMounted } from 'vue'
import NovoLancamentoWizard from './views/screens/NovoLancamentoWizard.vue'
import DashboardSaldos from './views/screens/DashboardSaldos.vue'
import ConfiguracoesMembros from './views/screens/ConfiguracoesMembros.vue'
import BottomSheet from './views/components/ui/BottomSheet.vue'
import LoginScreen from './views/screens/LoginScreen.vue'
import TenantSelectorScreen from './views/screens/TenantSelectorScreen.vue'
import { Plus } from 'lucide-vue-next'
import { useMembros } from './viewmodels/useMembros'
import { useCartoesEFaturas } from './viewmodels/useCartoesEFaturas'
import { useContasFixas } from './viewmodels/useContasFixas'
import { useBottomSheetState } from './viewmodels/useBottomSheetState'
import BottomTabBar, { type Tab } from './views/components/ui/BottomTabBar.vue'
import { tenantSessionService, socketService } from './shared/container'
import ToastNotification from './views/components/ui/ToastNotification.vue'
import { useToast } from './composables/useToast'

const currentView = ref<'dashboard' | 'wizard' | 'settings'>('dashboard')
const activeTab = ref<Tab>('hoje')
const { isAnyBottomSheetOpen } = useBottomSheetState()
const { ativos, membros: todosMembros, inicializar: inicializarMembros, carregar: recarregarMembros } = useMembros()
const {
  cartoes,
  inicializar: inicializarCartoes,
  faturasAbertas,
  faturasFechadas
} = useCartoesEFaturas()
const { carregarTemplates: inicializarContasFixas } = useContasFixas()

const isAuthed = ref(tenantSessionService.isAuthenticated())
const hasTenant = ref(!!tenantSessionService.getActiveTenantId())
const isMonthClosed = ref(false)
const toast = useToast()

const handlePeriodoStatusChanged = (fechado: boolean) => {
  isMonthClosed.value = fechado
}

const handleFabClick = () => {
  if (isMonthClosed.value) {
    toast.show('Este mês está encerrado. Reabra o período para fazer novos lançamentos.', 'error')
    return
  }
  currentView.value = 'wizard'
}

const inicializarSocket = (tenantId: string) => {
  socketService.conectar(tenantId)

  let debounceTimerDados: ReturnType<typeof setTimeout> | null = null
  const recarregarDadosDebounced = () => {
    if (debounceTimerDados) clearTimeout(debounceTimerDados)
    debounceTimerDados = setTimeout(async () => {
      await inicializarCartoes()
    }, 300)
  }

  socketService.on('gastos_alterados', recarregarDadosDebounced)
  socketService.on('cartoes_alterados', recarregarDadosDebounced)
  socketService.on('faturas_alteradas', recarregarDadosDebounced)
  socketService.on('membros_alterados', async () => await recarregarMembros())
  socketService.on('contas_fixas_alteradas', async () => await inicializarContasFixas())
}


onMounted(async () => {
  if (isAuthed.value) {
    try {
      await tenantSessionService.inicializarSessao()
      hasTenant.value = !!tenantSessionService.getActiveTenantId()
      if (hasTenant.value) {
        await Promise.all([
          inicializarMembros(),
          inicializarCartoes(),
          inicializarContasFixas()
        ])
        inicializarSocket(tenantSessionService.getActiveTenantId()!)
      }
    } catch (error: any) {
      console.error('Erro na inicialização da sessão:', error)
    }
  }
})

const handleSalvarTransacao = async () => {
  try {
    await inicializarCartoes()
    currentView.value = 'dashboard'
  } catch (error: any) {
    console.error('Erro ao recarregar cartões após salvar transação:', error)
    toast.show(error.message || 'Erro ao sincronizar dados com o servidor', 'error')
    currentView.value = 'dashboard'
  }
}
const handleAuthSuccess = async () => {
  isAuthed.value = true
  hasTenant.value = !!tenantSessionService.getActiveTenantId()
  if (hasTenant.value) {
    try {
      await Promise.all([
        recarregarMembros(),
        inicializarCartoes(),
        inicializarContasFixas()
      ])
      inicializarSocket(tenantSessionService.getActiveTenantId()!)
    } catch (error: any) {
      console.error('Erro na inicialização pós-auth:', error)
    }
  }
}

const handleCasaSelecionada = async () => {
  hasTenant.value = true
  try {
    await Promise.all([
      recarregarMembros(),
      inicializarCartoes(),
      inicializarContasFixas()
    ])
    inicializarSocket(tenantSessionService.getActiveTenantId()!)
  } catch (error: any) {
    console.error('Erro ao inicializar dados da nova casa:', error)
  }
}

const handleLogout = async () => {
  socketService.desconectar()
  await tenantSessionService.logout()
  isAuthed.value = false
  hasTenant.value = false
}
</script>

<template>
  <!-- Não autenticado -->
  <div v-if="!isAuthed">
    <LoginScreen @auth-success="handleAuthSuccess" />
  </div>
  <!-- Autenticado mas sem casa -->
  <div v-else-if="!hasTenant">
    <TenantSelectorScreen
      @casa-selecionada="handleCasaSelecionada"
      @logout="handleLogout"
    />
  </div>
  <!-- Dashboard normal -->
  <div v-else class="min-h-screen bg-canvas text-graphite font-sans selection:bg-ember/20">
    <ToastNotification />
    <div class="max-w-[1200px] mx-auto px-4 md:px-6 pt-2 md:pt-4 pb-36 md:pb-16 relative">
      <main class="relative z-10">
        <DashboardSaldos 
          :membros="todosMembros"
          :faturasAbertas="faturasAbertas"
          :faturasFechadas="faturasFechadas"
          :cartoes="cartoes"
          
          :active-tab="activeTab"
          @openSettings="currentView = 'settings'"
          @periodoStatusChanged="handlePeriodoStatusChanged"
        />
      </main>
    </div>

    <Transition name="fab-zoom">
      <div 
        v-if="currentView === 'dashboard' && !isAnyBottomSheetOpen"
        class="fixed bottom-6 left-0 right-0 z-[100] flex justify-center pointer-events-none"
        data-fixed-wrapper
      >
        <button
          class="w-14 h-14 rounded-full shadow-lg active:scale-95 flex items-center justify-center transition-all duration-300 bg-midnight hover:bg-charcoal text-white border-none focus:outline-none pointer-events-auto"
          :class="isMonthClosed ? 'opacity-50 grayscale cursor-not-allowed' : ''"
          @click="handleFabClick"
          data-testid="novo-lancamento-fab"
        >
          <Plus class="w-7 h-7 stroke-[3px]" />
        </button>
      </div>
    </Transition>

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

    <BottomSheet 
      :model-value="currentView === 'settings'"
      @update:model-value="(val) => { if (!val) currentView = 'dashboard' }"
      width-class="md:w-[560px]"
      max-height="90dvh"
    >
      <ConfiguracoesMembros @voltar="currentView = 'dashboard'" />
    </BottomSheet>

    <BottomTabBar v-model="activeTab" />
  </div>
</template>

<style>
.v-enter-active,
.v-leave-active {
  transition: opacity 0.5s var(--ease-spring);
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
}

.fab-zoom-enter-active,
.fab-zoom-leave-active {
  transition: transform 0.4s var(--ease-spring), opacity 0.3s var(--ease-spring);
  transform-origin: center center;
}

.fab-zoom-enter-from,
.fab-zoom-leave-to {
  opacity: 0;
  transform: scale(0.8);
}
</style>
