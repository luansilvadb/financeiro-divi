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
    <div class="flex justify-between items-center border-b border-divi-border pb-2">
      <span class="text-xs font-black uppercase text-divi-t2 tracking-wider">Itens da Fatura (Extrato)</span>
      <span class="text-xs text-divi-t2 font-bold bg-divi-s2 border border-divi-border px-2.5 py-1 rounded-full">{{ props.gastos.length }} compras</span>
    </div>

    <div v-if="props.gastos.length === 0" class="text-center py-10 bg-divi-s1/30 rounded-3xl border border-dashed border-divi-border">
      <span class="text-3xl block mb-2">🛒</span>
      <strong class="text-sm text-divi-t2 block">Nenhuma compra registrada nesta fatura.</strong>
    </div>

    <div v-else class="space-y-3">
      <div 
        v-for="g in props.gastos" 
        :key="g.id"
        class="flex justify-between items-center bg-divi-s1/50 border border-divi-border hover:border-divi-primary/45 p-4 rounded-2xl transition-all group hover:bg-divi-s1/80 hover:shadow-[0_0_12px_var(--primary-glow)] duration-150"
      >
        <div class="flex items-center gap-4 flex-1 min-w-0">
          <!-- Avatar Comprador -->
          <div 
            v-tooltip="getCompradorNome(g.compradorId)"
            class="w-10 h-10 rounded-full bg-divi-primary-dim/20 text-divi-primary font-black text-xs flex items-center justify-center border border-divi-primary/25 shadow-[0_0_8px_var(--primary-glow)] shrink-0"
          >
            {{ getCompradorNome(g.compradorId)[0].toUpperCase() }}
          </div>

          <!-- Dados do Gasto -->
          <div class="min-w-0 flex-1">
            <div class="flex items-baseline gap-2">
              <strong class="text-sm font-bold text-divi-t1 truncate">{{ g.descricao }}</strong>
            </div>
            <span class="text-[10px] text-divi-t2 font-medium block mt-0.5">{{ formatarDivisao(g) }}</span>
          </div>
        </div>

        <!-- Valor e Acoes -->
        <div class="flex items-center gap-4 shrink-0">
          <div class="text-right">
            <strong class="text-sm font-black text-divi-t1">R$ {{ (g.valorTotal.centavos / 100).toFixed(2).replace('.', ',') }}</strong>
          </div>

          <button 
            type="button"
            @click="emit('editarRateio', g)"
            class="px-3.5 py-2 bg-divi-s2 hover:bg-divi-primary hover:text-white border border-divi-border hover:border-indigo-400/25 rounded-xl text-[10px] font-black text-divi-t2 transition-all active:scale-95 hover:shadow-[0_0_12px_var(--primary-glow)] duration-150"
          >
            ✂️ Ratear
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
