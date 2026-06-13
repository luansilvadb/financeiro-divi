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

const formatarValorComSinal = (centavos: number, isPositive: boolean) => {
  if (centavos === 0) {
    return 'R$ 0,00'
  }
  const sinal = isPositive ? '+' : '-'
  return `${sinal}R$ ${formatarBRL(centavos)}`
}

const obterClasseValor = (centavos: number, isPositive: boolean) => {
  if (centavos === 0) {
    return 'text-graphite font-semibold'
  }
  return isPositive ? 'text-meadow font-bold' : 'text-coral font-bold'
}

const toggleExtrato = () => {
  expanded.value = !expanded.value
}

const obterExtrato = () => {
  return [...ExtratoService.obterExtratoMembro(props.membro.id, props.gastos)].reverse()
}
</script>

<template>
  <div class="space-y-6">
    <!-- Cabeçalho do Membro com Informações de Saldo Semânticas -->
    <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 px-1 pb-4 border-b border-stone/50">
      <div class="flex items-center gap-4 group min-w-0">
        <MembroAvatar :nome="membro.nome" size="lg" class="shrink-0" />
        <div class="flex flex-col min-w-0">
          <span class="font-bold text-[22px] sm:text-[28px] tracking-tighter text-charcoal truncate leading-tight">
            {{ membro.nome }}
          </span>
          <p class="text-xs text-graphite font-semibold mt-1">
            {{ 
              saldoUnificado > 0.005 
                ? 'Você pagou a mais pelo grupo e tem dinheiro a receber.' 
                : saldoUnificado < -0.005 
                ? 'Você consumiu mais do que pagou e precisa acertar a diferença.' 
                : 'Você está com as contas em dia no grupo!' 
            }}
          </p>
        </div>
      </div>
      
      <div 
        class="text-xs font-bold px-4 py-2.5 rounded-2xl shrink-0 uppercase tracking-widest shadow-sm text-center flex items-center justify-center self-start sm:self-center border"
        :class="[
          saldoUnificado > 0.005 
            ? 'bg-meadow/10 text-meadow border-meadow/20' 
            : saldoUnificado < -0.005 
            ? 'bg-coral/10 text-coral border-coral/20' 
            : 'bg-stone/50 text-graphite border-stone'
        ]"
      >
        {{ 
          saldoUnificado > 0.005 
            ? `A receber: R$ ${Math.abs(saldoUnificado).toFixed(2).replace('.', ',')}` 
            : saldoUnificado < -0.005 
            ? `A pagar: R$ ${Math.abs(saldoUnificado).toFixed(2).replace('.', ',')}` 
            : 'Saldo Equilibrado' 
        }}
      </div>
    </div>

    <!-- Cards Detalhados dos Fluxos -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <!-- PIX -->
      <div class="rounded-2xl bg-parchment p-5 flex flex-col justify-between shadow-subtle border border-stone/30 hover:border-ember/20 transition-all duration-300">
        <div class="flex items-center gap-3 mb-5">
          <div class="w-9 h-9 rounded-xl bg-white shadow-subtle flex items-center justify-center shrink-0">
            <Wallet class="w-4.5 h-4.5 text-ember" />
          </div>
          <span class="text-xs font-bold uppercase tracking-wider text-charcoal">PIX / Dinheiro</span>
        </div>
        
        <div class="space-y-4">
          <!-- Pagou -->
          <div class="flex justify-between items-center gap-2">
            <div class="flex flex-col min-w-0">
              <span class="text-xs font-bold text-charcoal">Pagou para o grupo (+)</span>
              <span class="text-[11px] text-graphite mt-0.5">Compras pagas por você</span>
            </div>
            <span 
              class="text-sm tracking-tight shrink-0"
              :class="obterClasseValor(breakdown?.pixFez || 0, true)"
            >
              {{ formatarValorComSinal(breakdown?.pixFez || 0, true) }}
            </span>
          </div>
          
          <div class="h-px w-full bg-stone/60" />
          
          <!-- Consumiu -->
          <div class="flex justify-between items-center gap-2">
            <div class="flex flex-col min-w-0">
              <span class="text-xs font-bold text-charcoal">Sua parte consumida (-)</span>
              <span class="text-[11px] text-graphite mt-0.5">O que você usou destas compras</span>
            </div>
            <span 
              class="text-sm tracking-tight shrink-0"
              :class="obterClasseValor(breakdown?.pixConsumo || 0, false)"
            >
              {{ formatarValorComSinal(breakdown?.pixConsumo || 0, false) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Cartão -->
      <div class="rounded-2xl bg-parchment p-5 flex flex-col justify-between shadow-subtle border border-stone/30 hover:border-ember/20 transition-all duration-300">
        <div class="flex items-center gap-3 mb-5">
          <div class="w-9 h-9 rounded-xl bg-white shadow-subtle flex items-center justify-center shrink-0">
            <CreditCard class="w-4.5 h-4.5 text-ember" />
          </div>
          <span class="text-xs font-bold uppercase tracking-wider text-charcoal">Faturas</span>
        </div>
        
        <div class="space-y-4">
          <!-- Usou -->
          <div class="flex justify-between items-center gap-2">
            <div class="flex flex-col min-w-0">
              <span class="text-xs font-bold text-charcoal">Fez no seu cartão (+)</span>
              <span class="text-[11px] text-graphite mt-0.5">Contas do grupo no seu cartão</span>
            </div>
            <span 
              class="text-sm tracking-tight shrink-0"
              :class="obterClasseValor(breakdown?.cardFez || 0, true)"
            >
              {{ formatarValorComSinal(breakdown?.cardFez || 0, true) }}
            </span>
          </div>
          
          <div class="h-px w-full bg-stone/60" />
          
          <!-- Consumiu -->
          <div class="flex justify-between items-center gap-2">
            <div class="flex flex-col min-w-0">
              <span class="text-xs font-bold text-charcoal">Sua parte na fatura (-)</span>
              <span class="text-[11px] text-graphite mt-0.5">O que gastou no cartão de outros</span>
            </div>
            <span 
              class="text-sm tracking-tight shrink-0"
              :class="obterClasseValor(breakdown?.cardConsumo || 0, false)"
            >
              {{ formatarValorComSinal(breakdown?.cardConsumo || 0, false) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Empréstimo -->
      <div class="rounded-2xl bg-parchment p-5 flex flex-col justify-between shadow-subtle border border-stone/30 hover:border-ember/20 transition-all duration-300">
        <div class="flex items-center gap-3 mb-5">
          <div class="w-9 h-9 rounded-xl bg-white shadow-subtle flex items-center justify-center shrink-0">
            <Handshake class="w-4.5 h-4.5 text-ember" />
          </div>
          <span class="text-xs font-bold uppercase tracking-wider text-charcoal">Empréstimos</span>
        </div>
        
        <div class="space-y-4">
          <!-- Emprestou -->
          <div class="flex justify-between items-center gap-2">
            <div class="flex flex-col min-w-0">
              <span class="text-xs font-bold text-charcoal">Você emprestou (+)</span>
              <span class="text-[11px] text-graphite mt-0.5">Dinheiro enviado para outros</span>
            </div>
            <span 
              class="text-sm tracking-tight shrink-0"
              :class="obterClasseValor(breakdown?.loanFez || 0, true)"
            >
              {{ formatarValorComSinal(breakdown?.loanFez || 0, true) }}
            </span>
          </div>
          
          <div class="h-px w-full bg-stone/60" />
          
          <!-- Tomou -->
          <div class="flex justify-between items-center gap-2">
            <div class="flex flex-col min-w-0">
              <span class="text-xs font-bold text-charcoal">Pegou emprestado (-)</span>
              <span class="text-[11px] text-graphite mt-0.5">Dinheiro recebido de outros</span>
            </div>
            <span 
              class="text-sm tracking-tight shrink-0"
              :class="obterClasseValor(breakdown?.loanTomou || 0, false)"
            >
              {{ formatarValorComSinal(breakdown?.loanTomou || 0, false) }}
            </span>
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
      class="space-y-3 animate-in fade-in slide-in-from-top-1 duration-200"
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
