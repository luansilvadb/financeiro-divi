<script setup lang="ts">
import { computed } from 'vue'
import MembroAvatar from '../ui/MembroAvatar.vue'
import { Check } from 'lucide-vue-next'

interface Member {
  id: string
  nome: string
}

interface Props {
  membros: Member[]
  participantesDivisao: string[]
  compradorSelecionadoId: string
}

const props = defineProps<Props>()
const emit = defineEmits(['update:participantesDivisao'])

const internalParticipantes = computed({
  get: () => props.participantesDivisao,
  set: (val) => emit('update:participantesDivisao', val)
})

const toggleSplitMember = (id: string) => {
  const current = [...internalParticipantes.value]
  const idx = current.indexOf(id)
  if (idx >= 0) current.splice(idx, 1)
  else current.push(id)
  internalParticipantes.value = current
}

const selecionarTodos = () => {
  internalParticipantes.value = props.membros.map(m => m.id)
}

const selecionarApenasEu = () => {
  internalParticipantes.value = [props.compradorSelecionadoId]
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex gap-2" role="group" aria-label="Atalhos de divisão">
      <button 
        @click="selecionarTodos" 
        class="px-3.5 py-2 rounded-full bg-midnight text-white text-[10px] font-bold uppercase tracking-wider border-none cursor-pointer hover:bg-charcoal transition-colors"
      >
        Todos
      </button>
      <button 
        @click="selecionarApenasEu" 
        class="px-3.5 py-2 rounded-full bg-stone text-charcoal text-[10px] font-bold uppercase tracking-wider border-none cursor-pointer hover:bg-ash/20 transition-colors"
      >
        Apenas eu
      </button>
    </div>

    <div class="grid grid-cols-3 gap-2" role="listbox" aria-multiselectable="true" aria-label="Selecionar membros para dividir">
      <button
        v-for="m in membros"
        :key="m.id"
        @click="toggleSplitMember(m.id)"
        role="option"
        :aria-selected="internalParticipantes.includes(m.id)"
        class="group relative flex flex-col items-center gap-2 p-3 rounded-card transition-all duration-300 border-none cursor-pointer"
        :class="[internalParticipantes.includes(m.id) ? 'bg-white shadow-subtle scale-[1.02]' : 'bg-parchment opacity-80']"
      >
        <MembroAvatar 
          :nome="m.nome" 
          size="md" 
          :variant="internalParticipantes.includes(m.id) ? 'meadow' : 'sky'" 
        />
        <span class="text-[10px] font-bold text-charcoal uppercase tracking-tight truncate max-w-full px-1">{{ m.nome }}</span>
        <Check v-if="internalParticipantes.includes(m.id)" class="absolute top-2 right-2 w-3.5 h-3.5 text-meadow animate-in zoom-in-50 duration-300" aria-hidden="true" />
      </button>
    </div>
  </div>
</template>
