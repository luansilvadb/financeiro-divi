<script setup lang="ts">
import { Clock } from 'lucide-vue-next'
import { Gasto } from '../../modules/ledger/core/domain/Gasto'
import { computed } from 'vue'

interface Props {
  gastos: Gasto[]
  membros: { id: string; nome: string }[]
  isMonthLocked: boolean
}

const props = defineProps<Props>()
const emit = defineEmits(['desfazerGasto', 'ajustarGasto'])

const sortedGastos = computed(() => {
  return [...props.gastos].sort((a, b) => b.id.localeCompare(a.id)) // Ordenação estável descendente
})

const getMembroNome = (id: string) => {
  return props.membros.find(m => m.id === id)?.nome || id
}

const handleDelete = (id: string) => {
  if (confirm('Deseja realmente apagar/desfazer este lançamento?')) {
    emit('desfazerGasto', id)
  }
}
</script>

<template>
  <div class="glass-card border border-divi-border rounded-3xl p-5 shadow-lg text-divi-t1">
    <div class="flex justify-between items-center border-b border-divi-border pb-3 mb-4">
      <h3 class="text-xs font-black uppercase text-divi-t2 tracking-wider flex items-center gap-1.5">
        <Clock class="w-3.5 h-3.5 text-divi-primary text-glow-primary" /> Lançamentos Recentes
      </h3>
      <span class="text-[9px] bg-divi-s2 border border-divi-border text-divi-t2 font-bold px-2 py-0.5 rounded-full">
        {{ sortedGastos.length }} registros
      </span>
    </div>

    <div v-if="sortedGastos.length === 0" class="text-center py-6 text-xs text-divi-t3">
      Nenhum lançamento no período ativo.
    </div>

    <div v-else class="space-y-3 max-h-[384px] overflow-y-auto pr-1">
      <div 
        v-for="g in sortedGastos" 
        :key="g.id"
        class="flex flex-col p-3.5 rounded-2xl bg-divi-s1/20 border border-white/5 hover:border-divi-primary/30 transition-all space-y-3"
      >
        <div class="flex justify-between items-start gap-2">
          <div>
            <span class="font-extrabold text-xs text-divi-t1 block">{{ g.descricao }}</span>
            <span class="text-[9.5px] text-divi-t3 block mt-1 uppercase tracking-wider font-semibold">
              {{ g.isLoan ? '🤝 Empréstimo' : g.isSettlement ? '🔄 Acerto' : g.method === 'card' ? '💳 Cartão' : '💵 Pix' }} • 
              Pago por: <strong class="text-divi-t2">{{ getMembroNome(g.compradorId) }}</strong>
            </span>
          </div>
          <strong class="text-xs font-black text-glow-primary text-divi-primary shrink-0">
            R$ {{ (g.valorTotal.centavos / 100).toFixed(2).replace('.', ',') }}
          </strong>
        </div>

        <!-- Ações do Feed -->
        <div class="flex justify-end gap-2 border-t border-white/5 pt-2.5">
          <button 
            v-if="!g.isSettlement"
            type="button"
            @click="emit('ajustarGasto', g.id)"
            :disabled="props.isMonthLocked"
            class="px-3 py-1.5 text-[9.5px] font-black bg-divi-primary/10 hover:bg-divi-primary/20 text-divi-primary rounded-lg border border-divi-primary/20 transition-all disabled:opacity-40"
          >
            ✏️ Ajustar
          </button>
          <button 
            type="button"
            @click="handleDelete(g.id)"
            :disabled="props.isMonthLocked"
            class="px-3 py-1.5 text-[9.5px] font-black bg-divi-rose/10 hover:bg-divi-rose/20 text-divi-rose rounded-lg border border-divi-rose/20 transition-all disabled:opacity-40"
          >
            🗑️ Desfazer
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
