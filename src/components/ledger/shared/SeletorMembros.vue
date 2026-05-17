<script setup lang="ts">
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
      :class="[
        'p-3 border-2 rounded-2xl flex flex-col items-center gap-2 transition-all relative overflow-hidden',
        isSelected(m.id) 
          ? 'border-blue-600 bg-blue-50/20 text-blue-800 shadow-sm' 
          : 'border-slate-100 hover:border-blue-600/30 text-gray-600'
      ]"
    >
      <div 
        :class="[
          'w-10 h-10 rounded-full flex items-center justify-center font-black text-sm',
          isSelected(m.id) ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'
        ]"
      >
        {{ m.nome[0].toUpperCase() }}
      </div>
      <span class="font-bold text-[11px] truncate w-full text-center">{{ m.nome }}</span>
      <slot name="badge" :membro="m" :selected="isSelected(m.id)"></slot>
    </button>
  </div>
</template>
