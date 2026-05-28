<script setup lang="ts">
import type { ContaFixa } from '../../../models/entities/ContaFixa'
import type { Gasto } from '../../../models/entities/Gasto'
import { Repeat, Plus } from 'lucide-vue-next'
import Card from '../ui/Card.vue'
import ContasFixasCard from './ContasFixasCard.vue'

const props = defineProps<{
  contasFixas: ContaFixa[]
  gastos: Gasto[]
  membros: { id: string; nome: string }[]
  isMonthLocked: boolean
}>()

const emit = defineEmits<{
  (e: 'lancar', bill: ContaFixa): void
  (e: 'configurar', bill: ContaFixa): void
  (e: 'novo'): void
  (e: 'estornar', bill: ContaFixa): void
}>()

const verificarPaga = (conta: ContaFixa) => {
  return props.gastos.some(g => g.recurringBillId === conta.id)
}

const obterStatusGasto = (conta: ContaFixa) => {
  const g = props.gastos.find(g => g.recurringBillId === conta.id)
  if (!g) return null
  return {
    valorCentavos: g.valorTotal.centavos,
    pagoPor: g.compradorId
  }
}

const obterNomeMembro = (id?: string) => {
  return props.membros.find(m => m.id === id)?.nome || id
}

const handleClick = () => {
  if (props.isMonthLocked) return
  emit('novo')
}
</script>

<template>
  <Card class="p-0 overflow-hidden shadow-subtle bg-white text-graphite">
    <div class="py-7 px-6 border-b border-stone bg-parchment flex items-center">
      <div class="flex items-center gap-5">
        <div class="w-11 h-11 rounded-xl bg-midnight text-white flex items-center justify-center shadow-sm">
          <Repeat class="w-5 h-5" />
        </div>
        <div>
          <h3 class="font-bold text-lg leading-tight text-charcoal tracking-tight">Contas Fixas</h3>
          <p class="text-[11px] text-ash uppercase tracking-wider mt-0.5 font-medium">
            Recorrentes do mês
          </p>
        </div>
      </div>
    </div>

    <div class="p-6 grid gap-3">
      <div v-if="contasFixas.length === 0" class="text-center py-12 border border-dashed border-stone rounded-xl space-y-4 bg-canvas/30">
        <svg viewBox="0 0 100 100" class="w-20 h-20 mx-auto animate-bounce" style="animation-duration: 6s;">
          <path d="M15,50 Q20,15 50,20 Q80,25 85,55 Q90,85 50,80 Q10,75 15,50 Z" fill="var(--color-meadow)" />
          <circle cx="42" cy="45" r="4.5" fill="#000" />
          <circle cx="62" cy="45" r="4.5" fill="#000" />
          <path d="M46,56 Q52,62 58,56" stroke="#000" stroke-width="3" stroke-linecap="round" fill="none" />
          <rect x="25" y="62" width="18" height="22" rx="2" fill="#ffffff" stroke="#000" stroke-width="2" />
          <rect x="29" y="58" width="10" height="4" rx="1" fill="var(--color-ember)" stroke="#000" stroke-width="1.5" />
          <line x1="30" y1="69" x2="40" y2="69" stroke="#000" stroke-width="2" />
          <line x1="30" y1="75" x2="40" y2="75" stroke="#000" stroke-width="2" />
          <line x1="35" y1="78" x2="25" y2="92" stroke="#000" stroke-width="3" stroke-linecap="round" />
          <line x1="65" y1="78" x2="75" y2="92" stroke="#000" stroke-width="3" stroke-linecap="round" />
        </svg>
        <div class="space-y-1">
          <p class="text-xs font-bold text-charcoal uppercase tracking-wider">Nenhuma conta agendada</p>
          <p class="text-[11px] text-ash max-w-[240px] mx-auto leading-normal">
            Cadastre aluguel, luz ou internet para fazer lançamentos recorrentes rápidos.
          </p>
        </div>
      </div>

      <template v-else>
        <ContasFixasCard 
          v-for="bill in contasFixas" 
          :key="bill.id" 
          :bill="bill"
          :paga="verificarPaga(bill)"
          :status-gasto="obterStatusGasto(bill)"
          :obter-nome-membro="obterNomeMembro"
          :is-month-locked="isMonthLocked"
          @lancar="$emit('lancar', bill)"
          @estornar="$emit('estornar', bill)"
          @configurar="$emit('configurar', bill)"
        />
      </template>

      <div class="flex flex-col items-center gap-2 mt-2">
        <button
          @click="handleClick"
          :disabled="isMonthLocked"
          :class="[
            'relative overflow-hidden group w-full flex justify-center items-center gap-2 p-4 rounded-xl border border-dashed border-stone bg-transparent text-ash font-bold text-xs uppercase tracking-widest transition-all duration-300 select-none cursor-pointer',
            isMonthLocked ? 'opacity-40 cursor-not-allowed' : 'hover:border-ember hover:bg-ember/5 active:scale-[0.98]'
          ]"
          data-testid="nova-conta-fixa"
        >
          <Plus class="w-4 h-4 transition-transform group-hover:scale-110 text-ash group-hover:text-ember" />
          <span class="text-ash group-hover:text-ember font-bold text-xs uppercase tracking-widest">Adicionar conta fixa</span>
        </button>
        <p v-if="isMonthLocked" class="text-[9px] text-ash animate-in fade-in">
          Reabra o mês para gerenciar contas fixas
        </p>
      </div>
    </div>
  </Card>
</template>
