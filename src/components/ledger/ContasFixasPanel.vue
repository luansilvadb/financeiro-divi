<template>
  <div class="panel-card bg-panel-dark border border-white-05 p-6 rounded-3xl mt-6 relative text-white">
    <div class="flex justify-between items-center mb-6">
      <div>
        <h3 class="text-xl font-black text-white flex items-center gap-2">
          🏠 Checklist de Contas Fixas
        </h3>
        <p class="text-xs text-text-muted mt-1">
          Gerencie e lance de forma simples os talões do mês sem precisar de formulários longos
        </p>
      </div>
      <span class="text-sm font-semibold text-accent-yellow bg-yellow-10 p-2 rounded-xl border border-yellow-30">
        {{ pagasCount }}/{{ contasFixas.length }} pagas
      </span>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <!-- Cards de Contas Fixas -->
      <div 
        v-for="bill in contasFixas" 
        :key="bill.id" 
        class="flex items-center justify-between p-4 rounded-2xl border transition-all duration-200"
        :class="verificarPaga(bill) ? 'bg-emerald-05 border-emerald-30 text-white' : 'bg-panel-light border-white-05 text-text-dim'"
      >
        <div class="flex items-center gap-3">
          <span class="text-3xl">{{ bill.icon }}</span>
          <div>
            <span class="font-extrabold text-sm block text-white">{{ bill.name }}</span>
            <span v-if="verificarPaga(bill)" class="text-xs text-accent-emerald flex items-center gap-1 mt-1 font-bold">
              ✅ Pago (R$ {{ obterStatusGasto(bill)?.valorReal.toFixed(2) }} por {{ obterNomeMembro(obterStatusGasto(bill)?.pagoPor) }})
            </span>
            <span v-else class="text-xs text-accent-yellow flex items-center gap-1 mt-1 font-bold">
              ⏳ Aguardando Talão
            </span>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button 
            v-if="!verificarPaga(bill)" 
            @click="$emit('lancar', bill)" 
            class="px-4 py-2 text-xs font-black bg-accent-yellow hover:bg-yellow-400 text-green-950 rounded-xl transition-all"
            :disabled="isMonthLocked"
          >
            Lançar
          </button>
          <button 
            @click="$emit('configurar', bill)" 
            class="p-2 text-xs bg-white-06 hover:bg-white-12 text-text-dim hover:text-white rounded-xl border border-white-10 transition-all"
          >
            ⚙️
          </button>
        </div>
      </div>

      <!-- Adicionar Nova Conta -->
      <div 
        @click="$emit('novo')" 
        class="border-2 border-dashed border-white-12 hover:border-primary bg-white-01 hover:bg-primary-05 rounded-2xl flex justify-center items-center gap-2 p-4 cursor-pointer transition-all duration-200"
      >
        <span class="text-primary font-black text-sm">➕ Adicionar Conta Fixa</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ContaFixa } from '../../core/domain/ContaFixa'
import { Gasto } from '../../core/domain/Gasto'

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
