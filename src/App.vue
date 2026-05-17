<script setup lang="ts">
import { ref, onMounted } from 'vue'
import NovoLancamentoWizard from './components/ledger/NovoLancamentoWizard.vue'
import DashboardSaldos from './components/ledger/DashboardSaldos.vue'
import ConfiguracoesMembros from './components/ledger/ConfiguracoesMembros.vue'
import Button from './components/ui/Button.vue'
import SectionLabel from './components/ui/SectionLabel.vue'
import InvertedSection from './components/ui/InvertedSection.vue'
import BottomSheet from './components/ui/BottomSheet.vue'
import { Plus, Settings, X, ShieldCheck, Heart } from 'lucide-vue-next'
import { useMembros } from './modules/ledger/composables/useMembros'
import { useCartoesEFaturas } from './modules/ledger/composables/useCartoesEFaturas'
import { useStorageSync } from './modules/ledger/composables/useStorageSync'
import { useBottomSheetState } from './composables/useBottomSheetState'

const currentView = ref<'dashboard' | 'wizard' | 'settings'>('dashboard')
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
    <div class="max-w-[1200px] mx-auto px-4 md:px-6 py-8 md:py-16 pb-28 relative">
      <!-- Header Lúdico e Centralizado -->
      <header class="mb-8 md:mb-10 space-y-4 md:space-y-8 relative">
        <!-- Mascote Ilustrado 1: Ember Orange (Esquerda) -->
        <div class="absolute -left-20 top-2 hidden xl:block">
          <svg viewBox="0 0 100 100" class="w-16 h-16 animate-bounce" style="animation-duration: 4s;">
            <path d="M15,50 Q10,20 50,15 Q90,10 85,50 Q80,85 50,85 Q20,85 15,50 Z" fill="var(--color-ember)" />
            <circle cx="40" cy="45" r="4" fill="#000" />
            <circle cx="60" cy="45" r="4" fill="#000" />
            <path d="M45,55 Q50,60 55,55" stroke="#000" stroke-width="3" stroke-linecap="round" fill="none" />
            <line x1="35" y1="82" x2="25" y2="95" stroke="#000" stroke-width="3" stroke-linecap="round" />
            <line x1="65" y1="82" x2="75" y2="95" stroke="#000" stroke-width="3" stroke-linecap="round" />
          </svg>
        </div>

        <!-- Mascote Ilustrado 2: Sky Blue (Direita) -->
        <div class="absolute -right-24 top-6 hidden xl:block">
          <svg viewBox="0 0 100 100" class="w-20 h-20 animate-pulse" style="animation-duration: 3s;">
            <path d="M20,40 Q30,10 60,15 Q90,20 80,60 Q70,90 40,80 Q10,70 20,40 Z" fill="var(--color-sky)" />
            <circle cx="45" cy="45" r="4" fill="#000" />
            <circle cx="65" cy="45" r="4" fill="#000" />
            <path d="M50,58 Q55,62 60,58" stroke="#000" stroke-width="3" stroke-linecap="round" fill="none" />
            <line x1="38" y1="80" x2="28" y2="95" stroke="#000" stroke-width="3" stroke-linecap="round" />
            <line x1="62" y1="80" x2="72" y2="95" stroke="#000" stroke-width="3" stroke-linecap="round" />
          </svg>
        </div>

        <div class="flex justify-between items-start">
          <div class="space-y-2 md:space-y-4">
            <SectionLabel>Finanças Residenciais</SectionLabel>
            <h1 class="text-4xl md:text-display font-display leading-[1.09] tracking-[-1.5px] md:tracking-[-2.11px] text-charcoal">
              DIVI<span class="text-ember">.</span>
            </h1>
            <p class="text-sm md:text-body text-graphite max-w-[480px] leading-[1.47] tracking-[-0.2px]">
              Gestão inteligente e minimalista para quem compartilha a vida.
            </p>
          </div>

          <div class="flex gap-2">
            <Button 
              v-if="currentView === 'dashboard'"
              variant="secondary" 
              size="icon"
              @click="currentView = 'settings'"
              class="rounded-full border border-stone-surface"
            >
              <Settings class="w-4 h-4 text-graphite" />
            </Button>
            <Button 
              v-else
              variant="secondary"
              size="icon"
              @click="currentView = 'dashboard'"
              class="rounded-full border border-stone-surface"
            >
              <X class="w-4 h-4 text-graphite" />
            </Button>
          </div>
        </div>

        <!-- View Title/Navigation -->
      </header>

      <!-- Main Content -->
      <main class="relative z-10">
        <DashboardSaldos 
          v-if="currentView === 'dashboard' || currentView === 'wizard'"
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

        <ConfiguracoesMembros
          v-else-if="currentView === 'settings'"
          @voltar="currentView = 'dashboard'"
        />
      </main>
    </div>

    <!-- Footer Inverted Section -->
    <div class="max-w-[1200px] mx-auto px-6">
      <InvertedSection v-if="currentView === 'dashboard' || currentView === 'wizard'">
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div class="space-y-4">
            <div class="flex items-center gap-2 text-ember">
              <ShieldCheck class="w-5 h-5" />
              <span class="font-bold tracking-wider uppercase text-[10px]">Privacidade Garantida</span>
            </div>
            <h3 class="text-heading font-display">Seus dados não saem daqui.</h3>
            <p class="text-white/60 text-sm max-w-sm leading-relaxed">
              O DIVI utiliza persistência local e sincronização atômica entre abas. 
              Nada é enviado para servidores externos.
            </p>
          </div>
          
          <div class="flex flex-col gap-4">
            <div class="text-white/40 text-xs flex items-center gap-1.5">
              Feito com <Heart class="w-3 h-3 fill-current text-ember" /> para finanças reais.
            </div>
          </div>
        </div>
      </InvertedSection>
    </div>

    <!-- Floating Action Button (FAB) -->
    <transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="scale-0"
      enter-to-class="scale-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="scale-100"
      leave-to-class="scale-0"
    >
      <Button
        v-if="currentView === 'dashboard' && !isAnyBottomSheetOpen"
        variant="primary"
        class="fixed bottom-8 right-8 w-14 h-14 rounded-full shadow-lg z-[100] active:scale-95"
        @click="currentView = 'wizard'"
      >
        <Plus class="w-6 h-6 stroke-[3px]" />
      </Button>
    </transition>

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
