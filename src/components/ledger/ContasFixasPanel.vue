<template>
  <div class="glass-card rounded-[24px] p-4 mt-4 relative text-divi-t1 shadow-lg">
    <!-- Glow Decorativo superior -->
    <div class="absolute -top-10 -right-10 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl"></div>

    <div class="flex justify-between items-center gap-3 mb-4 relative z-10">
      <div class="min-w-0 flex-1">
        <h3 class="text-sm font-black text-divi-t1 flex items-center gap-1.5">
          🏠 Checklist de Contas Fixas
        </h3>
        <p class="text-[10px] text-divi-t3 mt-0.5 leading-normal">
          Gerencie e lance de forma simples os talões do mês sem precisar de formulários longos
        </p>
      </div>
      <span class="text-[9px] font-black text-divi-amber bg-divi-amber-dim/15 px-2.5 py-1.5 rounded-xl border border-divi-amber/20 uppercase tracking-widest shrink-0 whitespace-nowrap shadow-[0_0_8px_rgba(245,158,11,0.05)]">
        {{ pagasCount }}/{{ contasFixas.length }} pagas
      </span>
    </div>

    <div class="grid grid-cols-1 gap-2.5 relative z-10">
      <!-- Cards de Contas Fixas -->
      <div 
        v-for="bill in contasFixas" 
        :key="bill.id" 
        class="flex items-center justify-between p-3 rounded-2xl border transition-all duration-150"
        :class="verificarPaga(bill) 
          ? 'bg-divi-emerald-dim/10 border-divi-emerald/25 text-divi-t1 shadow-[0_0_12px_rgba(16,185,129,0.03)]' 
          : 'bg-divi-s1/40 border-divi-border/40 text-divi-t2 hover:bg-divi-s1/60'"
      >
        <div class="flex items-center gap-2.5 min-w-0 flex-1">
          <span class="text-2xl shrink-0">{{ bill.icon }}</span>
          <div class="min-w-0 flex-1">
            <span class="font-bold text-xs block text-divi-t1 truncate leading-tight">{{ bill.name }}</span>
            <span v-if="verificarPaga(bill)" class="text-[9px] text-divi-emerald flex items-center gap-1 mt-0.5 font-bold leading-none">
              ✅ Pago (R$ {{ obterStatusGasto(bill)?.valorReal.toFixed(2).replace('.', ',') }} por {{ obterNomeMembro(obterStatusGasto(bill)?.pagoPor) }})
            </span>
            <span v-else class="text-[9px] text-divi-amber flex items-center gap-1 mt-0.5 font-bold leading-none">
              ⏳ Aguardando Talão
            </span>
          </div>
        </div>
        <div class="flex items-center gap-1.5 shrink-0 ml-2">
          <button 
            v-if="!verificarPaga(bill)" 
            @click="$emit('lancar', bill)" 
            class="px-3 py-1.5 text-[9px] font-black bg-divi-amber hover:bg-yellow-500 text-slate-950 rounded-xl transition-all shadow-[0_0_10px_rgba(245,158,11,0.2)] active:scale-95"
            :disabled="isMonthLocked"
          >
            Lançar
          </button>
          <button 
            @click="$emit('configurar', bill)" 
            class="p-1.5 text-[10px] bg-divi-s2 hover:bg-divi-s3 text-divi-t2 hover:text-divi-t1 rounded-xl border border-divi-border transition-all active:scale-95"
          >
            ⚙️
          </button>
        </div>
      </div>

      <!-- Adicionar Nova Conta -->
      <div 
        @click="$emit('novo')" 
        class="border border-dashed border-divi-border/60 hover:border-divi-primary bg-divi-s1/30 hover:bg-divi-primary-dim/15 rounded-2xl flex justify-center items-center gap-1.5 p-3.5 cursor-pointer transition-all duration-150 group active:scale-[0.99]"
      >
        <span class="text-divi-primary font-black text-[10px] uppercase tracking-wider group-hover:text-indigo-400 transition-colors">➕ Adicionar Conta Fixa</span>
      </div>
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
