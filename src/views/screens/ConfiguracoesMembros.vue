<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useMembros } from '../../viewmodels/useMembros'
import { useCasasMultitenant } from '../../viewmodels/useCasasMultitenant'
import Button from '../components/ui/Button.vue'
import PerfilUsuarioTab from '../components/settings/PerfilUsuarioTab.vue'
import GestaoAcessoTab from '../components/settings/GestaoAcessoTab.vue'
import ConfiguracoesCasaTab from '../components/settings/ConfiguracoesCasaTab.vue'

const emit = defineEmits(['voltar', 'logout'])

const { carregar, currentMembro } = useMembros()
const activeTenantId = useCasasMultitenant().activeTenantId

const activeTab = ref<'perfil' | 'acesso' | 'casa'>('perfil')
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
      <h2 class="text-display text-4xl sm:text-5xl text-charcoal">Moradores <span class="text-ember">&</span> Acessos</h2>
      <p class="text-xs sm:text-sm text-ash font-bold mt-2 uppercase tracking-[0.2em]">Quem mora aqui e como cada um contribui</p>
    </div>

    <!-- Navegação Floating Island -->
    <div v-if="!isModoFoco" class="shrink-0 flex justify-center px-6 mb-6 overflow-x-auto no-scrollbar">
      <div class="inline-flex p-1 bg-stone/10 backdrop-blur-md rounded-2xl border border-stone/30 relative whitespace-nowrap">
        <button
          @click="activeTab = 'perfil'"
          class="px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest cursor-pointer border-none transition-all duration-300 relative z-10 select-none"
          :class="activeTab === 'perfil' ? 'bg-white text-charcoal shadow-subtle' : 'bg-transparent text-ash hover:text-charcoal'"
        >
          Meu Perfil
        </button>
        <button
          @click="activeTab = 'acesso'"
          class="px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest cursor-pointer border-none transition-all duration-300 relative z-10 select-none"
          :class="activeTab === 'acesso' ? 'bg-white text-charcoal shadow-subtle' : 'bg-transparent text-ash hover:text-charcoal'"
        >
          Acessos
        </button>
        <button
          v-if="isAdmin"
          @click="activeTab = 'casa'"
          class="px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest cursor-pointer border-none transition-all duration-300 relative z-10 select-none"
          :class="activeTab === 'casa' ? 'bg-white text-charcoal shadow-subtle' : 'bg-transparent text-ash hover:text-charcoal'"
        >
          Casa
        </button>
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
