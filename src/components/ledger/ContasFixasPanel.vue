<template>
  <div class="glass-card rounded-3xl p-6 mt-6 relative text-divi-t1 shadow-2xl">
    <div class="flex justify-between items-center mb-6">
      <div>
        <h3 class="text-xl font-black text-divi-t1 flex items-center gap-2">
          🏠 Checklist de Contas Fixas
        </h3>
        <p class="text-xs text-divi-t3 mt-1 leading-normal">
          Gerencie e lance de forma simples os talões do mês sem precisar de formulários longos
        </p>
      </div>
      <span class="text-[11px] font-black text-divi-amber bg-divi-amber-dim/20 px-3 py-1.5 rounded-xl border border-divi-amber/30 uppercase tracking-wider">
        {{ pagasCount }}/{{ contasFixas.length }} pagas
      </span>
    </div>

    <div class="grid grid-cols-1 gap-4">
      <!-- Cards de Contas Fixas -->
      <div 
        v-for="bill in contasFixas" 
        :key="bill.id" 
        class="flex items-center justify-between p-4 rounded-2xl border transition-all duration-200"
        :class="verificarPaga(bill) ? 'bg-divi-emerald-dim/15 border-divi-emerald/25 text-divi-t1' : 'bg-divi-s1 border-divi-border text-divi-t2'"
      >
        <div class="flex items-center gap-3">
          <span class="text-3xl">{{ bill.icon }}</span>
          <div>
            <span class="font-extrabold text-sm block text-divi-t1">{{ bill.name }}</span>
            <span v-if="verificarPaga(bill)" class="text-xs text-divi-emerald flex items-center gap-1 mt-1 font-bold">
              ✅ Pago (R$ {{ obterStatusGasto(bill)?.valorReal.toFixed(2) }} por {{ obterNomeMembro(obterStatusGasto(bill)?.pagoPor) }})
            </span>
            <span v-else class="text-xs text-divi-amber flex items-center gap-1 mt-1 font-bold">
              ⏳ Aguardando Talão
            </span>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button 
            v-if="!verificarPaga(bill)" 
            @click="$emit('lancar', bill)" 
            class="px-4 py-2 text-xs font-black bg-divi-amber hover:bg-yellow-500 text-slate-950 rounded-xl transition-all shadow-[0_0_10px_rgba(245,158,11,0.2)]"
            :disabled="isMonthLocked"
          >
            Lançar
          </button>
          <button 
            @click="$emit('configurar', bill)" 
            class="p-2 text-xs bg-divi-s2 hover:bg-divi-s3 text-divi-t2 hover:text-divi-t1 rounded-xl border border-divi-border transition-all"
          >
            ⚙️
          </button>
        </div>
      </div>

      <!-- Adicionar Nova Conta -->
      <div 
        @click="$emit('novo')" 
        class="border border-dashed border-divi-border hover:border-divi-primary bg-divi-s1/50 hover:bg-divi-primary-dim/15 rounded-2xl flex justify-center items-center gap-2 p-4 cursor-pointer transition-all duration-200"
      >
        <span class="text-divi-primary font-black text-xs uppercase tracking-wider">➕ Adicionar Conta Fixa</span>
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
