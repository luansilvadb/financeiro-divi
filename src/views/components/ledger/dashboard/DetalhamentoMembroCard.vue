<script setup lang="ts">
import { ref } from 'vue'
import { Gasto } from '../../../../models/entities/Gasto'
import { ExtratoService, type BreakdownGranular } from '../../../../models/services/ExtratoService'
import { Wallet, CreditCard, Handshake, ChevronDown, ChevronUp, History } from 'lucide-vue-next'
import ItemExtratoCard from './ItemExtratoCard.vue'

interface Props {
  membro: { id: string; nome: string }
  saldoUnificado: number
  breakdown: BreakdownGranular
  gastos: Gasto[]
}

const props = defineProps<Props>()

const expanded = ref(false)

const formatarBRL = (centavos: number) => {
  return (centavos / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const toggleExtrato = () => {
  expanded.value = !expanded.value
}

const obterExtrato = () => {
  return ExtratoService.obterExtratoMembro(props.membro.id, props.gastos)
}
</script>

<template>
  <div class="space-y-5">
    <div class="flex justify-between items-center">
      <div class="flex items-center gap-3 sm:gap-4">
        <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-parchment shadow-subtle text-charcoal flex items-center justify-center text-base sm:text-lg font-semibold shrink-0">
          {{ membro.nome[0] }}
        </div>
        <span class="font-semibold text-[19px] sm:text-[23px] tracking-[-0.25px] sm:tracking-[-0.44px] text-charcoal truncate">{{ membro.nome }}</span>
      </div>
      <span 
        class="text-[11px] sm:text-[13px] font-semibold px-3 py-1.5 sm:px-4 sm:py-2 rounded-full shrink-0"
        :class="saldoUnificado > 0.005 ? 'bg-meadow/10 text-meadow' : saldoUnificado < -0.005 ? 'bg-coral/10 text-coral' : 'bg-stone text-ash'"
      >
        Saldo: {{ saldoUnificado > 0.005 ? '+' : '' }}R$ {{ Math.abs(saldoUnificado || 0).toFixed(2).replace('.', ',') }}
      </span>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <!-- PIX -->
      <div class="rounded-[16px] bg-parchment p-5 flex flex-col justify-between">
        <div class="flex items-center gap-3 mb-6">
          <div class="w-8 h-8 rounded-full bg-white shadow-subtle flex items-center justify-center shrink-0">
            <Wallet class="w-4 h-4 text-ember" />
          </div>
          <span class="text-[11px] font-bold uppercase tracking-widest text-ash">PIX / Cash</span>
        </div>
        
        <div class="space-y-3">
          <div class="flex justify-between items-baseline">
            <span class="text-[13px] font-medium text-graphite">Pagou</span>
            <span class="text-[15px] font-semibold tracking-[-0.2px] text-meadow">+R$ {{ formatarBRL(breakdown?.pixFez || 0) }}</span>
          </div>
          <div class="h-[1px] w-full bg-stone" />
          <div class="flex justify-between items-baseline">
            <span class="text-[13px] font-medium text-graphite">Consumiu</span>
            <span class="text-[15px] font-semibold tracking-[-0.2px] text-coral">-R$ {{ formatarBRL(breakdown?.pixConsumo || 0) }}</span>
          </div>
        </div>
      </div>

      <!-- Cartão -->
      <div class="rounded-[16px] bg-parchment p-5 flex flex-col justify-between">
        <div class="flex items-center gap-3 mb-6">
          <div class="w-8 h-8 rounded-full bg-white shadow-subtle flex items-center justify-center shrink-0">
            <CreditCard class="w-4 h-4 text-ember" />
          </div>
          <span class="text-[11px] font-bold uppercase tracking-widest text-ash">Cartão</span>
        </div>
        
        <div class="space-y-3">
          <div class="flex justify-between items-baseline">
            <span class="text-[13px] font-medium text-graphite">Usou</span>
            <span class="text-[15px] font-semibold tracking-[-0.2px] text-meadow">+R$ {{ formatarBRL(breakdown?.cardFez || 0) }}</span>
          </div>
          <div class="h-[1px] w-full bg-stone" />
          <div class="flex justify-between items-baseline">
            <span class="text-[13px] font-medium text-graphite">Consumiu</span>
            <span class="text-[15px] font-semibold tracking-[-0.2px] text-coral">-R$ {{ formatarBRL(breakdown?.cardConsumo || 0) }}</span>
          </div>
        </div>
      </div>

      <!-- Empréstimo -->
      <div class="rounded-[16px] bg-parchment p-5 flex flex-col justify-between">
        <div class="flex items-center gap-3 mb-6">
          <div class="w-8 h-8 rounded-full bg-white shadow-subtle flex items-center justify-center shrink-0">
            <Handshake class="w-4 h-4 text-ember" />
          </div>
          <span class="text-[11px] font-bold uppercase tracking-widest text-ash">Empréstimos</span>
        </div>
        
        <div class="space-y-3">
          <div class="flex justify-between items-baseline">
            <span class="text-[13px] font-medium text-graphite">Emprestou</span>
            <span class="text-[15px] font-semibold tracking-[-0.2px] text-meadow">+R$ {{ formatarBRL(breakdown?.loanFez || 0) }}</span>
          </div>
          <div class="h-[1px] w-full bg-stone" />
          <div class="flex justify-between items-baseline">
            <span class="text-[13px] font-medium text-graphite">Pegou</span>
            <span class="text-[15px] font-semibold tracking-[-0.2px] text-coral">-R$ {{ formatarBRL(breakdown?.loanTomou || 0) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Botão para Expandir Extrato -->
    <div class="flex justify-center pt-2">
      <button 
        @click="toggleExtrato"
        class="flex items-center gap-2 text-[11px] font-bold text-ash hover:text-ember transition-colors uppercase tracking-widest bg-stone/30 px-4 py-2 rounded-lg"
      >
        <History class="w-3.5 h-3.5" />
        {{ expanded ? 'Ocultar Extrato' : 'Ver Extrato Detalhado' }}
        <component :is="expanded ? ChevronUp : ChevronDown" class="w-4 h-4" />
      </button>
    </div>

    <!-- Lista de Extrato (Condicional) -->
    <div 
      v-if="expanded" 
      class="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300"
    >
      <div class="flex items-center gap-2 mb-2">
        <div class="h-[1px] flex-1 bg-stone" />
        <span class="text-[10px] font-bold text-ash uppercase tracking-widest">Histórico do Período</span>
        <div class="h-[1px] flex-1 bg-stone" />
      </div>
      
      <ItemExtratoCard 
        v-for="item in obterExtrato()" 
        :key="item.id" 
        :item="item" 
      />

      <div v-if="obterExtrato().length === 0" class="text-center py-8 text-ash text-[11px] italic">
        Nenhum lançamento individual encontrado para este membro.
      </div>
    </div>
  </div>
</template>
