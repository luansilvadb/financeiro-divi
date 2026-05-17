<script setup lang="ts">
import { ref } from 'vue'
import { useMembros } from '../../modules/ledger/composables/useMembros'
import { UserPlus, UserMinus, ArrowLeft } from 'lucide-vue-next'

const { membros, adicionarMembro, desativarMembro } = useMembros()
const novoNome = ref('')

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
      <button @click="emit('voltar')" class="p-2 hover:bg-gray-200 rounded-full transition-colors">
        <ArrowLeft class="w-6 h-6 text-gray-600" />
      </button>
      <h2 class="text-2xl font-bold text-gray-800">Gerenciar Moradores</h2>
    </div>

    <!-- Adicionar Novo -->
    <div class="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
      <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Adicionar Novo Morador</h3>
      <div class="flex gap-2">
        <input 
          v-model="novoNome"
          type="text" 
          placeholder="Nome do morador"
          class="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
          @keyup.enter="handleAdicionar"
        />
        <button 
          @click="handleAdicionar"
          class="bg-blue-900 text-white p-2 rounded-xl hover:bg-blue-800 transition-colors disabled:opacity-50"
          :disabled="!novoNome.trim()"
        >
          <UserPlus class="w-6 h-6" />
        </button>
      </div>
    </div>

    <!-- Lista de Membros -->
    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div class="divide-y divide-gray-50">
        <div 
          v-for="membro in membros" 
          :key="membro.id"
          class="p-4 flex justify-between items-center"
          :class="{ 'opacity-50 grayscale': !membro.ativo }"
        >
          <div>
            <span class="font-bold text-gray-800">{{ membro.nome }}</span>
            <span v-if="!membro.ativo" class="ml-2 text-xs text-gray-400 italic">(Desativado)</span>
          </div>
          
          <button 
            v-if="membro.ativo"
            @click="desativarMembro(membro.id)"
            class="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Desativar morador"
          >
            <UserMinus class="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
