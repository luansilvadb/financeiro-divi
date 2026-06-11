<script setup lang="ts">
import MembroAvatar from '../ui/MembroAvatar.vue'

interface Member {
  id: string
  nome: string
}

interface Props {
  membros: Member[]
  currentState: string
  selectedId: string | null
  compradorSelecionadoId?: string | null
}

const props = defineProps<Props>()
const emit = defineEmits(['select'])

const filteredMembers = props.currentState === 'BORROWER_SELECTION'
  ? props.membros.filter(m => m.id !== props.compradorSelecionadoId)
  : props.membros

const handleSelect = (id: string) => {
  emit('select', id)
}
</script>

<template>
  <div 
    class="grid grid-cols-2 gap-3"
    role="listbox"
    :aria-label="currentState === 'BORROWER_SELECTION' ? 'Selecionar quem pegou emprestado' : 'Selecionar quem pagou'"
  >
    <button
      v-for="m in filteredMembers"
      :key="m.id"
      @click="handleSelect(m.id)"
      role="option"
      :aria-selected="selectedId === m.id"
      class="group flex flex-col items-center gap-3 p-4 rounded-card bg-parchment hover:bg-stone transition-all duration-300 border-none cursor-pointer"
    >
      <MembroAvatar 
        :nome="m.nome" 
        size="md" 
        :variant="selectedId === m.id ? 'ember' : 'sky'" 
      />
      <span class="font-bold text-[11px] text-charcoal uppercase tracking-wider">{{ m.nome }}</span>
    </button>
  </div>
</template>
