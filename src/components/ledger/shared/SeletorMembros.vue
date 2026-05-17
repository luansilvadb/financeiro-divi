<script setup lang="ts">
import { Check } from 'lucide-vue-next'

interface Props {
  membros: { id: string; nome: string }[]
  modelValue: string | string[]
  multiple?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  multiple: false
})

const emit = defineEmits(['update:modelValue'])

const isSelected = (id: string) => {
  if (props.multiple && Array.isArray(props.modelValue)) {
    return props.modelValue.includes(id)
  }
  return props.modelValue === id
}

const toggle = (id: string) => {
  if (props.multiple && Array.isArray(props.modelValue)) {
    const list = [...props.modelValue]
    const idx = list.indexOf(id)
    if (idx >= 0) {
      list.splice(idx, 1)
    } else {
      list.push(id)
    }
    emit('update:modelValue', list)
  } else {
    emit('update:modelValue', id)
  }
}
</script>

<template>
  <div class="grid grid-cols-3 gap-3">
    <button 
      v-for="m in props.membros" 
      :key="m.id"
      type="button"
      @click="toggle(m.id)"
      class="p-4 border rounded-xl flex flex-col items-center gap-3 transition-all relative overflow-hidden"
      :class="[
        isSelected(m.id) 
          ? 'border-ember bg-ember/5 text-ember shadow-sm' 
          : 'border-stone-surface bg-[#fbfaf9] text-ash hover:border-ember/30'
      ]"
    >
      <div 
        class="w-10 h-10 rounded-full flex items-center justify-center font-display text-sm transition-colors"
        :class="[
          isSelected(m.id) ? 'bg-ember text-white' : 'bg-stone text-charcoal'
        ]"
      >
        {{ m.nome[0].toUpperCase() }}
      </div>
      <span class="font-bold text-[10px] uppercase tracking-wider truncate w-full text-center">{{ m.nome }}</span>
      
      <div v-if="isSelected(m.id)" class="absolute top-1 right-1">
        <Check class="w-3 h-3 text-ember" />
      </div>
      
      <slot name="badge" :membro="m" :selected="isSelected(m.id)"></slot>
    </button>
  </div>
</template>
