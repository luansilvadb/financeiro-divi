<script setup lang="ts">
import { computed } from 'vue'
import { Gasto } from '../../../modules/ledger/core/domain/Gasto'
import { Dinheiro } from '../../../shared/primitives/Dinheiro'

interface Props {
  membros: { id: string; nome: string }[]
  gastos: Gasto[]
  saldosUnificados: Record<string, number>
}

const props = defineProps<Props>()

const formatarBRL = (centavos: number) => {
  return (centavos / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// Calcula os acumuladores granulares para cada morador
const detailedBreakdown = computed(() => {
  const breakdown: Record<string, {
    pixFez: number
    pixConsumo: number
    cardFez: number
    cardConsumo: number
    loanFez: number
    loanTomou: number
  }> = {}

  props.membros.forEach(m => {
    breakdown[m.id] = { pixFez: 0, pixConsumo: 0, cardFez: 0, cardConsumo: 0, loanFez: 0, loanTomou: 0 }
  })

  props.gastos.forEach(g => {
    const valorParcela = g.valorTotal.centavos / g.installments
    
    if (g.isLoan) {
      if (g.compradorId && breakdown[g.compradorId]) {
        breakdown[g.compradorId].loanFez += valorParcela
      }
      if (g.borrowerId && breakdown[g.borrowerId]) {
        breakdown[g.borrowerId].loanTomou += valorParcela
      }
    } else {
      // Pix/Cash vs Cartão
      if (g.method === 'pix' || g.isSettlement) {
        if (g.compradorId && breakdown[g.compradorId]) {
          breakdown[g.compradorId].pixFez += valorParcela
        }
        g.divisoes.forEach(d => {
          if (breakdown[d.membroId]) {
            breakdown[d.membroId].pixConsumo += valorParcela / g.divisoes.length
          }
        })
      } else {
        // Cartão de Crédito
        const pagadorId = g.cardOwner || g.compradorId
        if (pagadorId && breakdown[pagadorId]) {
          breakdown[pagadorId].cardFez += valorParcela
        }
        g.divisoes.forEach(d => {
          if (breakdown[d.membroId]) {
            breakdown[d.membroId].cardConsumo += valorParcela / g.divisoes.length
          }
        })
      }
    }
  })

  return breakdown
})
</script>

<template>
  <div class="glass-card rounded-3xl p-6 shadow-2xl text-divi-t1 space-y-5 border border-divi-border/50">
    <div>
      <h3 class="text-xs font-black text-divi-t3 uppercase tracking-widest block mb-0.5">
        🔍 Detalhamento Granular de Contas
      </h3>
      <p class="text-[10px] text-divi-t3">Auditoria de fluxos de caixa de PIX, Cartão e Empréstimos por morador</p>
    </div>

    <div class="space-y-6">
      <div 
        v-for="m in props.membros" 
        :key="m.id" 
        class="border-b border-divi-border/40 pb-5 last:border-b-0 last:pb-0"
      >
        <div class="flex justify-between items-center mb-3">
          <div class="flex items-center gap-2">
            <div class="w-7 h-7 rounded-full bg-divi-s2 border border-divi-border text-divi-t1 flex items-center justify-center font-black text-xs uppercase">
              {{ m.nome[0] }}
            </div>
            <span class="font-extrabold text-sm text-divi-t1">{{ m.nome }}</span>
          </div>
          <span 
            class="text-[10px] font-black px-2.5 py-1 rounded-full uppercase"
            :class="props.saldosUnificados[m.id] > 0.005 ? 'bg-divi-emerald-dim text-divi-emerald' : props.saldosUnificados[m.id] < -0.005 ? 'bg-divi-rose-dim text-divi-rose' : 'bg-divi-s2 text-divi-t3'"
          >
            Saldo: {{ props.saldosUnificados[m.id] > 0.005 ? '+' : '' }}R$ {{ props.saldosUnificados[m.id]?.toFixed(2).replace('.', ',') }}
          </span>
        </div>

        <!-- Colunas Granulares -->
        <div class="grid grid-cols-3 gap-2.5 text-[11px] leading-relaxed">
          <!-- Coluna PIX -->
          <div class="bg-slate-950/20 border border-divi-border/30 rounded-xl p-2.5 space-y-1">
            <span class="block text-[9px] font-black uppercase text-divi-primary mb-1">💵 PIX</span>
            <div class="flex justify-between">
              <span class="text-divi-t3">Fez:</span>
              <span class="text-divi-emerald font-extrabold">+{{ formatarBRL(detailedBreakdown[m.id]?.pixFez || 0) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-divi-t3">Usou:</span>
              <span class="text-divi-rose font-extrabold">-{{ formatarBRL(detailedBreakdown[m.id]?.pixConsumo || 0) }}</span>
            </div>
          </div>

          <!-- Coluna Cartão -->
          <div class="bg-slate-950/20 border border-divi-border/30 rounded-xl p-2.5 space-y-1">
            <span class="block text-[9px] font-black uppercase text-divi-primary mb-1">💳 Cartão</span>
            <div class="flex justify-between">
              <span class="text-divi-t3">Fez:</span>
              <span class="text-divi-emerald font-extrabold">+{{ formatarBRL(detailedBreakdown[m.id]?.cardFez || 0) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-divi-t3">Usou:</span>
              <span class="text-divi-rose font-extrabold">-{{ formatarBRL(detailedBreakdown[m.id]?.cardConsumo || 0) }}</span>
            </div>
          </div>

          <!-- Coluna Empréstimos -->
          <div class="bg-slate-950/20 border border-divi-border/30 rounded-xl p-2.5 space-y-1">
            <span class="block text-[9px] font-black uppercase text-divi-primary mb-1">🤝 Empréstimo</span>
            <div class="flex justify-between">
              <span class="text-divi-t3">Fez:</span>
              <span class="text-divi-emerald font-extrabold">+{{ formatarBRL(detailedBreakdown[m.id]?.loanFez || 0) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-divi-t3">Tomou:</span>
              <span class="text-divi-rose font-extrabold">-{{ formatarBRL(detailedBreakdown[m.id]?.loanTomou || 0) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
