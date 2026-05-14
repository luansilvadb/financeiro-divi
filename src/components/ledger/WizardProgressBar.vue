<script setup lang="ts">
defineProps<{
  currentStep: number;
  totalSteps: number;
}>();
</script>

<template>
  <div>
    <div class="w-full h-1 bg-gray-100 mb-6 overflow-hidden rounded-full">
      <div 
        class="h-full bg-blue-500 transition-all duration-700 ease-in-out"
        :style="{ width: `${(currentStep / totalSteps) * 100}%` }"
      ></div>
    </div>
    <div class="text-[10px] uppercase font-black text-gray-400 mb-4 text-center tracking-widest">
      Passo {{ currentStep }} de {{ totalSteps }}
    </div>
  </div>
</template>
