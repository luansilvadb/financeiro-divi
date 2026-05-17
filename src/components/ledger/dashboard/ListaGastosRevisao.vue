<script setup lang="ts">
import { Gasto } from '../../../modules/ledger/core/domain/Gasto'

interface Props {
  gastos: Gasto[]
  membros: { id: string; nome: string }[]
}

const props = defineProps<Props>()
const emit = defineEmits(['editarRateio'])

const getCompradorNome = (id: string) => {
  return props.membros.find(m => m.id === id)?.nome || 'Outro'
}

const formatarDivisao = (g: Gasto) => {
  if (g.divisoes.length === 1) {
    return `100% para ${getCompradorNome(g.divisoes[0].membroId)}`
  }
  if (g.divisoes.length === props.membros.length) {
    // Testa se todos pagam igual
    const todosIguais = g.divisoes.every((d, _, arr) => d.valor.centavos === arr[0].valor.centavos)
    if (todosIguais) return 'Dividido igualmente entre todos'
  }
  return `Dividido entre ${g.divisoes.length} pessoas`
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex justify-between items-center border-b border-slate-100 pb-2">
      <span class="text-xs font-black uppercase text-gray-400 tracking-wider">Itens da Fatura (Extrato)</span>
      <span class="text-xs text-gray-400 font-bold bg-slate-100 px-2.5 py-1 rounded-full">{{ props.gastos.length }} compras</span>
    </div>

    <div v-if="props.gastos.length === 0" class="text-center py-10 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
      <span class="text-3xl block mb-2">🛒</span>
      <strong class="text-sm text-gray-600 block">Nenhuma compra registrada nesta fatura.</strong>
    </div>

    <div v-else class="space-y-3">
      <div 
        v-for="g in props.gastos" 
        :key="g.id"
        class="flex justify-between items-center bg-white border border-slate-100/80 hover:border-blue-200 hover:shadow-sm p-4 rounded-2xl transition-all group"
      >
        <div class="flex items-center gap-4 flex-1 min-w-0">
          <!-- Avatar Comprador -->
          <div 
            v-tooltip="getCompradorNome(g.compradorId)"
            class="w-10 h-10 rounded-full bg-blue-50 text-blue-700 font-black text-xs flex items-center justify-center border border-blue-100 shadow-sm shrink-0"
          >
            {{ getCompradorNome(g.compradorId)[0].toUpperCase() }}
          </div>

          <!-- Dados do Gasto -->
          <div class="min-w-0 flex-1">
            <div class="flex items-baseline gap-2">
              <strong class="text-sm font-bold text-gray-800 truncate">{{ g.descricao }}</strong>
            </div>
            <span class="text-[10px] text-gray-400 font-medium block mt-0.5">{{ formatarDivisao(g) }}</span>
          </div>
        </div>

        <!-- Valor e Acoes -->
        <div class="flex items-center gap-4 shrink-0">
          <div class="text-right">
            <strong class="text-sm font-black text-gray-800">R$ {{ (g.valorTotal.centavos / 100).toFixed(2).replace('.', ',') }}</strong>
          </div>

          <button 
            type="button"
            @click="emit('editarRateio', g)"
            class="px-3 py-2 bg-slate-50 hover:bg-blue-50 hover:text-blue-600 border border-slate-100 hover:border-blue-200 rounded-xl text-[10px] font-black text-gray-500 transition-all active:scale-95"
          >
            ✂️ Ratear
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
