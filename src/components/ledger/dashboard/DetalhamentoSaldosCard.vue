<script setup lang="ts">
import { computed } from 'vue'
import { Gasto } from '../../../modules/ledger/core/domain/Gasto'
import Card from '../../ui/Card.vue'
import { Wallet, CreditCard, Handshake, Search } from 'lucide-vue-next'

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
  <Card class="p-0 overflow-hidden shadow-subtle bg-card rounded-card">
    <!-- Cabeçalho Padronizado -->
    <div class="p-6 border-b border-stone bg-parchment flex justify-between items-center">
      <div class="flex items-center gap-4">
        <div class="w-10 h-10 rounded-xl bg-midnight text-white flex items-center justify-center">
          <Search class="w-5 h-5" />
        </div>
        <div>
          <h3 class="font-bold text-lg leading-tight text-charcoal">Detalhamento Granular</h3>
          <p class="text-[11px] text-ash uppercase tracking-wider mt-0.5">
            Fluxos de PIX, Cartão e Empréstimos
          </p>
        </div>
      </div>
    </div>

    <div class="p-8 space-y-10">
      <div 
        v-for="m in props.membros" 
        :key="m.id" 
        class="space-y-4"
      >
        <div class="flex justify-between items-center pb-2 border-b border-stone">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-full bg-stone text-charcoal flex items-center justify-center font-display text-sm">
              {{ m.nome[0] }}
            </div>
            <span class="font-bold text-base text-charcoal">{{ m.nome }}</span>
          </div>
          <span 
            class="text-[10px] font-mono font-bold px-3 py-1 rounded-full uppercase tracking-widest border"
            :class="props.saldosUnificados[m.id] > 0.005 ? 'bg-meadow/5 border-meadow/20 text-meadow' : props.saldosUnificados[m.id] < -0.005 ? 'bg-coral/5 border-coral/20 text-coral' : 'bg-stone border-stone text-ash'"
          >
            Saldo: {{ props.saldosUnificados[m.id] > 0.005 ? '+' : '' }}R$ {{ props.saldosUnificados[m.id]?.toFixed(2).replace('.', ',') }}
          </span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <!-- PIX -->
          <Card class="p-4 bg-parchment border border-stone shadow-none rounded-card space-y-3">
            <div class="flex items-center gap-2">
              <Wallet class="w-3 h-3 text-ember" />
              <span class="text-[9px] font-bold uppercase tracking-widest text-ash">PIX / Cash</span>
            </div>
            <div class="space-y-1.5">
              <div class="flex justify-between text-xs">
                <span class="text-ash font-semibold">Fez:</span>
                <span class="text-meadow font-semibold">+{{ formatarBRL(detailedBreakdown[m.id]?.pixFez || 0) }}</span>
              </div>
              <div class="flex justify-between text-xs">
                <span class="text-ash font-semibold">Usou:</span>
                <span class="text-coral font-semibold">-{{ formatarBRL(detailedBreakdown[m.id]?.pixConsumo || 0) }}</span>
              </div>
            </div>
          </Card>

          <!-- Cartão -->
          <Card class="p-4 bg-parchment border border-stone shadow-none rounded-card space-y-3">
            <div class="flex items-center gap-2">
              <CreditCard class="w-3 h-3 text-ember" />
              <span class="text-[9px] font-bold uppercase tracking-widest text-ash">Cartão</span>
            </div>
            <div class="space-y-1.5">
              <div class="flex justify-between text-xs">
                <span class="text-ash font-semibold">Fez:</span>
                <span class="text-meadow font-semibold">+{{ formatarBRL(detailedBreakdown[m.id]?.cardFez || 0) }}</span>
              </div>
              <div class="flex justify-between text-xs">
                <span class="text-ash font-semibold">Usou:</span>
                <span class="text-coral font-semibold">-{{ formatarBRL(detailedBreakdown[m.id]?.cardConsumo || 0) }}</span>
              </div>
            </div>
          </Card>

          <!-- Empréstimo -->
          <Card class="p-4 bg-parchment border border-stone shadow-none rounded-card space-y-3">
            <div class="flex items-center gap-2">
              <Handshake class="w-3 h-3 text-ember" />
              <span class="text-[9px] font-bold uppercase tracking-widest text-ash">Empréstimos</span>
            </div>
            <div class="space-y-1.5">
              <div class="flex justify-between text-xs">
                <span class="text-ash font-semibold">Fez:</span>
                <span class="text-meadow font-semibold">+{{ formatarBRL(detailedBreakdown[m.id]?.loanFez || 0) }}</span>
              </div>
              <div class="flex justify-between text-xs">
                <span class="text-ash font-semibold">Tomou:</span>
                <span class="text-coral font-semibold">-{{ formatarBRL(detailedBreakdown[m.id]?.loanTomou || 0) }}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  </Card>
</template>
