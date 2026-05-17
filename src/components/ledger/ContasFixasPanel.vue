<template>
  <div class="acrylic-card p-5 rounded-f-md mt-5 relative text-fluent-text-p1">
    <div class="flex justify-between items-center mb-4">
      <div>
        <h3 class="text-xs font-bold text-fluent-text-p1 flex items-center gap-1.5 uppercase tracking-wider">
          ⚙️ Checklist de Contas Fixas
        </h3>
        <p class="text-[10px] text-fluent-text-p3 mt-0.5 leading-normal">
          Lançamentos recorrentes simplificados.
        </p>
      </div>
      <span class="text-[10px] font-semibold text-fluent-accent bg-fluent-tint-blue px-2 py-1 rounded-f-sm border border-fluent-accent/15 shrink-0 whitespace-nowrap">
        {{ pagasCount }}/{{ contasFixas.length }} pagas
      </span>
    </div>

    <div class="grid grid-cols-1 gap-2.5">
      <!-- Widgets de Contas Fixas -->
      <div 
        v-for="bill in contasFixas" 
        :key="bill.id" 
        class="flex items-center justify-between p-3 rounded-f-sm border transition-all duration-200"
        :class="verificarPaga(bill) ? 'bg-fluent-emerald-dim/40 border-fluent-emerald/15 text-fluent-text-p1' : 'bg-white/20 border-black/5 text-fluent-text-p2'"
      >
        <div class="flex items-center gap-2.5 min-w-0 flex-1">
          <span class="text-2xl shrink-0">{{ bill.icon }}</span>
          <div class="min-w-0 flex-1">
            <span class="font-bold text-xs block text-fluent-text-p1 truncate">{{ bill.name }}</span>
            <span v-if="verificarPaga(bill)" class="text-[9px] text-fluent-emerald flex items-center gap-1 mt-0.5 font-semibold leading-none">
              ✓ Pago (R$ {{ obterStatusGasto(bill)?.valorReal.toFixed(2).replace('.', ',') }} por {{ obterNomeMembro(obterStatusGasto(bill)?.pagoPor) }})
            </span>
            <span v-else class="text-[9px] text-fluent-text-p3 flex items-center gap-1 mt-0.5 leading-none">
              ⏳ Aguardando Talão
            </span>
          </div>
        </div>
        <div class="flex items-center gap-1.5 shrink-0 ml-2">
          <button 
            v-if="!verificarPaga(bill)" 
            @click="$emit('lancar', bill)" 
            class="px-2.5 py-1 text-[10px] font-semibold bg-fluent-accent hover:bg-fluent-accent-hover text-white rounded-f-sm transition-all shadow-sm"
            :disabled="isMonthLocked"
          >
            Lançar
          </button>
          <button 
            @click="$emit('configurar', bill)" 
            class="p-1 text-xs bg-white/50 hover:bg-white text-fluent-text-p3 hover:text-fluent-text-p1 rounded-f-sm border border-black/10 transition-all shadow-sm"
          >
            ⚙️
          </button>
        </div>
      </div>

      <!-- Adicionar Nova Conta (Estilo Fluent 2) -->
      <button 
        @click="$emit('novo')" 
        class="border border-dashed border-black/10 hover:border-fluent-accent/40 bg-white/20 hover:bg-white/40 rounded-f-sm flex justify-center items-center gap-1.5 p-3 text-fluent-accent font-bold text-[10px] uppercase tracking-wider transition-all"
      >
        <span>+ Adicionar Conta Fixa</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ContaFixa } from '../../modules/ledger/core/domain/ContaFixa'
import { Gasto } from '../../modules/ledger/core/domain/Gasto'

const props = defineProps<{
  contasFixas: ContaFixa[]
  gastos: Gasto[]
  membros: { id: string; nome: string }[]
  isMonthLocked: boolean
}>()

const pagasCount = computed(() => {
  return props.contasFixas.filter(c => verificarPaga(c)).length
})

const verificarPaga = (conta: ContaFixa) => {
  return props.gastos.some(g => g.recurringBillId === conta.id)
}

const obterStatusGasto = (conta: ContaFixa) => {
  const g = props.gastos.find(g => g.recurringBillId === conta.id)
  if (!g) return null
  return {
    valorReal: g.valorTotal.centavos / 100,
    pagoPor: g.compradorId
  }
}

const obterNomeMembro = (id?: string) => {
  return props.membros.find(m => m.id === id)?.nome || id
}
</script>
