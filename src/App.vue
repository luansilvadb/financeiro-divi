<script setup lang="ts">
import { ref, onMounted } from 'vue'
import NovoLancamentoWizard from './views/screens/NovoLancamentoWizard.vue'
import DashboardSaldos from './views/screens/DashboardSaldos.vue'
import ConfiguracoesMembros from './views/screens/ConfiguracoesMembros.vue'
import BottomSheet from './views/components/ui/BottomSheet.vue'
import LoginScreen from './views/screens/LoginScreen.vue'
import { Plus } from 'lucide-vue-next'
import { useMembros } from './viewmodels/useMembros'
import { useCartoesEFaturas } from './viewmodels/useCartoesEFaturas'
import { useContasFixas } from './viewmodels/useContasFixas'
import { useStorageSync } from './viewmodels/useStorageSync'
import { useBottomSheetState } from './viewmodels/useBottomSheetState'
import BottomTabBar, { type Tab } from './views/components/ui/BottomTabBar.vue'
import { tenantSessionService, migrationService } from './shared/container'
import { supabase } from './shared/supabase'

const currentView = ref<'dashboard' | 'wizard' | 'settings'>('dashboard')
const activeTab = ref<Tab>('hoje')
const { isAnyBottomSheetOpen } = useBottomSheetState()
const { ativos, membros: todosMembros, inicializar: inicializarMembros } = useMembros()
const {
  cartoes,
  acertos,
  inicializar: inicializarCartoes,
  faturasAbertas,
  faturasFechadas,
  calcularConsumoMembro
} = useCartoesEFaturas()
const { carregarTemplates: inicializarContasFixas } = useContasFixas()

useStorageSync()

const isAuthed = ref(tenantSessionService.isAuthenticated())

const validarESincronizarTenantAtivo = async () => {
  if (!tenantSessionService.isAuthenticated()) return
  const userId = tenantSessionService.getCurrentUserId()
  if (!userId) return
  try {
    const { data: members, error: mError } = await supabase
      .from('membros_casa')
      .select('tenant_id')
      .eq('user_id', userId)

    if (mError || !members) return

    const tenantIds = members.map(m => m.tenant_id)
    const activeTenantId = tenantSessionService.getActiveTenantId()

    if (tenantIds.length === 0) {
      if (activeTenantId) {
        tenantSessionService.setActiveTenant('')
      }
      return
    }

    if (!activeTenantId || !tenantIds.includes(activeTenantId)) {
      tenantSessionService.setActiveTenant(tenantIds[0])
    }
  } catch (err) {
    console.error('Erro ao validar tenant ativo:', err)
  }
}

onMounted(async () => {
  if (isAuthed.value) {
    await validarESincronizarTenantAtivo()
    await Promise.all([
      inicializarMembros(),
      inicializarCartoes(),
      inicializarContasFixas()
    ])
  }
})

const handleSalvarTransacao = async () => {
  await inicializarCartoes()
  currentView.value = 'dashboard'
}
const isPeriodLocked = ref(false)

const handleAuthSuccess = async () => {
  isAuthed.value = true
  
  await validarESincronizarTenantAtivo()
  
  const jaMigrado = localStorage.getItem('divi_migrado_saas') === 'true'
  const activeTenantId = tenantSessionService.getActiveTenantId()
  const userId = tenantSessionService.getCurrentUserId()

  if (!jaMigrado && userId) {
    const temDadosLocais = localStorage.getItem('divi_gastos_cartao') || localStorage.getItem('divi_faturas')
    if (temDadosLocais) {
      try {
        let tenantId = activeTenantId
        if (!tenantId) {
          tenantId = crypto.randomUUID()
          const code = `CASA-${Math.random().toString(36).substring(2, 7).toUpperCase()}`
          
          // Cria o tenant
          await supabase.from('tenants').insert({
            id: tenantId,
            name: 'Minha Casa Importada',
            invite_code: code
          })

          // Associa o membro fundador
          await supabase.from('membros_casa').insert({
            id: userId,
            tenant_id: tenantId,
            nome: localStorage.getItem('divi_username') || 'Morador',
            avatar: (localStorage.getItem('divi_username') || 'M').substring(0, 2).toUpperCase(),
            user_id: userId
          })
          
          tenantSessionService.setActiveTenant(tenantId)
        }

        // Executa a migração
        await migrationService.migrar(tenantId, userId)
        console.log('Dados migrados localmente para o Supabase com sucesso!')
      } catch (err) {
        console.error('Falha ao migrar dados locais:', err)
      }
    }
  }

  // Inicializa os dados com as fontes online
  await Promise.all([
    inicializarMembros(),
    inicializarCartoes(),
    inicializarContasFixas()
  ])
}
</script>

<template>
  <div v-if="!isAuthed">
    <LoginScreen @auth-success="handleAuthSuccess" />
  </div>
  <div v-else class="min-h-screen bg-canvas text-graphite font-sans selection:bg-ember/20">
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
          :active-tab="activeTab"
          @openSettings="currentView = 'settings'"
          @periodoStatusChanged="(locked) => isPeriodLocked = locked"
        />
      </main>
    </div>

    <!-- Floating Action Button (FAB) -->
    <Transition name="fab-zoom">
      <div 
        v-if="currentView === 'dashboard' && !isAnyBottomSheetOpen"
        class="fixed bottom-6 left-0 right-0 z-[100] flex justify-center pointer-events-none"
        data-fixed-wrapper
      >
        <button
          :disabled="isPeriodLocked"
          class="w-14 h-14 rounded-full shadow-lg active:scale-95 flex items-center justify-center transition-all duration-300 bg-midnight hover:bg-charcoal text-white border-none focus:outline-none disabled:opacity-40 disabled:scale-100 disabled:shadow-none pointer-events-auto"
          @click="currentView = 'wizard'"
          data-testid="novo-lancamento-fab"
        >
          <Plus class="w-7 h-7 stroke-[3px]" />
        </button>
      </div>
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
  transition: opacity 0.5s var(--ease-spring);
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
}

/* Zoom effect for FAB */
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
