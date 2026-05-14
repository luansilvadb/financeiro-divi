<script setup lang="ts">
defineProps<{
  step: number;
  totalSteps: number;
  canAdvance: boolean;
}>();

defineEmits(['next', 'prev', 'finish']);
</script>

<template>
  <div class="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-xl border-t border-gray-50 flex gap-4 md:relative md:bg-transparent md:border-none md:p-0 md:mt-10 z-50">
    <button 
      v-if="step > 1" 
      @click="$emit('prev')" 
      class="flex-1 px-8 py-5 bg-gray-100 text-gray-500 font-bold rounded-3xl hover:bg-gray-200 transition-colors"
    >
      Voltar
    </button>
    <button 
      v-if="step < totalSteps" 
      @click="$emit('next')" 
      :disabled="!canAdvance"
      class="flex-[2] px-8 py-5 bg-blue-600 text-white font-bold rounded-3xl shadow-lg shadow-blue-100 disabled:opacity-50 disabled:shadow-none hover:scale-[1.02] active:scale-95 transition-all"
    >
      Próximo
    </button>
    <button 
      v-else 
      @click="$emit('finish')" 
      class="flex-[2] px-8 py-5 bg-green-600 text-white font-bold rounded-3xl shadow-lg shadow-green-100 hover:scale-[1.02] active:scale-95 transition-all"
    >
      Salvar
    </button>
  </div>
</template>
