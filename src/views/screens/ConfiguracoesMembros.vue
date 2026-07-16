<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useMembros } from '../../viewmodels/useMembros'
import { useCasasMultitenant } from '../../viewmodels/useCasasMultitenant'
import Button from '../components/ui/Button.vue'
import PerfilUsuarioTab from '../components/settings/PerfilUsuarioTab.vue'
import GestaoAcessoTab from '../components/settings/GestaoAcessoTab.vue'
import ConfiguracoesCasaTab from '../components/settings/ConfiguracoesCasaTab.vue'
import TenantSwitcherModal from '../components/ui/TenantSwitcherModal.vue'

const emit = defineEmits(['voltar', 'logout'])

const { carregar, currentMembro } = useMembros()
const { activeTenantId } = useCasasMultitenant()

const activeTab = ref<'perfil' | 'acesso' | 'casa' | 'casas'>('perfil')
const isModoFoco = ref(false)

const isAdmin = computed(() => currentMembro.value?.role === 'ADMIN')

const handleFocusChange = (active: boolean) => {
  isModoFoco.value = active
}

const handleLogout = () => {
  emit('logout')
}

onMounted(async () => {
  await carregar()
})
</script>

<template>
  <div class="h-full flex flex-col bg-canvas overflow-hidden">
    <!-- Header -->
    <div v-if="!isModoFoco" class="shrink-0 p-6 sm:px-8 sm:pt-10">
      <h2 class="text-display text-4xl sm:text-5xl text-charcoal">Perfil <span class="text-ember">dos</span> Usuários</h2>
      <p class="text-xs sm:text-sm text-ash font-bold mt-2 uppercase tracking-[0.2em]">Configure quem mora aqui e como cada um contribui</p>
    </div>

    <!-- Navegação de Abas -->
    <div v-if="!isModoFoco" class="shrink-0 relative mb-6">
      <!-- Fade indicators para scroll -->
      <div class="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-canvas to-transparent z-20 pointer-events-none sm:hidden" />
      <div class="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-r from-transparent to-canvas z-20 pointer-events-none sm:hidden" />
      
      <div class="flex px-4 sm:justify-center overflow-x-auto no-scrollbar scroll-smooth">
        <div class="inline-flex p-1 bg-white rounded-pill border border-stone/20 shadow-sm whitespace-nowrap">
          <button
            @click="activeTab = 'perfil'"
            class="px-5 py-3 min-h-[44px] rounded-[24px] font-bold text-[11px] sm:text-xs uppercase tracking-wider sm:tracking-widest cursor-pointer border-none transition-all duration-500 ease-jelly relative z-10 select-none active:scale-95"
            :class="activeTab === 'perfil' ? 'bg-white text-ember shadow-[0_2px_12px_rgba(255,62,0,0.12)]' : 'bg-transparent text-ash hover:text-charcoal'"
          >
            Meu Perfil
          </button>
          <button
            @click="activeTab = 'acesso'"
            class="px-5 py-3 min-h-[44px] rounded-[24px] font-bold text-[11px] sm:text-xs uppercase tracking-wider sm:tracking-widest cursor-pointer border-none transition-all duration-500 ease-jelly relative z-10 select-none active:scale-95"
            :class="activeTab === 'acesso' ? 'bg-white text-ember shadow-[0_2px_12px_rgba(255,62,0,0.12)]' : 'bg-transparent text-ash hover:text-charcoal'"
          >
            Acessos
          </button>
          <button
            @click="activeTab = 'casas'"
            class="px-5 py-3 min-h-[44px] rounded-[24px] font-bold text-[11px] sm:text-xs uppercase tracking-wider sm:tracking-widest cursor-pointer border-none transition-all duration-500 ease-jelly relative z-10 select-none active:scale-95"
            :class="activeTab === 'casas' ? 'bg-white text-ember shadow-[0_2px_12px_rgba(255,62,0,0.12)]' : 'bg-transparent text-ash hover:text-charcoal'"
          >
            Casas
          </button>
          <button
            v-if="isAdmin"
            @click="activeTab = 'casa'"
            class="px-5 py-3 min-h-[44px] rounded-[24px] font-bold text-[11px] sm:text-xs uppercase tracking-wider sm:tracking-widest cursor-pointer border-none transition-all duration-500 ease-jelly relative z-10 select-none active:scale-95"
            :class="activeTab === 'casa' ? 'bg-white text-ember shadow-[0_2px_12px_rgba(255,62,0,0.12)]' : 'bg-transparent text-ash hover:text-charcoal'"
          >
            Permissões
          </button>
        </div>
      </div>
    </div>

    <!-- Conteúdo das Abas -->
    <div class="flex-1 overflow-y-auto px-6 sm:px-8 pb-8 custom-scrollbar">
      <div class="max-w-2xl mx-auto py-4">
        
        <PerfilUsuarioTab 
          v-if="activeTab === 'perfil'" 
          :is-modo-foco="isModoFoco"
          @logout="handleLogout"
          @focus-change="handleFocusChange"
        />

        <GestaoAcessoTab 
          v-else-if="activeTab === 'acesso'" 
          :active-tenant-id="activeTenantId"
          @focus-change="handleFocusChange"
        />

        <ConfiguracoesCasaTab
          v-else-if="activeTab === 'casa'"
          :active-tenant-id="activeTenantId"
          @focus-change="handleFocusChange"
        />

        <TenantSwitcherModal
          v-else-if="activeTab === 'casas'"
          @casa-selecionada="emit('voltar')"
        />

      </div>
    </div>

    <!-- Footer -->
    <div v-if="!isModoFoco" class="shrink-0 p-6 sm:px-8 sm:pb-8 border-t border-stone/30 bg-white">
      <Button variant="secondary" class="w-full" @click="emit('voltar')">Fechar</Button>
    </div>
  </div>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
