<script setup lang="ts">
import { Dinheiro } from '../../../shared/primitives/Dinheiro'

interface ItemExtrato {
  id: string
  descricao: string
  data: Date
  valorPago: Dinheiro
  valorConsumido: Dinheiro
  valorLiquido: Dinheiro
  saldoAcumulado: Dinheiro
}

defineProps<{
  item: ItemExtrato
}>()

const formatDataCurta = (date: Date) => {
  return new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).toUpperCase()
}

const formatarDinheiro = (valor: Dinheiro) => {
  return valor.formatar()
}
</script>

<template>
  <div class="bg-[#FAFAFA] rounded-[24px] shadow-sm border border-slate-100 relative overflow-hidden flex flex-col mb-4">
    <!-- Borda Semântica Lateral -->
    <div :class="['absolute top-0 left-0 w-1.5 h-full', 
                   item.valorLiquido.centavos > 0 ? 'bg-emerald-500' : (item.valorLiquido.centavos === 0 ? 'bg-slate-300' : 'bg-red-500')]"></div>

    <div class="p-6 pb-4 flex justify-between items-center">
      <div class="flex-1">
        <h2 class="text-[17px] font-bold text-slate-800 leading-tight">{{ item.descricao }}</h2>
        <span :class="['inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-black mt-2 uppercase tracking-tighter border',
                        item.valorLiquido.centavos > 0 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                        (item.valorLiquido.centavos === 0 ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-red-50 text-red-600 border-red-100')]">
          {{ item.valorLiquido.centavos > 0 ? 'CRÉDITO' : (item.valorLiquido.centavos === 0 ? 'NEUTRO' : 'DÉBITO') }}
        </span>
      </div>
      <div class="text-right">
        <div :class="['text-2xl font-mono font-black tracking-tighter', 
                      item.valorLiquido.centavos > 0 ? 'text-emerald-600' : (item.valorLiquido.centavos === 0 ? 'text-slate-400' : 'text-red-600')]">
          {{ item.valorLiquido.centavos > 0 ? '+' : '' }}{{ formatarDinheiro(item.valorLiquido).replace('R$', '').trim() }}
        </div>
        <p class="text-[10px] font-bold text-slate-300 mt-1 uppercase tracking-widest">{{ formatDataCurta(item.data) }}</p>
      </div>
    </div>

    <div class="mx-6 py-5 flex border-t border-slate-50">
      <div class="flex-1 space-y-1 pr-4 border-r border-slate-50">
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Você Pagou</span>
        <p class="text-sm font-mono font-bold text-slate-800">{{ formatarDinheiro(item.valorPago) }}</p>
      </div>
      <div class="flex-1 space-y-1 pl-6">
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sua Parte</span>
        <p class="text-sm font-mono font-bold text-slate-800">{{ formatarDinheiro(item.valorConsumido) }}</p>
      </div>
    </div>
  </div>
</template>
