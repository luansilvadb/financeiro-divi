<script setup lang="ts">
import { Clock, Edit3, Trash2 } from 'lucide-vue-next'
import { Gasto } from '../../modules/ledger/core/domain/Gasto'
import { computed } from 'vue'
import Card from '../ui/Card.vue'
import Button from '../ui/Button.vue'

interface Props {
  gastos: Gasto[]
  membros: { id: string; nome: string }[]
  isMonthLocked: boolean
}

const props = defineProps<Props>()
const emit = defineEmits(['desfazerGasto', 'ajustarGasto'])

const sortedGastos = computed(() => {
  return [...props.gastos].sort((a, b) => b.id.localeCompare(a.id))
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
  <Card class="p-8 shadow-subtle bg-card rounded-cards">
    <div class="flex justify-between items-center mb-6">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-full bg-ember/5 flex items-center justify-center">
          <Clock class="w-5 h-5 text-ember" />
        </div>
        <div>
          <h3 class="text-sm font-bold text-charcoal uppercase tracking-widest">Registros Recentes</h3>
          <p class="text-[10px] text-ash font-semibold uppercase tracking-wider mt-0.5">
            {{ sortedGastos.length }} movimentações
          </p>
        </div>
      </div>
    </div>

    <div v-if="sortedGastos.length === 0" class="text-center py-16 border border-dashed border-stone rounded-xl space-y-4 bg-canvas/30">
      <!-- Mascote Azul Celeste com Lupa -->
      <svg viewBox="0 0 100 100" class="w-20 h-20 mx-auto animate-pulse" style="animation-duration: 4s;">
        <!-- Corpo Blob Celeste -->
        <path d="M20,40 Q30,10 60,15 Q90,20 80,60 Q70,90 40,80 Q10,70 20,40 Z" fill="var(--color-sky-blue)" />
        <!-- Olhinhos -->
        <circle cx="45" cy="45" r="4.5" fill="#000" />
        <circle cx="65" cy="45" r="4.5" fill="#000" />
        <!-- Boca Curva Decepção/Espera -->
        <path d="M48,58 Q55,54 62,58" stroke="#000" stroke-width="3" stroke-linecap="round" fill="none" />
        <!-- Lupa nas Mãozinhas -->
        <circle cx="30" cy="65" r="10" fill="none" stroke="#000" stroke-width="3" />
        <line x1="37" y1="72" x2="48" y2="83" stroke="#000" stroke-width="3.5" stroke-linecap="round" />
        <!-- Perninhas de Palito -->
        <line x1="38" y1="80" x2="28" y2="95" stroke="#000" stroke-width="3" stroke-linecap="round" />
        <line x1="62" y1="80" x2="72" y2="95" stroke="#000" stroke-width="3" stroke-linecap="round" />
      </svg>
      <div class="space-y-1">
        <p class="text-xs font-bold text-charcoal uppercase tracking-wider">Tudo deserto por aqui</p>
        <p class="text-[11px] text-ash max-w-[220px] mx-auto leading-normal">
          Nenhum gasto ou acerto registrado neste período ainda.
        </p>
      </div>
    </div>

    <div v-else class="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
      <div 
        v-for="g in sortedGastos" 
        :key="g.id"
        class="group flex flex-col p-4 rounded-xl border border-stone bg-canvas hover:border-ember/30 transition-all duration-200 space-y-4"
      >
        <div class="flex justify-between items-start gap-4">
          <div class="space-y-1">
            <span class="font-bold text-sm text-charcoal block">{{ g.descricao }}</span>
            <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span class="text-[10px] font-bold text-ember uppercase tracking-wider">
                {{ g.isLoan ? '🤝 Empréstimo' : g.isSettlement ? '🔄 Acerto' : g.method === 'card' ? '💳 Cartão' : '⚡ Pix' }}
              </span>
              <span class="text-[10px] text-ash">
                • Pago por <strong class="text-charcoal font-semibold">{{ getMembroNome(g.compradorId) }}</strong>
              </span>
            </div>
          </div>
          <div class="text-right">
            <span class="font-display text-lg text-charcoal">
              R$ {{ (g.valorTotal.centavos / 100).toFixed(2).replace('.', ',') }}
            </span>
          </div>
        </div>

        <!-- Ações do Feed -->
        <div class="flex justify-end gap-2 pt-3 border-t border-stone opacity-0 group-hover:opacity-100 transition-opacity">
          <Button 
            v-if="!g.isSettlement"
            variant="secondary"
            size="sm"
            class="h-8 px-3 text-[10px] border border-stone-surface"
            @click="emit('ajustarGasto', g.id)"
            :disabled="props.isMonthLocked"
          >
            <Edit3 class="w-3.5 h-3.5 mr-1.5" />
            Ajustar
          </Button>
          <Button 
            variant="secondary"
            size="sm"
            class="h-8 px-3 text-[10px] text-coral-red hover:bg-[#fff0f0] border border-transparent"
            @click="handleDelete(g.id)"
            :disabled="props.isMonthLocked"
          >
            <Trash2 class="w-3.5 h-3.5 mr-1.5" />
            Excluir
          </Button>
        </div>
      </div>
    </div>
  </Card>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: var(--color-border);
  border-radius: 9999px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: rgba(203, 213, 225, 0.3);
}
</style>
