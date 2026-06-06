<script setup lang="ts">
import { ref } from 'vue'
import { Gasto } from '../../../../models/entities/Gasto'
import { ExtratoService, type BreakdownGranular } from '../../../../models/services/ExtratoService'
import { Wallet, CreditCard, Handshake, ChevronDown, ChevronUp, History } from 'lucide-vue-next'
import ItemExtratoCard from './ItemExtratoCard.vue'
import MembroAvatar from '../../ui/MembroAvatar.vue'

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
  <div class="space-y-6">
    <div class="flex justify-between items-center px-1">
      <div class="flex items-center gap-4 group">
        <MembroAvatar :nome="membro.nome" size="lg" />
        <span class="font-bold text-[22px] sm:text-[28px] tracking-tighter text-charcoal truncate">{{ membro.nome }}</span>
      </div>
      <span 
        class="text-[10px] sm:text-xs font-bold px-4 py-2 rounded-full shrink-0 uppercase tracking-widest shadow-sm"
        :class="saldoUnificado > 0.005 ? 'bg-meadow/10 text-meadow' : saldoUnificado < -0.005 ? 'bg-coral/10 text-coral' : 'bg-stone text-graphite'"
      >
        Saldo: {{ saldoUnificado > 0.005 ? '+' : '' }}R$ {{ Math.abs(saldoUnificado || 0).toFixed(2).replace('.', ',') }}
      </span>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <!-- PIX -->
      <div class="rounded-2xl bg-parchment p-5 flex flex-col justify-between shadow-subtle transition-all duration-300">
        <div class="flex items-center gap-3 mb-6">
          <div class="w-9 h-9 rounded-full bg-white shadow-subtle flex items-center justify-center shrink-0">
            <Wallet class="w-4.5 h-4.5 text-ember" />
          </div>
          <span class="text-[10px] font-semibold uppercase tracking-widest text-graphite opacity-60">PIX / Dinheiro</span>
        </div>
        
        <div class="space-y-3">
          <div class="flex justify-between items-baseline">
            <span class="text-xs font-semibold text-graphite">Pagou</span>
            <span class="text-sm font-bold tracking-tight text-meadow">+R$ {{ formatarBRL(breakdown?.pixFez || 0) }}</span>
          </div>
          <div class="h-px w-full bg-stone" />
          <div class="flex justify-between items-baseline">
            <span class="text-xs font-semibold text-graphite">Consumiu</span>
            <span class="text-sm font-bold tracking-tight text-coral">-R$ {{ formatarBRL(breakdown?.pixConsumo || 0) }}</span>
          </div>
        </div>
      </div>

      <!-- Cartão -->
      <div class="rounded-2xl bg-parchment p-5 flex flex-col justify-between shadow-subtle transition-all duration-300">
        <div class="flex items-center gap-3 mb-6">
          <div class="w-9 h-9 rounded-full bg-white shadow-subtle flex items-center justify-center shrink-0">
            <CreditCard class="w-4.5 h-4.5 text-ember" />
          </div>
          <span class="text-[10px] font-semibold uppercase tracking-widest text-graphite opacity-60">Faturas</span>
        </div>
        
        <div class="space-y-3">
          <div class="flex justify-between items-baseline">
            <span class="text-xs font-semibold text-graphite">Usou</span>
            <span class="text-sm font-bold tracking-tight text-meadow">+R$ {{ formatarBRL(breakdown?.cardFez || 0) }}</span>
          </div>
          <div class="h-px w-full bg-stone" />
          <div class="flex justify-between items-baseline">
            <span class="text-xs font-semibold text-graphite">Consumiu</span>
            <span class="text-sm font-bold tracking-tight text-coral">-R$ {{ formatarBRL(breakdown?.cardConsumo || 0) }}</span>
          </div>
        </div>
      </div>

      <!-- Empréstimo -->
      <div class="rounded-2xl bg-parchment p-5 flex flex-col justify-between shadow-subtle transition-all duration-300">
        <div class="flex items-center gap-3 mb-6">
          <div class="w-9 h-9 rounded-full bg-white shadow-subtle flex items-center justify-center shrink-0">
            <Handshake class="w-4.5 h-4.5 text-ember" />
          </div>
          <span class="text-[10px] font-semibold uppercase tracking-widest text-graphite opacity-60">Empréstimos</span>
        </div>
        
        <div class="space-y-3">
          <div class="flex justify-between items-baseline">
            <span class="text-xs font-semibold text-graphite">Emprestou</span>
            <span class="text-sm font-bold tracking-tight text-meadow">+R$ {{ formatarBRL(breakdown?.loanFez || 0) }}</span>
          </div>
          <div class="h-px w-full bg-stone" />
          <div class="flex justify-between items-baseline">
            <span class="text-xs font-semibold text-graphite">Tomou</span>
            <span class="text-sm font-bold tracking-tight text-coral">-R$ {{ formatarBRL(breakdown?.loanTomou || 0) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Botão para Expandir Extrato -->
    <div class="flex justify-center pt-2">
      <button 
        @click="toggleExtrato"
        class="flex items-center gap-2 text-[10px] font-bold text-graphite hover:text-ember transition-all uppercase tracking-widest bg-stone/40 px-5 py-2.5 rounded-pill border-none cursor-pointer active:scale-95"
      >
        <History class="w-3.5 h-3.5" />
        {{ expanded ? 'Ocultar Detalhes' : 'Ver Extrato do Membro' }}
        <component :is="expanded ? ChevronUp : ChevronDown" class="w-4 h-4 transition-transform duration-300" />
      </button>
    </div>

    <!-- Lista de Extrato (Condicional) -->
    <div 
      v-if="expanded" 
      class="space-y-3 animate-in fade-in slide-in-from-top-3 duration-500 ease-spring"
    >
      <div class="flex items-center gap-3 mb-4">
        <div class="h-px flex-1 bg-stone" />
        <span class="text-[9px] font-bold text-graphite uppercase tracking-[0.2em] opacity-60">Histórico no Período</span>
        <div class="h-px flex-1 bg-stone" />
      </div>
      
      <ItemExtratoCard 
        v-for="item in obterExtrato()" 
        :key="item.id" 
        :item="item" 
      />

      <div v-if="obterExtrato().length === 0" class="text-center py-10 text-graphite text-[11px] font-bold uppercase tracking-widest opacity-30 italic">
        Nenhum lançamento encontrado.
      </div>
    </div>
  </div>
</template>
