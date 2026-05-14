<script setup lang="ts">
import { Clock, User } from 'lucide-vue-next'
import type { Transacao } from '../../modules/ledger/core/domain/Transacao'

interface Props {
  transacoes: Transacao[]
  membros: { id: string; nome: string }[]
}

const props = defineProps<Props>()

const getMembroNome = (id: string) => {
  return props.membros.find(m => m.id === id)?.nome || id
}

// Create a reactive sorted list
import { computed } from 'vue'
const sortedTransacoes = computed(() => {
  return [...props.transacoes].sort((a, b) => b.data.getTime() - a.data.getTime())
})

const formatDate = (date: Date) => {
  return new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}
</script>

<template>
  <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
    <div class="p-4 border-b border-gray-50 flex items-center gap-2">
      <Clock class="w-5 h-5 text-blue-600" />
      <h3 class="font-bold text-gray-800">Atividade Recente</h3>
    </div>

    <div class="divide-y divide-gray-50 max-h-96 overflow-y-auto">
      <div v-if="sortedTransacoes.length === 0" class="p-8 text-center text-gray-400 italic text-sm">
        Nenhuma transação encontrada.
      </div>
      
      <div 
        v-for="t in sortedTransacoes" 
        :key="t.id"
        class="p-4 hover:bg-gray-50 transition"
      >
        <div class="flex justify-between items-start mb-1">
          <span class="font-bold text-gray-800 text-sm">{{ t.descricao }}</span>
          <span class="font-bold text-blue-600">{{ t.total.formatar() }}</span>
        </div>
        
        <div class="flex justify-between items-center text-xs text-gray-500">
          <div class="flex items-center gap-1">
            <User class="w-3 h-3" />
            <span>Pago por <strong>{{ getMembroNome(t.origem_id) }}</strong></span>
          </div>
          <span>{{ formatDate(t.data) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
