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
    class="fixed inset-0 bg-[#040814]/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4"
  >
    <div class="glass-card w-full max-w-sm rounded-3xl shadow-2xl p-6 border border-divi-border flex flex-col text-divi-t1">
      <!-- Header -->
      <div class="flex justify-between items-center mb-6 border-b border-divi-border pb-4">
        <div>
          <h3 class="text-sm font-black text-divi-t1 uppercase tracking-wider">Fechar Fatura</h3>
          <span class="text-xs text-divi-t2 font-bold block mt-1">Quem pagou a fatura ao banco?</span>
        </div>
        <button 
          @click="emit('close')"
          class="w-8 h-8 rounded-full bg-divi-s2 hover:bg-divi-s3 text-divi-t2 hover:text-divi-t1 font-bold flex items-center justify-center transition-all"
        >
          ✕
        </button>
      </div>

      <!-- Info Box -->
      <div class="bg-divi-amber-dim/15 border border-divi-amber/25 rounded-2xl p-4 mb-5 text-xs text-divi-amber leading-relaxed shadow-sm">
        <strong>⚠️ Nota Importante:</strong> O membro escolhido será o responsável por quitar a fatura junto ao banco e receberá os Pix de acerto dos outros membros da casa compartilhada.
      </div>

      <!-- Seleção de Membros -->
      <div class="space-y-3 mb-6">
        <span class="text-[10px] font-black uppercase text-divi-t2 tracking-widest block">Selecione o Responsável:</span>
        <SeletorMembros 
          :membros="props.membros"
          v-model="responsavelId"
        />
      </div>

      <!-- Footer Buttons -->
      <div class="border-t border-divi-border pt-4 flex gap-3">
        <button 
          @click="emit('close')"
          class="flex-1 py-3 bg-divi-s2 hover:bg-divi-s3 border border-divi-border rounded-2xl text-xs font-black text-divi-t1 transition-all"
        >
          Cancelar
        </button>
        <button 
          @click="confirmar"
          :disabled="!responsavelId"
          class="flex-1 py-3 bg-divi-primary hover:bg-indigo-500 disabled:bg-divi-s1 border border-indigo-400/25 disabled:border-divi-border disabled:text-divi-t3 text-white rounded-2xl text-xs font-black shadow-[0_0_16px_var(--primary-glow)] disabled:shadow-none transition-all"
        >
          Confirmar Fechamento
        </button>
      </div>
    </div>
  </div>
</template>
