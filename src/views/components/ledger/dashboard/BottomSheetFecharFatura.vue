<script setup lang="ts">
import { ref, watch } from 'vue'
import { Fatura } from '../../../../models/entities/Fatura'
import SeletorMembros from '../shared/SeletorMembros.vue'
import Button from '../../ui/Button.vue'
import SectionLabel from '../../ui/SectionLabel.vue'
import { X, Info } from 'lucide-vue-next'
import BottomSheet from '../../ui/BottomSheet.vue'

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
  <BottomSheet :model-value="show && props.fatura !== null" @update:model-value="val => { if (!val) emit('close') }" width-class="md:w-[440px]">
    <div class="p-6 sm:p-8 space-y-6 overflow-y-auto custom-scrollbar flex-grow">
        <!-- Header -->
        <div class="flex justify-between items-start">
          <div class="space-y-2">
            <SectionLabel>Processamento</SectionLabel>
            <h3 class="text-3xl font-display text-charcoal">Fechar <span class="text-ember">Fatura</span></h3>
          </div>
          <Button variant="secondary" size="icon" @click="emit('close')" class="rounded-full border border-stone">
            <X class="w-4 h-4 text-graphite" />
          </Button>
        </div>

        <!-- Info Box (Meadow Green) -->
        <div class="flex gap-4 p-4 rounded-xl bg-meadow/5 border border-meadow/20 text-meadow text-xs font-semibold leading-relaxed">
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
        <div class="grid grid-cols-2 gap-3 pt-4 border-t border-stone">
          <Button variant="secondary" @click="emit('close')">Cancelar</Button>
          <Button variant="primary" @click="confirmar" :disabled="!responsavelId">Confirmar</Button>
        </div>
    </div>
  </BottomSheet>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: var(--color-stone);
  border-radius: 9999px;
}
</style>
