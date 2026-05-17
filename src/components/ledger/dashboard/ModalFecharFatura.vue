<script setup lang="ts">
import { ref, watch } from 'vue'
import { Fatura } from '../../../modules/ledger/core/domain/Fatura'
import SeletorMembros from '../shared/SeletorMembros.vue'

interface Props {
  show: boolean
  fatura: Fatura | null
  membros: { id: string; nome: string }[]
}

const props = defineProps<Props>()
const emit = defineEmits(['close', 'confirmar'])

const responsavelId = ref('')

// Define o responsável padrão herdado da fatura/cartão
watch(
  () => props.fatura,
  (f) => {
    if (f) {
      responsavelId.value = f.responsavelId
    }
  },
  { immediate: true }
)

const confirmar = () => {
  if (!responsavelId.value || !props.fatura) return
  emit('confirmar', props.fatura.id, responsavelId.value)
}
</script>

<template>
  <div 
    v-if="show && props.fatura" 
    class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
  >
    <div class="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 border border-slate-100 flex flex-col">
      <!-- Header -->
      <div class="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
        <div>
          <h3 class="text-sm font-black text-gray-800 uppercase tracking-wider">Fechar Fatura</h3>
          <span class="text-xs text-gray-400 font-bold block mt-1">Quem pagou a fatura ao banco?</span>
        </div>
        <button 
          @click="emit('close')"
          class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-gray-500 font-bold flex items-center justify-center"
        >
          ✕
        </button>
      </div>

      <!-- Info Box -->
      <div class="bg-amber-50/40 border border-amber-100/50 rounded-2xl p-4 mb-5 text-xs text-amber-800 leading-relaxed">
        <strong>⚠️ Nota Importante:</strong> O membro escolhido será o responsável por quitar a fatura junto ao banco e receberá os Pix de acerto dos outros membros da casa compartilhada.
      </div>

      <!-- Seleção de Membros -->
      <div class="space-y-3 mb-6">
        <span class="text-[10px] font-black uppercase text-gray-400 tracking-widest block">Selecione o Responsável:</span>
        <SeletorMembros 
          :membros="props.membros"
          v-model="responsavelId"
        />
      </div>

      <!-- Footer Buttons -->
      <div class="border-t border-slate-100 pt-4 flex gap-3">
        <button 
          @click="emit('close')"
          class="flex-1 py-3 border-2 border-slate-100 hover:border-slate-200 rounded-2xl text-xs font-black text-gray-500 transition-all"
        >
          Cancelar
        </button>
        <button 
          @click="confirmar"
          :disabled="!responsavelId"
          class="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-2xl text-xs font-black shadow-md hover:shadow-lg transition-all"
        >
          Confirmar Fechamento
        </button>
      </div>
    </div>
  </div>
</template>
