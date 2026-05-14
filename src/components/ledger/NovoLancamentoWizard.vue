<script setup lang="ts">
import { ref } from 'vue'
// Note: Dinheiro will be used later for validation/formatting
// import { Dinheiro } from '../../shared/primitives/Dinheiro'

const step = ref(1)
const valor = ref(0)
const descricao = ref('')

const fonte_id = ref('meu_cartao')
const pagador_id = ref('eu')
const pagueiPorOutro = ref(false)

const nextStep = () => step.value++
const prevStep = () => step.value--
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

    <div v-else-if="step === 2">
      <h2 class="text-xl font-bold mb-4">Quem e Como?</h2>
      
      <label class="block text-sm font-medium text-gray-700 mb-2">De onde saiu o dinheiro?</label>
      <div class="grid grid-cols-2 gap-2 mb-6">
        <button 
          @click="fonte_id = 'meu_cartao'"
          :class="['p-2 border rounded transition', fonte_id === 'meu_cartao' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-gray-200']"
        >
          Meu Cartão
        </button>
        <button 
          @click="fonte_id = 'dinheiro'"
          :class="['p-2 border rounded transition', fonte_id === 'dinheiro' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-gray-200']"
        >
          Dinheiro Vivo
        </button>
      </div>

      <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-6 border border-gray-100">
        <span class="text-sm font-medium text-gray-700">Paguei por outra pessoa?</span>
        <button 
          @click="pagueiPorOutro = !pagueiPorOutro"
          :class="['relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2', pagueiPorOutro ? 'bg-blue-600' : 'bg-gray-200']"
        >
          <span :class="['pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out', pagueiPorOutro ? 'translate-x-5' : 'translate-x-0']"></span>
        </button>
      </div>

      <div v-if="pagueiPorOutro" class="mb-6 space-y-2">
        <label class="block text-sm font-medium text-gray-700">Quem é o dono da dívida?</label>
        <select v-model="pagador_id" class="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500 bg-white">
          <option value="colega_x">Colega X</option>
          <option value="grupo">O Grupo</option>
        </select>
      </div>

      <div class="flex gap-2">
        <button @click="prevStep" class="flex-1 border p-3 rounded-lg hover:bg-gray-50 transition">Voltar</button>
        <button @click="nextStep" class="flex-1 bg-blue-600 text-white p-3 rounded-lg font-bold hover:bg-blue-700 transition">Próximo</button>
      </div>
    </div>
  </div>
</template>
