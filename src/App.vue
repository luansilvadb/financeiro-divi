<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import NovoLancamentoWizard from './views/screens/NovoLancamentoWizard.vue'
import DashboardSaldos from './views/screens/DashboardSaldos.vue'
import ConfiguracoesMembros from './views/screens/ConfiguracoesMembros.vue'
import BottomSheet from './views/components/ui/BottomSheet.vue'
import LoginScreen from './views/screens/LoginScreen.vue'
import ForgotPasswordScreen from './views/screens/ForgotPasswordScreen.vue'
import ResetPasswordScreen from './views/screens/ResetPasswordScreen.vue'
import TenantSelectorScreen from './views/screens/TenantSelectorScreen.vue'
import TenantSwitcherModal from './views/components/ui/TenantSwitcherModal.vue'
import { useMembros } from './viewmodels/useMembros'
import { useCartoesEFaturas } from './viewmodels/useCartoesEFaturas'
import { useContasFixas } from './viewmodels/useContasFixas'
import BottomTabBar, { type Tab } from './views/components/ui/BottomTabBar.vue'
import { tenantSessionService, socketService } from './shared/container'
import ToastNotification from './views/components/ui/ToastNotification.vue'
import { useToast } from './composables/useToast'
import IllustrationMascot from './views/components/ui/IllustrationMascot.vue'
import { mensagemErro } from './shared/utils/mensagemErro'

const isInitializing = ref(true)
const isLoading = ref(tenantSessionService.isAuthenticated())
const currentView = ref<'dashboard' | 'wizard' | 'settings' | 'tenantSwitcher'>('dashboard')
const showForgot = ref(false)
const resetToken = ref<string | null>(null)
const activeTab = ref<Tab>('hoje')
const { ativos, membros: todosMembros, carregar: recarregarMembros } = useMembros()
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

const assegurarDadosIniciais = async () => {
  const tenantId = tenantSessionService.getActiveTenantId()
  if (!tenantId) return

  isLoading.value = true
  try {
    socketService.desconectar()
    await Promise.all([
      recarregarMembros(),
      inicializarCartoes(),
      inicializarContasFixas()
    ])
    inicializarSocket(tenantId)
  } catch (error: unknown) {
    console.error('Erro na inicialização de dados:', error)
  } finally {
    isLoading.value = false
  }
}

const handlePeriodoStatusChanged = (fechado: boolean) => {
  isMonthClosed.value = fechado
}

const handleTabChange = (tab: Tab) => {
  if (tab === 'casas') {
    currentView.value = 'tenantSwitcher'
  } else if (tab === 'perfil') {
    currentView.value = 'settings'
  } else {
    activeTab.value = tab
  }
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
  
  const params = new URLSearchParams(window.location.search)
  const token = params.get('token')
  if (token && window.location.pathname.includes('/reset-password')) {
    resetToken.value = token
    // Prevenir auto-login se estiver no fluxo de reset
    isAuthed.value = false
    isInitializing.value = false
    isLoading.value = false
    return
  }

  if (isAuthed.value) {
    try {
      isLoading.value = true
      await tenantSessionService.inicializarSessao()
      isAuthed.value = tenantSessionService.isAuthenticated()
      if (!isAuthed.value) return
      hasTenant.value = !!tenantSessionService.getActiveTenantId()
      if (hasTenant.value) {
        await assegurarDadosIniciais()
      }
    } catch (error: unknown) {
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
  } catch (error: unknown) {
    console.error('Erro ao recarregar cartões após salvar transação:', error)
    toast.show(mensagemErro(error, 'Erro ao sincronizar dados com o servidor'), 'error')
  }
}

const handleResetSuccess = () => {
  resetToken.value = null
  toast.show('Senha redefinida com sucesso. Faça login com a nova senha.', 'success')
}

const handleAuthSuccess = async () => {
  isAuthed.value = true
  hasTenant.value = !!tenantSessionService.getActiveTenantId()
  if (hasTenant.value) {
    await assegurarDadosIniciais()
  }
}

const handleCasaSelecionada = async () => {
  hasTenant.value = true
  await assegurarDadosIniciais()
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
      <div v-if="isInitializing" class="min-h-screen bg-canvas flex flex-col items-center justify-center p-8 space-y-12 animate-in fade-in duration-200">
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
          <ResetPasswordScreen 
            v-if="resetToken" 
            :token="resetToken" 
            @reset-success="handleResetSuccess" 
          />
          <ForgotPasswordScreen 
            v-else-if="showForgot" 
            @back="showForgot = false" 
          />
          <LoginScreen 
            v-else 
            @auth-success="handleAuthSuccess" 
            @forgot-password="showForgot = true" 
          />
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
          <div class="max-w-[75rem] mx-auto px-4 md:px-6 pt-2 md:pt-4 pb-20 md:pb-24 relative">
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

          <BottomSheet
            :model-value="currentView === 'tenantSwitcher'"
            @update:model-value="(val) => { if (!val) currentView = 'dashboard' }"
            width-class="md:w-[440px]"
            max-height="85dvh"
            content-class="p-0 h-full"
          >
            <TenantSwitcherModal
              v-if="currentView === 'tenantSwitcher'"
              @casa-selecionada="currentView = 'dashboard'; handleCasaSelecionada()"
            />
          </BottomSheet>

          <BottomTabBar 
            :model-value="activeTab" 
            :is-month-closed="isMonthClosed"
            @update:model-value="handleTabChange" 
            @click-fab="handleFabClick"
          />
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
  transition: transform 0.18s ease-out, opacity 0.15s ease-out;
  transform-origin: center center;
}

.fab-zoom-enter-from,
.fab-zoom-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(4px);
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
