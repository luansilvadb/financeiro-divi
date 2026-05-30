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
        <Button variant="secondary" size="icon" @click="emit('close')" class="rounded-full border border-stone">
          <X class="w-4 h-4 text-graphite" />
        </Button>
      </div>

      <div class="space-y-3" v-if="faturaAtivaVisualizada">
        <p class="text-sm text-ash leading-relaxed">
          Revise os números antes de arquivar o mês de <strong class="text-charcoal">{{ formatarMesAno(faturaAtivaVisualizada.periodo.mes, faturaAtivaVisualizada.periodo.ano) }}</strong>. O saldo será consolidado e os acertos serão gerados automaticamente.
        </p>
      </div>

      <div v-if="faturaAtivaVisualizada" class="grid grid-cols-2 gap-3">
        <div class="bg-parchment p-4 rounded-xl border border-stone">
          <p class="text-[10px] font-bold uppercase text-ash tracking-widest mb-1">Total do Mês</p>
          <p class="text-2xl font-display text-charcoal break-words">R$ {{ formatarDinheiro(totalPeriodoSelecionado).toFixed(2).replace('.', ',') }}</p>
          <p class="text-[10px] text-ash font-medium mt-1">{{ totalLancamentosPeriodoSelecionado }} lançamentos registrados</p>
        </div>
        
        <div class="bg-parchment p-4 rounded-xl border border-stone">
          <p class="text-[10px] font-bold uppercase text-ash tracking-widest mb-1">Impacto (Pix)</p>
          <p class="text-2xl font-display text-ember">{{ nettingTransferencias.length }} Acertos</p>
          <p class="text-[10px] text-ash font-medium mt-1">serão cobrados dos moradores</p>
        </div>
      </div>

      <div v-if="faturaAtivaVisualizada && contasFixas.some((c: any) => !gastosFaturaSelecionada.some((g: any) => g.recurringBillId === c.id))" class="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex gap-3 items-start">
        <div class="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
          <AlertTriangle class="w-3.5 h-3.5 text-amber-600" />
        </div>
        <div>
          <p class="text-xs font-bold text-amber-700">Contas fixas pendentes!</p>
          <p class="text-[11px] text-amber-700/80 mt-0.5">Ainda existem contas fixas deste mês que não foram lançadas. Deseja fechar mesmo assim?</p>
        </div>
      </div>

      <div v-if="resumoPendencias?.temPendencias" class="space-y-4 mt-2">
        <h4 class="text-[10px] font-bold uppercase tracking-widest text-ash">Pendências Identificadas</h4>
        
        <div v-if="resumoPendencias.faturasAbertasComConsumo.length > 0" class="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <p class="text-xs font-bold text-amber-700 mb-2">Faturas de Cartão ainda ABERTAS</p>
          <ul class="space-y-2">
            <li v-for="item in resumoPendencias.faturasAbertasComConsumo" :key="item.fatura.id" class="flex justify-between items-center text-xs text-amber-700/80">
              <span>{{ cartoes.find((c: any) => c.id === item.fatura.cartaoId).nome }}</span>
              <span class="font-bold">R$ {{ (item.totalCentavos / 100).toFixed(2).replace('.', ',') }} consumido</span>
            </li>
          </ul>
        </div>

        <div v-if="resumoPendencias.faturasFechadasNaoQuitadas.length > 0" class="p-4 rounded-xl bg-coral/10 border border-coral/20">
          <p class="text-xs font-bold text-coral mb-2">Acertos não quitados (Faturas FECHADAS)</p>
          <ul class="space-y-2">
            <li v-for="item in resumoPendencias.faturasFechadasNaoQuitadas" :key="item.fatura.id" class="flex justify-between items-center text-xs text-coral/80">
              <span>{{ cartoes.find((c: any) => c.id === item.fatura.cartaoId).nome }}</span>
              <span class="font-bold">{{ item.acertosPendentes.length }} acerto(s) pendente(s)</span>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <div class="p-6 sm:px-8 sm:pb-8 border-t border-stone bg-white shrink-0">
      <div class="grid grid-cols-2 gap-3">
        <Button variant="secondary" @click="emit('close')">Cancelar</Button>
        <Button variant="primary" class="!bg-charcoal text-white hover:!bg-midnight border-none" @click="emit('confirm')">
          Arquivar Mês
        </Button>
      </div>
    </div>
  </BottomSheet>
</template>
