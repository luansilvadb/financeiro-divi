<script setup lang="ts">
import { ref, onMounted } from 'vue'

const props = defineProps<{
  valor: number
  descricao: string
  tipo: 'gasto' | 'ganho' | null
}>()

const emit = defineEmits(['update:valor', 'update:descricao'])

const valorInput = ref<HTMLInputElement | null>(null)

onMounted(() => {
  setTimeout(() => {
    valorInput.value?.focus()
  }, 150)
})
</script>

<template>
  <div key="step2">
    <h2 class="text-xl font-bold mb-8 text-gray-800 text-center">
      Quais os dados do lançamento?
    </h2>
    
    <div class="mb-10 text-center bg-blue-50/50 p-10 rounded-[2.5rem] border-2 border-blue-100 group">
      <div class="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-4">Valor Total</div>
      <div class="flex items-baseline justify-center gap-2 mb-8">
        <span class="text-blue-300 text-2xl font-bold">R$</span>
        <input 
          ref="valorInput"
          :value="valor"
          @input="emit('update:valor', Number(($event.target as HTMLInputElement).value))"
          type="number" 
          step="0.01"
          class="w-48 text-6xl font-black text-blue-600 bg-transparent border-none focus:outline-none mono tracking-tighter text-center"
          placeholder="0,00"
        />
      </div>
      
      <input 
        :value="descricao"
        @input="emit('update:descricao', ($event.target as HTMLInputElement).value)"
        type="text" 
        :placeholder="tipo === 'gasto' ? 'O que você comprou?' : 'De onde veio?'" 
        class="w-full p-5 text-lg border-2 border-blue-100/50 rounded-2xl focus:border-blue-200 focus:outline-none bg-white/50 text-center placeholder:text-blue-300 text-blue-600"
      />
    </div>
  </div>
</template>
