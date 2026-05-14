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
        class="h-full bg-blue-500 transition-all duration-500 ease-out"
        :style="{ width: `${(currentStep / totalSteps) * 100}%` }"
      ></div>
    </div>
    <div class="text-[10px] uppercase font-bold text-gray-400 mb-4 text-center">
      Passo {{ currentStep }} de {{ totalSteps }}
    </div>
  </div>
</template>
