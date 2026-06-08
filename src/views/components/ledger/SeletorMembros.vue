<script setup lang="ts">
import { Check } from 'lucide-vue-next'
import MembroAvatar from '../ui/MembroAvatar.vue'

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

const variants: ('ember' | 'meadow' | 'sky' | 'sunburst' | 'flamingo')[] = ['ember', 'sky', 'meadow', 'sunburst', 'flamingo']
</script>

<template>
  <div class="grid grid-cols-3 gap-3">
    <button 
      v-for="(m, idx) in props.membros" 
      :key="m.id"
      type="button"
      @click="toggle(m.id)"
      class="p-4 rounded-2xl flex flex-col items-center gap-3 transition-all duration-300 relative overflow-hidden group cursor-pointer"
      :class="[
        isSelected(m.id) 
          ? 'border-2 border-charcoal bg-white shadow-subtle scale-[1.02] z-10' 
          : 'border-2 border-transparent bg-parchment opacity-70 hover:opacity-100 hover:bg-stone/50'
      ]"
    >
      <MembroAvatar 
        :nome="m.nome" 
        :variant="isSelected(m.id) ? 'ember' : variants[idx % variants.length]" 
        size="lg"
        class="transition-all duration-500"
      />
      <span class="font-bold text-[10px] uppercase tracking-[0.1em] truncate w-full text-center text-charcoal leading-none">{{ m.nome }}</span>
      
      <div v-if="isSelected(m.id)" class="absolute top-2 right-2 animate-in zoom-in-50 duration-300">
        <Check class="w-3.5 h-3.5 text-meadow" stroke-width="4" />
      </div>
      
      <slot name="badge" :membro="m" :selected="isSelected(m.id)"></slot>
    </button>
  </div>
</template>
