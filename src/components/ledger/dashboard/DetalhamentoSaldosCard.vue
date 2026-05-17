<script setup lang="ts">
import { computed } from 'vue'
import { Gasto } from '../../../modules/ledger/core/domain/Gasto'

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
  <div class="acrylic-card rounded-f-md p-5 space-y-4">
    <div>
      <h3 class="text-[11px] font-bold text-fluent-text-p2 uppercase tracking-widest block mb-0.5">
        🔍 Detalhamento Granular de Contas
      </h3>
      <p class="text-[10px] text-fluent-text-p3">Auditoria de fluxos de caixa de PIX, Cartão e Empréstimos por morador</p>
    </div>

    <div class="space-y-4">
      <div 
        v-for="m in props.membros" 
        :key="m.id" 
        class="border-b border-black/5 pb-4 last:border-b-0 last:pb-0"
      >
        <div class="flex justify-between items-center mb-2.5">
          <div class="flex items-center gap-2">
            <div class="w-6 h-6 rounded-full bg-fluent-accent text-white flex items-center justify-center font-bold text-[10px] uppercase">
              {{ m.nome[0] }}
            </div>
            <span class="font-bold text-xs text-fluent-text-p1">{{ m.nome }}</span>
          </div>
          <span 
            class="text-[9px] font-bold px-2 py-0.5 rounded-f-sm uppercase"
            :class="props.saldosUnificados[m.id] > 0.005 ? 'bg-fluent-emerald-dim text-fluent-emerald' : props.saldosUnificados[m.id] < -0.005 ? 'bg-fluent-rose-dim text-fluent-rose' : 'bg-black/5 text-fluent-text-p2'"
          >
            Saldo: {{ props.saldosUnificados[m.id] > 0.005 ? '+' : '' }}R$ {{ props.saldosUnificados[m.id]?.toFixed(2).replace('.', ',') }}
          </span>
        </div>

        <div class="grid grid-cols-3 gap-2 text-[10px] leading-relaxed">
          <div class="bg-white/30 border border-black/5 rounded-f-sm p-2 space-y-1">
            <span class="block text-[8px] font-bold uppercase text-fluent-accent mb-0.5">⚡ PIX</span>
            <div class="flex justify-between">
              <span class="text-fluent-text-p2">Fez:</span>
              <span class="text-fluent-emerald font-semibold">+{{ formatarBRL(detailedBreakdown[m.id]?.pixFez || 0) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-fluent-text-p2">Usou:</span>
              <span class="text-fluent-rose font-semibold">-{{ formatarBRL(detailedBreakdown[m.id]?.pixConsumo || 0) }}</span>
            </div>
          </div>

          <div class="bg-white/30 border border-black/5 rounded-f-sm p-2 space-y-1">
            <span class="block text-[8px] font-bold uppercase text-fluent-accent mb-0.5">💳 Cartão</span>
            <div class="flex justify-between">
              <span class="text-fluent-text-p2">Fez:</span>
              <span class="text-fluent-emerald font-semibold">+{{ formatarBRL(detailedBreakdown[m.id]?.cardFez || 0) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-fluent-text-p2">Usou:</span>
              <span class="text-fluent-rose font-semibold">-{{ formatarBRL(detailedBreakdown[m.id]?.cardConsumo || 0) }}</span>
            </div>
          </div>

          <div class="bg-white/30 border border-black/5 rounded-f-sm p-2 space-y-1">
            <span class="block text-[8px] font-bold uppercase text-fluent-accent mb-0.5">🤝 Empréstimo</span>
            <div class="flex justify-between">
              <span class="text-fluent-text-p2">Fez:</span>
              <span class="text-fluent-emerald font-semibold">+{{ formatarBRL(detailedBreakdown[m.id]?.loanFez || 0) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-fluent-text-p2">Tomou:</span>
              <span class="text-fluent-rose font-semibold">-{{ formatarBRL(detailedBreakdown[m.id]?.loanTomou || 0) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
