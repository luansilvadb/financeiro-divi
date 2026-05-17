<script setup lang="ts">
import { TrendingUp, ArrowRight } from 'lucide-vue-next'
import { Dinheiro } from '../../../shared/primitives/Dinheiro'
import type { Acerto } from '../../../modules/ledger/core/services/CalculadoraSaldos'

interface Props {
  acertos: Acerto[]
  getMembroNome: (id: string) => string
}

defineProps<Props>()

const formatarDinheiro = (valor: Dinheiro) => {
  return valor.formatar()
}
</script>

<template>
  <div v-if="acertos.length > 0" class="bg-blue-50 rounded-2xl p-6 border border-blue-100">
    <h3 class="text-blue-800 font-bold mb-4 flex items-center gap-2">
      <TrendingUp class="w-5 h-5" />
      Como acertar as contas
    </h3>
    
    <div class="space-y-3">
      <div 
        v-for="(acerto, index) in acertos" 
        :key="index"
        class="flex items-center gap-3 bg-white p-3 rounded-xl shadow-sm border border-blue-50"      
      >
        <div class="flex-1 text-sm font-medium text-gray-600">
          <span class="text-gray-900 font-bold">{{ getMembroNome(acerto.de) }}</span>
        </div>
        <div class="flex flex-col items-center px-2">
          <ArrowRight class="w-4 h-4 text-blue-400" />
          <span class="text-[10px] font-bold text-blue-500 uppercase">{{ formatarDinheiro(acerto.valor) }}</span>
        </div>
        <div class="flex-1 text-right text-sm font-medium text-gray-600">
          <span class="text-gray-900 font-bold">{{ getMembroNome(acerto.para) }}</span>
        </div>
      </div>
    </div>
  </div>

  <div v-else class="text-center py-8 text-gray-400 italic">
    Tudo zerado! Ninguém deve nada.
  </div>
</template>
