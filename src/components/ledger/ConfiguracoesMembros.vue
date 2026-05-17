<script setup lang="ts">
import { ref } from 'vue'
import { useMembros } from '../../modules/ledger/composables/useMembros'
import { UserPlus, UserMinus, ArrowLeft } from 'lucide-vue-next'
import ConfiguracoesCartoes from './ConfiguracoesCartoes.vue'

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
  <div class="max-w-md mx-auto space-y-6">
    <div class="flex items-center gap-4 mb-2">
      <button @click="emit('voltar')" class="p-2 bg-divi-s2 border border-divi-border hover:bg-divi-s3 rounded-full text-divi-t1 transition-colors">
        <ArrowLeft class="w-6 h-6 text-divi-t1" />
      </button>
      <h2 class="text-2xl font-black text-divi-t1">Configurações</h2>
    </div>

    <!-- Abas (Tabs) -->
    <div class="flex bg-white/5 p-1 rounded-2xl gap-1 shadow-inner border border-white/5">
      <button 
        @click="activeTab = 'membros'"
        :class="['flex-1 py-3 text-sm font-black text-center rounded-xl transition-all', activeTab === 'membros' ? 'bg-divi-primary text-white shadow-[0_0_12px_var(--primary-glow)]' : 'text-divi-t2 hover:text-divi-t1']"
      >
        Moradores
      </button>
      <button 
        @click="activeTab = 'cartoes'"
        :class="['flex-1 py-3 text-sm font-black text-center rounded-xl transition-all', activeTab === 'cartoes' ? 'bg-divi-primary text-white shadow-[0_0_12px_var(--primary-glow)]' : 'text-divi-t2 hover:text-divi-t1']"
      >
        Cartões
      </button>
    </div>

    <!-- Conteúdo Aba 1: Moradores -->
    <div v-if="activeTab === 'membros'" class="space-y-6">
      <!-- Adicionar Novo -->
      <div class="glass-card rounded-3xl p-6 border border-divi-border shadow-lg space-y-4">
        <h3 class="text-xs font-bold text-divi-t2 uppercase tracking-wider mb-2">Adicionar Novo Morador</h3>
        <div class="flex gap-2">
          <input 
            v-model="novoNome"
            type="text" 
            placeholder="Nome do morador"
            class="flex-1 px-4 py-3 rounded-2xl glass-input outline-none font-bold text-divi-t1"
            @keyup.enter="handleAdicionar"
          />
          <button 
            @click="handleAdicionar"
            class="bg-blue-900 bg-divi-primary hover:bg-indigo-500 border border-indigo-400/25 text-white p-3 rounded-2xl shadow-[0_0_16px_var(--primary-glow)] disabled:shadow-none transition-all disabled:opacity-50 disabled:bg-divi-s1 disabled:border-divi-border"
            :disabled="!novoNome.trim()"
          >
            <UserPlus class="w-6 h-6" />
          </button>
        </div>
      </div>

      <!-- Lista de Membros -->
      <div class="glass-card rounded-3xl border border-divi-border overflow-hidden shadow-md">
        <div class="flex flex-col">
          <div 
            v-for="membro in membros" 
            :key="membro.id"
            class="p-4 flex justify-between items-center hover:bg-divi-s1/20 transition-colors duration-150 border-b border-divi-border last:border-0"
            :class="{ 'opacity-50 grayscale': !membro.ativo }"
          >
            <div>
              <span class="font-bold text-divi-t1">{{ membro.nome }}</span>
              <span v-if="!membro.ativo" class="ml-2 text-xs text-divi-t3 italic">(Desativado)</span>
            </div>
            
            <button 
              v-if="membro.ativo"
              @click="desativarMembro(membro.id)"
              class="text-red-400 p-2.5 text-divi-rose bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-xl transition-all shadow-sm"
              title="Desativar morador"
            >
              <UserMinus class="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Conteúdo Aba 2: Cartões -->
    <div v-else-if="activeTab === 'cartoes'">
      <ConfiguracoesCartoes />
    </div>
  </div>
</template>
