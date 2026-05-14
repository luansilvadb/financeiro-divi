<script setup lang="ts">
defineProps<{
  step: number;
  totalSteps: number;
  canAdvance: boolean;
}>();

defineEmits(['next', 'prev', 'finish']);
</script>

<template>
  <div class="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-gray-100 flex gap-3 md:relative md:bg-transparent md:border-none md:p-0 md:mt-8">
    <button v-if="step > 1" @click="$emit('prev')" class="flex-1 px-6 py-4 bg-gray-50 text-gray-500 font-bold rounded-2xl">
      Voltar
    </button>
    <button 
      v-if="step < totalSteps" 
      @click="$emit('next')" 
      :disabled="!canAdvance"
      class="flex-1 px-6 py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-200 disabled:opacity-50"
    >
      Próximo
    </button>
    <button 
      v-else 
      @click="$emit('finish')" 
      class="flex-1 px-6 py-4 bg-green-600 text-white font-bold rounded-2xl shadow-lg shadow-green-200"
    >
      Salvar
    </button>
  </div>
</template>
