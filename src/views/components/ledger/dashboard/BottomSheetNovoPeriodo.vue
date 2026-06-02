<script setup lang="ts">
import BottomSheet from '../../ui/BottomSheet.vue'
import Button from '../../ui/Button.vue'
import { AlertTriangle, X } from 'lucide-vue-next'

const props = defineProps<{
  visible: boolean
  vm: any
  cartoes: any[]
}>()

const {
  faturaAtivaVisualizada,
  totalPeriodoSelecionado,
  totalLancamentosPeriodoSelecionado,
  nettingTransferencias,
  contasFixas,
  gastosFaturaSelecionada,
  resumoPendencias,
  formatarMesAno,
  formatarDinheiro
} = props.vm

const emit = defineEmits(['close', 'confirm'])
</script>

<template>
  <BottomSheet :model-value="visible" @update:model-value="val => { if (!val) emit('close') }" width-class="md:w-[460px]" max-height="95dvh">
    <div class="p-6 sm:p-8 space-y-8 flex-grow overflow-y-auto custom-scrollbar">
      <div class="flex justify-between items-start">
        <div class="space-y-2">
          <h3 class="text-3xl font-display text-charcoal leading-tight">Fechamento<br>de <span class="text-ember">Período</span></h3>
        </div>
        <button 
          @click="emit('close')" 
          class="w-10 h-10 rounded-full border border-stone bg-canvas flex items-center justify-center cursor-pointer hover:bg-stone transition-colors"
          aria-label="Fechar"
        >
          <X class="w-5 h-5 text-graphite" />
        </button>
      </div>

      <div class="space-y-3" v-if="faturaAtivaVisualizada">
        <p class="text-sm text-graphite font-medium leading-relaxed">
          Revise os números antes de arquivar o mês de <strong class="text-charcoal font-bold">{{ formatarMesAno(faturaAtivaVisualizada.periodo.mes, faturaAtivaVisualizada.periodo.ano) }}</strong>. O saldo será consolidado e os acertos serão gerados automaticamente.
        </p>
      </div>

      <div v-if="faturaAtivaVisualizada" class="grid grid-cols-2 gap-3">
        <div class="bg-parchment p-4 rounded-xl border border-stone shadow-subtle">
          <p class="text-[10px] font-bold uppercase text-graphite tracking-widest mb-1">Total do Mês</p>
          <p class="text-2xl font-display text-charcoal break-words">R$ {{ formatarDinheiro(totalPeriodoSelecionado).toFixed(2).replace('.', ',') }}</p>
          <p class="text-[10px] text-graphite font-bold mt-1 uppercase opacity-60">{{ totalLancamentosPeriodoSelecionado }} lançamentos</p>
        </div>
        
        <div class="bg-parchment p-4 rounded-xl border border-stone shadow-subtle">
          <p class="text-[10px] font-bold uppercase text-graphite tracking-widest mb-1">Impacto (Pix)</p>
          <p class="text-2xl font-display text-ember">{{ nettingTransferencias.length }} Acertos</p>
          <p class="text-[10px] text-graphite font-bold mt-1 uppercase opacity-60">serão cobrados</p>
        </div>
      </div>

      <div v-if="faturaAtivaVisualizada && contasFixas.some((c: any) => !gastosFaturaSelecionada.some((g: any) => g.recurringBillId === c.id))" class="p-4 rounded-xl bg-ember/5 border border-ember/20 flex gap-3 items-start animate-in fade-in slide-in-from-top-1">
        <div class="w-8 h-8 rounded-full bg-ember/10 flex items-center justify-center shrink-0 mt-0.5">
          <AlertTriangle class="w-4 h-4 text-ember" />
        </div>
        <div>
          <p class="text-xs font-bold text-ember uppercase tracking-tight">Contas fixas pendentes!</p>
          <p class="text-[11px] text-graphite font-semibold mt-0.5 leading-tight">Ainda existem contas fixas deste mês que não foram lançadas. Deseja fechar mesmo assim?</p>
        </div>
      </div>

      <div v-if="resumoPendencias?.temPendencias" class="space-y-4 mt-2">
        <h4 class="text-[10px] font-bold uppercase tracking-widest text-graphite ml-1">Pendências Identificadas</h4>
        
        <div v-if="resumoPendencias.faturasAbertasComConsumo.length > 0" class="p-4 rounded-xl bg-ember/5 border border-ember/10 shadow-subtle">
          <p class="text-[10px] font-bold text-ember uppercase tracking-widest mb-3">Faturas de Cartão ABERTAS</p>
          <ul class="space-y-2">
            <li v-for="item in resumoPendencias.faturasAbertasComConsumo" :key="item.fatura.id" class="flex justify-between items-center text-xs text-graphite font-bold">
              <span>{{ cartoes.find((c: any) => c.id === item.fatura.cartaoId).nome }}</span>
              <span class="text-charcoal">R$ {{ (item.totalCentavos / 100).toFixed(2).replace('.', ',') }}</span>
            </li>
          </ul>
        </div>

        <div v-if="resumoPendencias.faturasFechadasNaoQuitadas.length > 0" class="p-4 rounded-xl bg-coral/5 border border-coral/10 shadow-subtle">
          <p class="text-[10px] font-bold text-coral uppercase tracking-widest mb-3">Acertos pendentes (Faturas FECHADAS)</p>
          <ul class="space-y-2">
            <li v-for="item in resumoPendencias.faturasFechadasNaoQuitadas" :key="item.fatura.id" class="flex justify-between items-center text-xs text-graphite font-bold">
              <span>{{ cartoes.find((c: any) => c.id === item.fatura.cartaoId).nome }}</span>
              <span class="text-coral">{{ item.acertosPendentes.length }} acerto(s)</span>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <div class="p-6 sm:px-8 sm:pb-8 border-t border-stone bg-white shrink-0">
      <div class="grid grid-cols-2 gap-3">
        <Button variant="secondary" class="font-bold uppercase tracking-widest text-xs h-12" @click="emit('close')">Cancelar</Button>
        <Button variant="primary" class="!bg-charcoal text-white hover:!bg-midnight border-none font-bold uppercase tracking-widest text-xs h-12" @click="emit('confirm')">
          Arquivar Mês
        </Button>
      </div>
    </div>
  </BottomSheet>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: var(--color-stone);
  border-radius: 9999px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: var(--color-ash);
}
</style>
