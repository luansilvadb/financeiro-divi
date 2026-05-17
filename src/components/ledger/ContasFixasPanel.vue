<script setup lang="ts">
import { computed } from 'vue'
import type { ContaFixa } from '../../modules/ledger/core/domain/ContaFixa'
import { Gasto } from '../../modules/ledger/core/domain/Gasto'
import { Plus, Settings } from 'lucide-vue-next'

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

<template>
  <div class="contas-fixas-card bg-white p-[18px] rounded-[10px] shadow-[inset_0_0_0_1px_#f2f0ed] text-[#474645]">
    <div class="flex justify-between items-start gap-3 mb-3.5">
      <div class="min-w-0">
        <h3 class="text-[15px] leading-tight font-semibold text-[#343433] tracking-[-0.2px]">
          Contas fixas
        </h3>
        <p class="text-xs leading-snug text-[#848281] mt-1">
          Recorrentes do mes.
        </p>
      </div>
      <span class="shrink-0 text-xs font-semibold text-[#121212] bg-[#f6f4ef] px-3 py-1.5 rounded-full">
        {{ pagasCount }}/{{ contasFixas.length }} pagas
      </span>
    </div>

    <div class="grid grid-cols-1 gap-2">
      <div v-if="contasFixas.length === 0" class="text-center py-8 px-4 border border-dashed border-[#c6c6c6] rounded-[10px] bg-[#f8f7f4]">
        <p class="text-sm font-semibold text-[#343433] tracking-[-0.17px]">Nenhuma conta agendada</p>
        <p class="text-xs text-[#848281] max-w-[260px] mx-auto leading-snug mt-1">
          Cadastre aluguel, luz ou internet para lancamentos recorrentes rapidos.
        </p>
      </div>

      <template v-else>
        <div
          v-for="bill in contasFixas"
          :key="bill.id"
          class="flex items-center justify-between gap-2.5 p-2.5 rounded-[10px] bg-[#f8f7f4] transition-colors duration-200 hover:bg-[#f2f0ed]"
        >
          <div class="flex items-center gap-2.5 min-w-0">
            <div class="w-[34px] h-[34px] shrink-0 rounded-full bg-white shadow-[inset_0_0_0_1px_#f2f0ed] flex items-center justify-center text-base">
              {{ bill.icon }}
            </div>
            <div class="min-w-0 flex-1">
              <span class="font-semibold text-[13px] leading-tight block text-[#343433] tracking-[-0.17px] truncate">{{ bill.name }}</span>
              <span v-if="verificarPaga(bill)" class="text-[11px] text-[#848281] flex items-center gap-1.5 mt-1 truncate">
                <span class="w-2 h-2 rounded-full bg-[#00ca48] shrink-0"></span>
                R$ {{ obterStatusGasto(bill)?.valorReal.toFixed(2).replace('.', ',') }} por {{ obterNomeMembro(obterStatusGasto(bill)?.pagoPor) }}
              </span>
              <span v-else class="text-[11px] text-[#848281] flex items-center gap-1.5 mt-1">
                <span class="w-2 h-2 rounded-full bg-[#ffbb26] shrink-0"></span>
                Aguardando talao
              </span>
            </div>
          </div>

          <div class="flex items-center gap-1.5 shrink-0">
            <button
              v-if="!verificarPaga(bill)"
              @click="$emit('lancar', bill)"
              class="px-3 py-2 text-xs font-semibold bg-[#121212] hover:bg-[#343433] text-white rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              :disabled="isMonthLocked"
              :data-testid="`lancar-conta-${bill.id}`"
            >
              Lancar
            </button>
            <button
              @click="$emit('configurar', bill)"
              class="w-[30px] h-[30px] flex items-center justify-center text-[#848281] hover:text-[#343433] bg-white rounded-full shadow-[inset_0_0_0_1px_#f2f0ed] transition-colors"
              :data-testid="`configurar-conta-${bill.id}`"
              :aria-label="`Configurar ${bill.name}`"
              title="Configurar conta"
            >
              <Settings class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </template>

      <button
        @click="$emit('novo')"
        class="group flex justify-center items-center gap-2 p-3 rounded-[10px] border border-dashed border-[#c6c6c6] hover:border-[#474645] hover:bg-[#f8f7f4] transition-colors duration-200 text-[#474645] font-semibold text-xs mt-1"
        data-testid="nova-conta-fixa"
      >
        <Plus class="w-3.5 h-3.5" />
        <span>Adicionar conta fixa</span>
      </button>
    </div>
  </div>
</template>
