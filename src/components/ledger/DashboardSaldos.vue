<script setup lang="ts">
import { computed } from 'vue'
import { User, ArrowRight, PlusCircle, TrendingUp, TrendingDown } from 'lucide-vue-next'
import { Dinheiro } from '../../shared/primitives/Dinheiro'
import { CalculadoraSaldos, type Acerto } from '../../modules/ledger/core/services/CalculadoraSaldos'

interface Props {
  saldos: Map<string, Dinheiro>
  membros: { id: string; nome: string }[]
}

const props = defineProps<Props>()
const emit = defineEmits(['novo-lancamento'])

const getMembroNome = (id: string) => {
  return props.membros.find(m => m.id === id)?.nome || id
}

const acertos = computed(() => {
  return CalculadoraSaldos.calcularAcertos(props.saldos)
})

const saldosList = computed(() => {
  return props.membros.map(m => ({
    id: m.id,
    nome: m.nome,
    saldo: props.saldos.get(m.id) || Dinheiro.deCentavos(0)
  })).sort((a, b) => b.saldo.centavos - a.saldo.centavos)
})

const formatarDinheiro = (valor: Dinheiro) => {
  const absoluteValue = Math.abs(valor.centavos / 100).toFixed(2)
  return `R$ ${absoluteValue}`
}
</script>

<template>
  <div class="max-w-md mx-auto space-y-6">
    <!-- Header/Resumo -->
    <div class="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-bold text-gray-800">Saldos</h2>
        <button 
          @click="emit('novo-lancamento')"
          class="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-full font-medium hover:bg-blue-700 transition shadow-sm"
        >
          <PlusCircle class="w-5 h-5" />
          Novo
        </button>
      </div>

      <div class="space-y-4">
        <div 
          v-for="item in saldosList" 
          :key="item.id"
          class="flex items-center justify-between p-3 rounded-xl bg-gray-50"
        >
          <div class="flex items-center gap-3">
            <div :class="['p-2 rounded-full', item.saldo.centavos >= 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600']">
              <User class="w-5 h-5" />
            </div>
            <span class="font-medium text-gray-700">{{ item.nome }}</span>
          </div>
          <div class="text-right">
            <div :class="['font-bold text-lg', item.saldo.centavos >= 0 ? 'text-green-600' : 'text-red-600']">
              {{ item.saldo.centavos > 0 ? '+' : '' }}{{ formatarDinheiro(item.saldo) }}
            </div>
            <div class="text-xs text-gray-400 uppercase font-semibold">
              {{ item.saldo.centavos >= 0 ? 'A receber' : 'A pagar' }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Acertos (Quem paga quem) -->
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
  </div>
</template>
