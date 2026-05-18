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
  <div class="space-y-3">
    <div class="flex justify-between items-center border-b border-stone pb-2">
      <span class="text-xs font-bold uppercase text-ash tracking-wider">Itens da Fatura (Extrato)</span>
      <span class="text-[10px] text-charcoal font-bold bg-stone border border-stone px-2.5 py-0.5 rounded-full">{{ props.gastos.length }} compras</span>
    </div>

    <div v-if="props.gastos.length === 0" class="text-center py-8 bg-stone/30 rounded-card border border-dashed border-stone">
      <span class="text-2xl block mb-1">🛒</span>
      <strong class="text-xs text-ash block">Nenhuma compra registrada nesta fatura.</strong>
    </div>

    <div v-else class="space-y-2">
      <div 
        v-for="g in props.gastos" 
        :key="g.id"
        class="flex justify-between items-center bg-canvas border border-stone hover:border-ember/30 p-3 rounded-card transition-all group hover:bg-white duration-150"
      >
        <div class="flex items-center gap-2.5 flex-1 min-w-0">
          <!-- Avatar Compacto -->
          <div 
            class="w-8 h-8 rounded-full bg-stone text-charcoal font-bold text-xs flex items-center justify-center border border-stone shrink-0"
          >
            {{ getCompradorNome(g.compradorId)[0].toUpperCase() }}
          </div>

          <!-- Dados do Gasto -->
          <div class="min-w-0 flex-1">
            <div class="flex items-baseline gap-2">
              <strong class="text-xs font-bold text-charcoal truncate leading-tight">{{ g.descricao }}</strong>
            </div>
            <span class="text-[9px] text-ash font-medium block mt-0.5">{{ formatarDivisao(g) }}</span>
          </div>
        </div>

        <!-- Valor e Ações -->
        <div class="flex items-center gap-3 shrink-0">
          <div class="text-right">
            <strong class="text-xs font-bold text-charcoal">R$ {{ (g.valorTotal.centavos / 100).toFixed(2).replace('.', ',') }}</strong>
          </div>

          <button 
            type="button"
            @click="emit('editarRateio', g)"
            class="px-3 py-1.5 bg-stone hover:bg-stone border border-stone rounded-pill text-[9px] font-semibold text-midnight transition-all active:scale-95 duration-150"
          >
            ✂️ Ratear
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
