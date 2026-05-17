<script setup lang="ts">
import { ref, watch } from 'vue'
import { Fatura } from '../../../modules/ledger/core/domain/Fatura'
import SeletorMembros from '../shared/SeletorMembros.vue'
import Card from '../../ui/Card.vue'
import Button from '../../ui/Button.vue'
import SectionLabel from '../../ui/SectionLabel.vue'
import { X, Info } from 'lucide-vue-next'

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
    class="fixed inset-0 bg-midnight/80 backdrop-blur-sm flex justify-center sm:items-center items-end z-[9999] sm:p-6 p-0 animate-in fade-in duration-200"
  >
    <!-- Modal Card Container: Bottom-sheet no Mobile, Modal Centralizado no Desktop -->
    <div 
      class="w-full sm:max-w-md overflow-hidden bg-card border-t sm:border border-stone-surface rounded-t-cardsLarge sm:rounded-cards shadow-lg flex flex-col max-h-[92vh] text-graphite animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-250"
    >
      <!-- Pull-to-dismiss handle (mobile-only grabber bar) -->
      <div class="sm:hidden w-12 h-1 bg-stone-surface rounded-full mx-auto my-3 shrink-0"></div>

      <div class="p-6 sm:p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1">
        <!-- Header -->
        <div class="flex justify-between items-start">
          <div class="space-y-2">
            <SectionLabel>Processamento</SectionLabel>
            <h3 class="text-3xl font-display text-charcoal">Fechar <span class="text-ember">Fatura</span></h3>
          </div>
          <Button variant="secondary" size="icon" @click="emit('close')" class="rounded-full border border-stone-surface">
            <X class="w-4 h-4 text-graphite" />
          </Button>
        </div>

        <!-- Info Box (Meadow Green) -->
        <div class="flex gap-4 p-4 rounded-xl bg-meadow-green/5 border border-meadow-green/20 text-meadow-green text-xs font-semibold leading-relaxed">
          <Info class="w-5 h-5 shrink-0 mt-0.5" />
          <p>
            O membro escolhido será o responsável por quitar a fatura junto ao banco e receberá os repasses dos outros membros.
          </p>
        </div>

        <!-- Seleção de Membros -->
        <div class="space-y-4">
          <label class="block text-[10px] font-bold uppercase text-ash tracking-widest ml-1">Quem pagou ao banco?</label>
          <SeletorMembros 
            :membros="props.membros"
            v-model="responsavelId"
          />
        </div>

        <!-- Footer Buttons -->
        <div class="grid grid-cols-2 gap-3 pt-4 border-t border-stone-surface">
          <Button variant="secondary" @click="emit('close')">Cancelar</Button>
          <Button variant="primary" @click="confirmar" :disabled="!responsavelId">Confirmar</Button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: var(--color-stone-surface);
  border-radius: 9999px;
}
</style>
