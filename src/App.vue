<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
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
import IllustrationMascot from './views/components/ui/IllustrationMascot.vue'

const isInitializing = ref(true)
const isLoading = ref(tenantSessionService.isAuthenticated())
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
  window.addEventListener('divi:tenant-changed', handleCasaSelecionada)
  
  if (isAuthed.value) {
    try {
      // Começamos com isLoading true para o skeleton estar pronto quando o splash sair
      isLoading.value = true
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
    } finally {
      isInitializing.value = false
      isLoading.value = false
    }
  } else {
    isInitializing.value = false
  }
})

onUnmounted(() => {
  window.removeEventListener('divi:tenant-changed', handleCasaSelecionada)
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
    isLoading.value = true
    try {
      await Promise.all([
        recarregarMembros(),
        inicializarCartoes(),
        inicializarContasFixas()
      ])
      inicializarSocket(tenantSessionService.getActiveTenantId()!)
    } catch (error: any) {
      console.error('Erro na inicialização pós-auth:', error)
    } finally {
      isLoading.value = false
    }
  }
}

const handleCasaSelecionada = async () => {
  hasTenant.value = true
  
  // Evita o "flashbang" do skeleton se a API responder rápido demais (< 150ms)
  const skeletonTimer = setTimeout(() => {
    isLoading.value = true
  }, 150)

  try {
    socketService.desconectar()
    await Promise.all([
      recarregarMembros(),
      inicializarCartoes(),
      inicializarContasFixas()
    ])
    inicializarSocket(tenantSessionService.getActiveTenantId()!)
  } catch (error: any) {
    console.error('Erro ao inicializar dados da nova casa:', error)
  } finally {
    clearTimeout(skeletonTimer)
    isLoading.value = false
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
  <div class="divi-app-root">
    <!-- Splash / Initializing -->
    <Transition name="fade" mode="out-in">
      <div v-if="isInitializing" class="min-h-screen bg-canvas flex flex-col items-center justify-center p-8 space-y-12 animate-in fade-in duration-700">
        <div class="flex flex-col items-center space-y-4">
          <IllustrationMascot variant="ember" :size="80" mood="happy" class="animate-wobble" />
          <h1 class="text-display text-5xl md:text-6xl text-charcoal">
            DIVI<span class="text-ember">.</span>
          </h1>
        </div>
        <div class="w-full max-w-[200px] space-y-4 opacity-40">
          <div class="h-1 bg-stone rounded-full overflow-hidden">
            <div class="h-full bg-ember/40 animate-loading-bar" />
          </div>
          <p class="text-[10px] font-bold text-ash uppercase tracking-[0.25em] text-center">Iniciando aventura</p>
        </div>
      </div>

      <!-- Main Flow -->
      <div v-else class="min-h-screen bg-canvas">
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
          <div class="max-w-[75rem] mx-auto px-4 md:px-6 pt-2 md:pt-4 pb-36 md:pb-16 relative">
            <main class="relative z-10">
              <DashboardSaldos
                :membros="todosMembros"
                :faturasAbertas="faturasAbertas"
                :faturasFechadas="faturasFechadas"
                :cartoes="cartoes"
                :is-loading="isLoading"
                :active-tab="activeTab"
                @openSettings="currentView = 'settings'"
                @periodoStatusChanged="handlePeriodoStatusChanged"
              />
            </main>
          </div>

          <Transition name="fab-zoom">
            <div
              v-if="currentView === 'dashboard' && !isAnyBottomSheetOpen"
              class="fixed bottom-8 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none"
            >
              <button
                class="w-16 h-16 rounded-full shadow-[0_12px_40px_rgba(255,62,0,0.5)] active:scale-90 flex items-center justify-center transition-all duration-500 ease-spring bg-ember hover:bg-ember/90 text-white border-none focus:outline-none pointer-events-auto cursor-pointer group fab-stable"
                :class="isMonthClosed ? 'opacity-50 grayscale cursor-not-allowed' : ''"
                @click="handleFabClick"
                aria-label="Novo lançamento"
                data-testid="novo-lancamento-fab"
              >
                <Plus class="w-9 h-9 stroke-[3.5px] group-hover:rotate-90 transition-transform duration-500 ease-spring" />
              </button>
            </div>
          </Transition>

          <BottomSheet
            :model-value="currentView === 'wizard'"
            @update:model-value="(val) => { if (!val) currentView = 'dashboard' }"
            width-class="md:w-[560px]"
            max-height="95dvh"
            content-class="p-0 h-full"
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
            content-class="p-0 h-full"
          >
            <ConfiguracoesMembros 
              @voltar="currentView = 'dashboard'" 
              @logout="handleLogout"
            />
          </BottomSheet>

          <BottomTabBar v-model="activeTab" />
        </div>
      </div>
    </Transition>
  </div>
</template>


<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease-out;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fab-zoom-enter-active,
.fab-zoom-leave-active {
  transition: transform 0.3s var(--ease-spring), opacity 0.2s ease-out;
  transform-origin: center center;
}

.fab-zoom-enter-from,
.fab-zoom-leave-to {
  opacity: 0;
  transform: scale(0.8) translateY(10px);
}

@keyframes loading-bar {
  0% { transform: translateX(-100%); }
  50% { transform: translateX(0); }
  100% { transform: translateX(100%); }
}

.animate-loading-bar {
  animation: loading-bar 2s ease-in-out infinite;
}
</style>
