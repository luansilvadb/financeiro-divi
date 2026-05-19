<script setup lang="ts">
import { ref } from 'vue'
import { useMembros } from '../../modules/ledger/composables/useMembros'
import { UserMinus, UserCheck, Users, CreditCard } from 'lucide-vue-next'
import ConfiguracoesCartoes from './ConfiguracoesCartoes.vue'
import Card from '../ui/Card.vue'
import Button from '../ui/Button.vue'

const { membros, adicionarMembro, desativarMembro, ativarMembro } = useMembros()
const novoNome = ref('')
const activeTab = ref<'membros' | 'cartoes'>('membros')

const emit = defineEmits(['voltar'])

const handleAdicionar = async () => {
  if (novoNome.value.trim()) {
    await adicionarMembro(novoNome.value.trim())
    novoNome.value = ''
  }
}
</script>

<template>
  <div class="flex flex-col">
    <!-- Header e Abas fixas no topo do fluxo -->
    <div class="shrink-0 space-y-8 mb-8">
      <div class="flex items-center justify-between">
        <div class="space-y-2">
          <h2 class="text-3xl font-display text-charcoal">Ajustes <span class="text-ember">Gerais</span></h2>
        </div>
      </div>

    <!-- Abas Estilo Pílula -->
    <div class="flex p-1.5 bg-parchment rounded-full w-full border border-stone">
      <button 
        @click="activeTab = 'membros'"
        class="flex-1 relative px-6 py-2.5 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2.5 outline-none group"
        :class="activeTab === 'membros' ? 'text-charcoal' : 'text-ash hover:text-graphite'"
      >
        <div 
          class="absolute inset-0 bg-white shadow-subtle rounded-full transition-all duration-500 ease-[cubic-bezier(0.19,1,0.22,1)]"
          :class="activeTab === 'membros' ? 'opacity-100 scale-100' : 'opacity-0 scale-90'"
        />
        <Users 
          class="w-4 h-4 relative z-10 transition-colors duration-500 ease-[cubic-bezier(0.19,1,0.22,1)]" 
          :class="activeTab === 'membros' ? 'text-ember scale-110' : 'scale-100 group-hover:text-ember/50'" 
        />
        <span class="relative z-10">Moradores</span>
      </button>

      <button 
        @click="activeTab = 'cartoes'"
        class="flex-1 relative px-6 py-2.5 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2.5 outline-none group"
        :class="activeTab === 'cartoes' ? 'text-charcoal' : 'text-ash hover:text-graphite'"
      >
        <div 
          class="absolute inset-0 bg-white shadow-subtle rounded-full transition-all duration-500 ease-[cubic-bezier(0.19,1,0.22,1)]"
          :class="activeTab === 'cartoes' ? 'opacity-100 scale-100' : 'opacity-0 scale-90'"
        />
        <CreditCard 
          class="w-4 h-4 relative z-10 transition-colors duration-500 ease-[cubic-bezier(0.19,1,0.22,1)]" 
          :class="activeTab === 'cartoes' ? 'text-ember scale-110' : 'scale-100 group-hover:text-ember/50'" 
        />
        <span class="relative z-10">Cartões</span>
      </button>
    </div>
    </div>

    <!-- Conteúdo das Abas: Grid Stacking para estabilizar a altura -->
    <div class="grid relative items-start">
      <!-- Conteúdo Aba 1: Moradores -->
      <div 
        class="col-start-1 row-start-1 transition-all duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] space-y-8"
        :class="activeTab === 'membros' ? 'opacity-100 translate-y-0 z-10 delay-100' : 'opacity-0 translate-y-4 pointer-events-none z-0'"
      >
      <!-- Adicionar Novo -->
      <Card class="p-8 shadow-subtle bg-card rounded-card space-y-6">
        <div class="space-y-4">
          <div class="space-y-2">
            <label class="block text-[10px] font-bold uppercase text-ash tracking-widest ml-1">Nome do Morador</label>
            <input 
              v-model="novoNome"
              type="text" 
              placeholder="Ex: Luan, João, etc."
              class="w-full px-4 py-3 rounded-xl border border-stone bg-canvas outline-none font-bold text-charcoal focus:border-ember transition-all text-sm"
              @keyup.enter="handleAdicionar"
            />
          </div>
          <Button 
            @click="handleAdicionar"
            :disabled="!novoNome.trim()"
            class="w-full h-12"
            variant="primary"
          >
            Adicionar Morador
          </Button>
        </div>
      </Card>

      <!-- Lista de Membros -->
      <div class="space-y-4">
        <div class="flex items-center gap-2 mb-2">
          <Users class="w-4 h-4 text-ash" />
          <h4 class="text-[10px] font-bold uppercase tracking-widest text-ash">Moradores Ativos</h4>
        </div>
        
        <div class="grid gap-3">
        <Card 
          v-for="membro in membros" 
          :key="membro.id"
          class="p-4 flex justify-between items-center transition-all bg-card border border-stone shadow-subtle rounded-card"
          :class="{ 'opacity-50 grayscale border-dashed': !membro.ativo }"
        >
          <div class="flex items-center gap-4">
            <div class="w-10 h-10 rounded-full bg-stone flex items-center justify-center font-display text-sm text-charcoal">
              {{ membro.nome[0] }}
            </div>
            <div>
              <span class="font-bold text-charcoal">{{ membro.nome }}</span>
              <span v-if="!membro.ativo" class="block text-[10px] text-ash font-medium uppercase tracking-widest mt-0.5">Desativado</span>
            </div>
          </div>
          
          <Button 
            v-if="membro.ativo"
            variant="secondary"
            size="icon"
            @click="desativarMembro(membro.id)"
            class="bg-coral/10 text-coral hover:bg-coral/20 border border-transparent rounded-full h-10 w-10 flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95"
            title="Desativar morador"
          >
            <UserMinus class="w-4 h-4" />
          </Button>

          <Button 
            v-else
            variant="secondary"
            size="icon"
            @click="ativarMembro(membro.id)"
            class="bg-meadow/10 text-meadow hover:bg-meadow/20 border border-transparent rounded-full h-10 w-10 flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95"
            title="Reativar morador"
          >
            <UserCheck class="w-4 h-4" />
          </Button>
        </Card>
        
        <div v-if="membros.length === 0" class="text-center py-10 border border-dashed border-stone rounded-xl">
          <p class="text-sm text-ash italic">Nenhum morador cadastrado.</p>
        </div>
        </div>
      </div>
      </div> <!-- Fecha Aba 1 -->

      <!-- Conteúdo Aba 2: Cartões -->
      <div 
        class="col-start-1 row-start-1 transition-all duration-500 ease-[cubic-bezier(0.19,1,0.22,1)]"
        :class="activeTab === 'cartoes' ? 'opacity-100 translate-y-0 z-10 delay-100' : 'opacity-0 translate-y-4 pointer-events-none z-0'"
      >
        <ConfiguracoesCartoes />
      </div>
    </div>
  </div>
</template>
