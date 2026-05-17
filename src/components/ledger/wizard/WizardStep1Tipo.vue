<script setup lang="ts">
import { ArrowRight } from 'lucide-vue-next'

const props = defineProps<{
  tipo: 'gasto' | 'ganho' | null
}>()

const emit = defineEmits(['selecionar'])
</script>

<template>
  <div key="step1">
    <h2 class="text-xl font-bold mb-8 text-gray-800 text-center">O que você deseja registrar?</h2>
    <div class="grid grid-cols-1 gap-4">
      <button 
        @click="emit('selecionar', 'gasto')"
        :class="[
          'flex items-center justify-between p-6 border-2 rounded-2xl group shadow-sm',
          tipo === 'gasto' ? 'border-red-500 bg-red-50' : 'border-red-50 hover:border-red-500 hover:bg-red-50'
        ]"
      >
        <div class="flex items-center gap-5">
          <div class="bg-red-100 p-3 rounded-xl text-3xl">💸</div>
          <div class="text-left">
            <span class="block font-bold text-gray-800 text-lg">Um gasto</span>
            <span class="text-sm text-gray-500">Dinheiro que saiu da conta</span>
          </div>
        </div>
        <ArrowRight :class="['w-6 h-6', tipo === 'gasto' ? 'text-red-500' : 'text-gray-300 group-hover:text-red-500']" />
      </button>
      <button 
        @click="emit('selecionar', 'ganho')"
        :class="[
          'flex items-center justify-between p-6 border-2 rounded-2xl group shadow-sm',
          tipo === 'ganho' ? 'border-green-500 bg-green-50' : 'border-green-50 hover:border-green-500 hover:bg-green-50'
        ]"
      >
        <div class="flex items-center gap-5">
          <div class="bg-green-100 p-3 rounded-xl text-3xl">💰</div>
          <div class="text-left">
            <span class="block font-bold text-gray-800 text-lg">Um ganho</span>
            <span class="text-sm text-gray-500">Dinheiro que entrou na conta</span>
          </div>
        </div>
        <ArrowRight :class="['w-6 h-6', tipo === 'ganho' ? 'text-green-500' : 'text-gray-300 group-hover:text-green-500']" />
      </button>
    </div>
  </div>
</template>
