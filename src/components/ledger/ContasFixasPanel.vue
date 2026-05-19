<script setup lang="ts">
import { } from 'vue'
import type { ContaFixa } from '../../modules/ledger/core/domain/ContaFixa'
import { Gasto } from '../../modules/ledger/core/domain/Gasto'
import { Repeat, Plus, Settings } from 'lucide-vue-next'
import Button from '../ui/Button.vue'
import Card from '../ui/Card.vue'

const props = defineProps<{
  contasFixas: ContaFixa[]
  gastos: Gasto[]
  membros: { id: string; nome: string }[]
  isMonthLocked: boolean
}>()

const emit = defineEmits<{
  (e: 'lancar', bill: ContaFixa): void
  (e: 'configurar', bill: ContaFixa): void
  (e: 'novo'): void
  (e: 'estornar', bill: ContaFixa): void
}>()

const verificarPaga = (conta: ContaFixa) => {
  return props.gastos.some(g => g.recurringBillId === conta.id)
}

const obterStatusGasto = (conta: ContaFixa) => {
  const g = props.gastos.find(g => g.recurringBillId === conta.id)
  if (!g) return null
  return {
    valorReal: g.valorTotal.centavos / 100,
    pagoPor: g.compradorId
  }
}

const obterNomeMembro = (id?: string) => {
  return props.membros.find(m => m.id === id)?.nome || id
}

const startRipple = (event: PointerEvent) => {
  const card = event.currentTarget as HTMLElement
  if (!card) return

  const existingRipples = card.getElementsByClassName('ripple-effect')
  for (const r of existingRipples) {
    r.remove()
  }

  const rect = card.getBoundingClientRect()
  const circle = document.createElement('span')
  const diameter = Math.max(rect.width, rect.height)
  const radius = diameter / 2

  circle.style.width = circle.style.height = `${diameter}px`
  circle.style.left = `${event.clientX - rect.left - radius}px`
  circle.style.top = `${event.clientY - rect.top - radius}px`
  circle.classList.add('ripple-effect')

  card.appendChild(circle)
  ;(card as any)._activeRipple = circle

  // Forçar reflow
  circle.offsetWidth

  circle.classList.add('is-held')
}

const endRipple = (event: PointerEvent) => {
  const card = event.currentTarget as HTMLElement
  if (!card) return

  const circle = (card as any)._activeRipple as HTMLElement
  if (!circle) return

  circle.classList.add('is-fading')
  delete (card as any)._activeRipple

  setTimeout(() => {
    circle.remove()
  }, 400)
}

const handleCardClick = (bill: ContaFixa) => {
  if (props.isMonthLocked) return
  if (verificarPaga(bill)) {
    emit('estornar', bill)
  } else {
    emit('lancar', bill)
  }
}
</script>

<template>
  <Card class="p-0 overflow-hidden shadow-subtle bg-white text-graphite">
    <!-- Cabeçalho Padronizado -->
    <div class="py-7 px-6 border-b border-stone bg-parchment flex items-center">
      <div class="flex items-center gap-5">
        <div class="w-11 h-11 rounded-xl bg-midnight text-white flex items-center justify-center shadow-sm">
          <Repeat class="w-5 h-5" />
        </div>
        <div>
          <h3 class="font-bold text-lg leading-tight text-charcoal tracking-tight">Contas Fixas</h3>
          <p class="text-[11px] text-ash uppercase tracking-wider mt-0.5 font-medium">
            Recorrentes do mês
          </p>
        </div>
      </div>
    </div>

    <div class="p-6 grid gap-3">
      <!-- Estado Vazio Ilustrado se não houver contas fixas cadastradas -->
      <div v-if="contasFixas.length === 0" class="text-center py-12 border border-dashed border-stone rounded-xl space-y-4 bg-canvas/30">
        <!-- Mascote Verde Meadow com Talão de Notas -->
        <svg viewBox="0 0 100 100" class="w-20 h-20 mx-auto animate-bounce" style="animation-duration: 6s;">
          <path d="M15,50 Q20,15 50,20 Q80,25 85,55 Q90,85 50,80 Q10,75 15,50 Z" fill="var(--color-meadow)" />
          <circle cx="42" cy="45" r="4.5" fill="#000" />
          <circle cx="62" cy="45" r="4.5" fill="#000" />
          <path d="M46,56 Q52,62 58,56" stroke="#000" stroke-width="3" stroke-linecap="round" fill="none" />
          <!-- Clipboard/Talão de Notas -->
          <rect x="25" y="62" width="18" height="22" rx="2" fill="#ffffff" stroke="#000" stroke-width="2" />
          <rect x="29" y="58" width="10" height="4" rx="1" fill="var(--color-ember)" stroke="#000" stroke-width="1.5" />
          <line x1="30" y1="69" x2="40" y2="69" stroke="#000" stroke-width="2" />
          <line x1="30" y1="75" x2="40" y2="75" stroke="#000" stroke-width="2" />
          <!-- Perninhas -->
          <line x1="35" y1="78" x2="25" y2="92" stroke="#000" stroke-width="3" stroke-linecap="round" />
          <line x1="65" y1="78" x2="75" y2="92" stroke="#000" stroke-width="3" stroke-linecap="round" />
        </svg>
        <div class="space-y-1">
          <p class="text-xs font-bold text-charcoal uppercase tracking-wider">Nenhuma conta agendada</p>
          <p class="text-[11px] text-ash max-w-[240px] mx-auto leading-normal">
            Cadastre aluguel, luz ou internet para fazer lançamentos recorrentes rápidos.
          </p>
        </div>
      </div>

      <!-- Widgets de Contas Fixas (Se existirem) -->
      <template v-else>
        <div 
          v-for="bill in contasFixas" 
          :key="bill.id" 
          @click="handleCardClick(bill)"
          @pointerdown="startRipple"
          @pointerup="endRipple"
          @pointerleave="endRipple"
          @pointercancel="endRipple"
          class="group relative flex items-center justify-between p-4 rounded-xl border transition-all duration-300 cursor-pointer select-none ripple-container active:scale-[0.98] md:active:scale-100 transform overflow-hidden"
          :class="[
            verificarPaga(bill) 
              ? 'bg-meadow/5 border-meadow/20 hover:bg-meadow/10 hover:border-meadow/30' 
              : 'bg-canvas border-stone hover:border-ember/30 hover:bg-white',
            isMonthLocked ? 'opacity-80 pointer-events-none' : ''
          ]"
          :data-testid="verificarPaga(bill) ? `estornar-conta-${bill.id}` : `lancar-conta-${bill.id}`"
        >
          <div class="flex items-center gap-4 min-w-0 flex-1">
            <div class="w-10 h-10 rounded-lg bg-card border border-stone flex items-center justify-center text-xl shadow-subtle relative z-10">
              {{ bill.icon }}
            </div>
            <div class="min-w-0 flex-1 relative z-10">
              <span class="font-bold text-sm block text-charcoal truncate tracking-[-0.17px]">{{ bill.name }}</span>
              <div v-if="verificarPaga(bill)" class="flex items-center mt-1">
                <span class="text-[10px] text-meadow font-bold uppercase tracking-wider">
                  R$ {{ obterStatusGasto(bill)?.valorReal.toFixed(2).replace('.', ',') }} por {{ obterNomeMembro(obterStatusGasto(bill)?.pagoPor) }}
                </span>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-2 shrink-0 ml-4 relative z-10">
            <Button 
              variant="secondary" 
              size="icon"
              @click.stop="$emit('configurar', bill)" 
              class="w-8 h-8 rounded-lg border border-stone bg-white hover:bg-canvas transition-colors duration-200"
              :data-testid="`configurar-conta-${bill.id}`"
              :aria-label="`Configurar ${bill.name}`"
              :title="`Configurar ${bill.name}`"
            >
              <Settings class="w-4 h-4 text-ash" />
            </Button>
          </div>
        </div>
      </template>

      <!-- Adicionar Nova Conta -->
      <button 
        @click="$emit('novo')" 
        class="group flex justify-center items-center gap-2 p-4 rounded-xl border border-dashed border-stone hover:border-ember hover:bg-ember/5 transition-all duration-300 text-ash hover:text-ember font-bold text-xs uppercase tracking-widest mt-2"
        data-testid="nova-conta-fixa"
      >
        <Plus class="w-4 h-4 transition-transform group-hover:scale-110" />
        <span>Adicionar conta fixa</span>
      </button>
    </div>
  </Card>
</template>

<style scoped>
.ripple-container {
  position: relative;
  overflow: hidden;
}
:deep(.ripple-effect) {
  position: absolute;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.08);
  pointer-events: none;
  transform: scale(0);
  opacity: 0.15;
  transition: transform 450ms cubic-bezier(0.1, 0.8, 0.3, 1), opacity 350ms ease-out;
}
:deep(.ripple-effect.is-held) {
  transform: scale(2.5);
}
:deep(.ripple-effect.is-fading) {
  opacity: 0;
}
</style>
