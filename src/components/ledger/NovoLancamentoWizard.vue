<script setup lang="ts">
import { ref } from 'vue'
// Note: Dinheiro will be used later for validation/formatting
// import { Dinheiro } from '../../shared/primitives/Dinheiro'

const step = ref(1)
const valor = ref(0)
const descricao = ref('')

const nextStep = () => step.value++
</script>

<template>
  <div class="max-w-md mx-auto p-6 bg-white rounded-xl shadow-md">
    <div v-if="step === 1">
      <h2 class="text-xl font-bold mb-4">Quanto e O Quê?</h2>
      <div class="mb-4 text-center">
        <span class="text-gray-500 mr-2">R$</span>
        <input 
          v-model.number="valor" 
          type="number" 
          step="0.01"
          placeholder="0,00" 
          class="w-3/4 text-4xl font-mono text-center border-b-2 border-blue-500 focus:outline-none"
        />
      </div>
      <input 
        v-model="descricao" 
        type="text" 
        placeholder="Descrição (ex: Pizza)" 
        class="w-full p-2 mb-6 border rounded"
      />
      <button 
        @click="nextStep" 
        class="w-full bg-blue-600 text-white p-3 rounded-lg font-bold hover:bg-blue-700 transition"
      >
        Próximo
      </button>
    </div>
  </div>
</template>
