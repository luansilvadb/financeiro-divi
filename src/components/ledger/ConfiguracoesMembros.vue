<script setup lang="ts">
import { ref } from 'vue'
import { useMembros } from '../../modules/ledger/composables/useMembros'
import { UserPlus, UserMinus, ArrowLeft, Users, CreditCard } from 'lucide-vue-next'
import ConfiguracoesCartoes from './ConfiguracoesCartoes.vue'
import Card from '../ui/Card.vue'
import Button from '../ui/Button.vue'
import SectionLabel from '../ui/SectionLabel.vue'

const { membros, adicionarMembro, desativarMembro } = useMembros()
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
  <div class="space-y-12">
    <div class="flex items-center justify-between">
      <div class="space-y-2">
        <SectionLabel>Gerenciamento</SectionLabel>
        <h2 class="text-3xl font-display text-charcoal">Ajustes <span class="text-ember">Gerais</span></h2>
      </div>
      <Button variant="secondary" size="icon" @click="emit('voltar')" class="rounded-full border border-stone-surface">
        <ArrowLeft class="w-4 h-4 text-graphite" />
      </Button>
    </div>

    <!-- Abas (Tabs switcher no padrão Family) -->
    <div class="flex bg-stone p-1.5 rounded-xl gap-1.5 border border-stone-surface">
      <button 
        @click="activeTab = 'membros'"
        :class="[
          'flex-1 py-3 px-4 text-xs font-bold uppercase tracking-widest rounded-lg transition-all duration-200 flex items-center justify-center gap-2',
          activeTab === 'membros' 
            ? 'bg-card text-ember shadow-subtle border border-stone-surface' 
            : 'text-ash hover:text-charcoal'
        ]"
      >
        <Users class="w-4 h-4" />
        Moradores
      </button>
      <button 
        @click="activeTab = 'cartoes'"
        :class="[
          'flex-1 py-3 px-4 text-xs font-bold uppercase tracking-widest rounded-lg transition-all duration-200 flex items-center justify-center gap-2',
          activeTab === 'cartoes' 
            ? 'bg-card text-ember shadow-subtle border border-stone-surface' 
            : 'text-ash hover:text-charcoal'
        ]"
      >
        <CreditCard class="w-4 h-4" />
        Cartões
      </button>
    </div>

    <!-- Conteúdo Aba 1: Moradores -->
    <div v-if="activeTab === 'membros'" class="space-y-8 animate-in fade-in slide-in-from-bottom-4">
      <!-- Adicionar Novo -->
      <Card class="p-8 shadow-subtle bg-card rounded-cards space-y-4">
        <h3 class="text-[10px] font-bold text-ash uppercase tracking-widest ml-1">Novo Morador</h3>
        <div class="flex gap-3">
          <input 
            v-model="novoNome"
            type="text" 
            placeholder="Nome do morador..."
            class="flex-1 px-4 py-3 rounded-xl border border-stone bg-[#fbfaf9] outline-none font-bold text-charcoal focus:border-ember transition-all text-sm"
            @keyup.enter="handleAdicionar"
          />
          <Button 
            @click="handleAdicionar"
            :disabled="!novoNome.trim()"
            size="icon"
            class="h-12 w-12 shrink-0 rounded-full transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center"
            :class="novoNome.trim() 
              ? 'bg-ember/10 text-ember hover:bg-ember/20 shadow-sm border border-transparent' 
              : 'bg-stone/40 text-ash/40 border border-stone-surface/20 opacity-50'"
          >
            <UserPlus class="w-5 h-5" />
          </Button>
        </div>
      </Card>

      <!-- Lista de Membros -->
      <div class="grid gap-3">
        <Card 
          v-for="membro in membros" 
          :key="membro.id"
          class="p-4 flex justify-between items-center transition-all bg-card border border-stone-surface shadow-subtle rounded-cards"
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
            class="bg-coral-red/10 text-coral-red hover:bg-coral-red/20 border border-transparent rounded-full h-10 w-10 flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95"
            title="Desativar morador"
          >
            <UserMinus class="w-4 h-4" />
          </Button>
        </Card>
      </div>
    </div>

    <!-- Conteúdo Aba 2: Cartões -->
    <div v-else-if="activeTab === 'cartoes'" class="animate-in fade-in slide-in-from-bottom-4">
      <ConfiguracoesCartoes />
    </div>
  </div>
</template>
