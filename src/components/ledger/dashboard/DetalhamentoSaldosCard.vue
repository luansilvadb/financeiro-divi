<script setup lang="ts">
import { computed } from 'vue'
import { Gasto } from '../../../modules/ledger/model/domain/Gasto'
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
            breakdown[d.membroId].pixConsumo += d.valor.centavos / g.installments
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
            breakdown[d.membroId].cardConsumo += d.valor.centavos / g.installments
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

    <div class="p-6 sm:p-8 space-y-12">
      <div 
        v-for="m in props.membros" 
        :key="m.id" 
        class="space-y-5"
      >
        <div class="flex justify-between items-center">
          <div class="flex items-center gap-3 sm:gap-4">
            <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-parchment shadow-subtle text-charcoal flex items-center justify-center text-base sm:text-lg font-semibold shrink-0">
              {{ m.nome[0] }}
            </div>
            <span class="font-semibold text-[19px] sm:text-[23px] tracking-[-0.25px] sm:tracking-[-0.44px] text-charcoal truncate">{{ m.nome }}</span>
          </div>
          <span 
            class="text-[11px] sm:text-[13px] font-semibold px-3 py-1.5 sm:px-4 sm:py-2 rounded-full shrink-0"
            :class="props.saldosUnificados[m.id] > 0.005 ? 'bg-meadow/10 text-meadow' : props.saldosUnificados[m.id] < -0.005 ? 'bg-coral/10 text-coral' : 'bg-stone text-ash'"
          >
            Saldo: {{ props.saldosUnificados[m.id] > 0.005 ? '+' : '' }}R$ {{ Math.abs(props.saldosUnificados[m.id] || 0).toFixed(2).replace('.', ',') }}
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
                <span class="text-[15px] font-semibold tracking-[-0.2px] text-meadow">+R$ {{ formatarBRL(detailedBreakdown[m.id]?.pixFez || 0) }}</span>
              </div>
              <div class="h-[1px] w-full bg-stone" />
              <div class="flex justify-between items-baseline">
                <span class="text-[13px] font-medium text-graphite">Consumiu</span>
                <span class="text-[15px] font-semibold tracking-[-0.2px] text-coral">-R$ {{ formatarBRL(detailedBreakdown[m.id]?.pixConsumo || 0) }}</span>
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
                <span class="text-[13px] font-medium text-graphite">Passou</span>
                <span class="text-[15px] font-semibold tracking-[-0.2px] text-meadow">+R$ {{ formatarBRL(detailedBreakdown[m.id]?.cardFez || 0) }}</span>
              </div>
              <div class="h-[1px] w-full bg-stone" />
              <div class="flex justify-between items-baseline">
                <span class="text-[13px] font-medium text-graphite">Consumiu</span>
                <span class="text-[15px] font-semibold tracking-[-0.2px] text-coral">-R$ {{ formatarBRL(detailedBreakdown[m.id]?.cardConsumo || 0) }}</span>
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
                <span class="text-[15px] font-semibold tracking-[-0.2px] text-meadow">+R$ {{ formatarBRL(detailedBreakdown[m.id]?.loanFez || 0) }}</span>
              </div>
              <div class="h-[1px] w-full bg-stone" />
              <div class="flex justify-between items-baseline">
                <span class="text-[13px] font-medium text-graphite">Pegou</span>
                <span class="text-[15px] font-semibold tracking-[-0.2px] text-coral">-R$ {{ formatarBRL(detailedBreakdown[m.id]?.loanTomou || 0) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Card>
</template>
