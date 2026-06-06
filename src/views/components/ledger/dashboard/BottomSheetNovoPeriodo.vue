<script setup lang="ts">
import BottomSheet from '../../ui/BottomSheet.vue'
import Button from '../../ui/Button.vue'
import { AlertTriangle } from 'lucide-vue-next'

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
  <BottomSheet 
    :model-value="visible" 
    @update:model-value="val => { if (!val) emit('close') }"
    :subtitle="faturaAtivaVisualizada ? `Revise os números antes de arquivar o mês de ${formatarMesAno(faturaAtivaVisualizada.periodo.mes, faturaAtivaVisualizada.periodo.ano)}. O saldo será consolidado e os acertos serão gerados automaticamente.` : ''"
  >
    <template #title>
      <h3 class="text-3xl font-display text-charcoal leading-tight">Fechamento de <span class="text-ember">Período</span></h3>
    </template>

    <div class="space-y-6 pt-2">
      <div v-if="faturaAtivaVisualizada" class="grid grid-cols-2 gap-3">
        <div class="bg-parchment p-4 rounded-2xl border border-stone shadow-subtle">
          <p class="text-[10px] font-bold uppercase text-graphite tracking-widest mb-1">Total do Mês</p>
          <p class="text-2xl font-display text-charcoal break-words">R$ {{ formatarDinheiro(totalPeriodoSelecionado).toFixed(2).replace('.', ',') }}</p>
          <p class="text-[10px] text-graphite font-bold mt-1 uppercase opacity-60">{{ totalLancamentosPeriodoSelecionado }} lançamentos</p>
        </div>
        
        <div class="bg-parchment p-4 rounded-2xl border border-stone shadow-subtle">
          <p class="text-[10px] font-bold uppercase text-graphite tracking-widest mb-1">Impacto (Pix)</p>
          <p class="text-2xl font-display text-ember">{{ nettingTransferencias.length }} Acertos</p>
          <p class="text-[10px] text-graphite font-bold mt-1 uppercase opacity-60">serão cobrados</p>
        </div>
      </div>

      <div v-if="faturaAtivaVisualizada && contasFixas.some((c: any) => !gastosFaturaSelecionada.some((g: any) => g.recurringBillId === c.id))" class="p-4 rounded-2xl bg-ember/5 border border-ember/20 flex gap-3 items-start animate-in fade-in slide-in-from-top-1">
        <div class="w-8 h-8 rounded-full bg-ember/10 flex items-center justify-center shrink-0 mt-0.5">
          <AlertTriangle class="w-4 h-4 text-ember" />
        </div>
        <div>
          <p class="text-xs font-bold text-ember uppercase tracking-tight">Contas fixas pendentes!</p>
          <p class="text-[11px] text-graphite font-semibold mt-0.5 leading-tight">Ainda existem contas fixas deste mês que não foram lançadas. Deseja fechar mesmo assim?</p>
        </div>
      </div>

      <div v-if="resumoPendencias?.temPendencias" class="space-y-4">
        <h4 class="text-[10px] font-bold uppercase tracking-widest text-graphite ml-1 block">Pendências Identificadas</h4>
        
        <div v-if="resumoPendencias.faturasAbertasComConsumo.length > 0" class="p-4 rounded-2xl bg-ember/5 border border-ember/10 shadow-subtle">
          <p class="text-[10px] font-bold text-ember uppercase tracking-widest mb-3">Faturas de Cartão ABERTAS</p>
          <ul class="space-y-2">
            <li v-for="item in resumoPendencias.faturasAbertasComConsumo" :key="item.fatura.id" class="flex justify-between items-center text-xs text-graphite font-bold">
              <span>{{ cartoes.find((c: any) => c.id === item.fatura.cartaoId).nome }}</span>
              <span class="text-charcoal">R$ {{ (item.totalCentavos / 100).toFixed(2).replace('.', ',') }}</span>
            </li>
          </ul>
        </div>

        <div v-if="resumoPendencias.faturasFechadasNaoQuitadas.length > 0" class="p-4 rounded-2xl bg-coral/5 border border-coral/10 shadow-subtle">
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

    <template #footer>
      <div class="grid grid-cols-2 gap-3">
        <Button variant="secondary" class="font-bold uppercase tracking-widest text-[10px] h-12" @click="emit('close')">Cancelar</Button>
        <Button variant="primary" class="font-bold uppercase tracking-widest text-[10px] h-12" @click="emit('confirm')">
          Arquivar Mês
        </Button>
      </div>
    </template>
  </BottomSheet>
</template>

<style scoped>
</style>
