<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCartoesEFaturas } from '../../../modules/ledger/composables/useCartoesEFaturas'
import Card from '../../ui/Card.vue'
import { ChevronDown, ChevronUp, Check, CreditCard, Activity } from 'lucide-vue-next'

interface Props {
  membros: { id: string; nome: string }[]
}

const props = defineProps<Props>()

const { faturas, cartoes, gastos, acertos } = useCartoesEFaturas()

const faturasAcertadas = computed(() => {
  return faturas.value.filter(f => f.status === 'ACERTADA')
})

const getCartaoNome = (cartaoId: string) => {
  return cartoes.value.find(c => c.id === cartaoId)?.nome || 'Outro'
}

const getMembroNome = (id: string) => {
  return props.membros.find(m => m.id === id)?.nome || 'Outro'
}

const getGastosFatura = (faturaId: string) => {
  return gastos.value.filter(g => g.faturaId === faturaId)
}

const calcularTotalFatura = (faturaId: string) => {
  return getGastosFatura(faturaId).reduce((sum, g) => sum + g.valorTotal.centavos, 0) / 100
}

const getAcertosFatura = (faturaId: string) => {
  return acertos.value.filter(a => a.faturaId === faturaId)
}

// Controle de qual fatura está expandida
const faturaExpandidaId = ref<string | null>(null)

const toggleFatura = (faturaId: string) => {
  if (faturaExpandidaId.value === faturaId) {
    faturaExpandidaId.value = null
  } else {
    faturaExpandidaId.value = faturaId
  }
}
</script>

<template>
  <div v-if="faturasAcertadas.length > 0" class="space-y-6">
    <!-- Accordion de Faturas -->
    <div class="grid gap-4">
      <Card 
        v-for="f in faturasAcertadas" 
        :key="f.id"
        class="p-0 overflow-hidden bg-card border border-stone-surface shadow-subtle rounded-cards"
      >
        <!-- Header Accordion -->
        <button 
          type="button"
          @click="toggleFatura(f.id)"
          class="w-full flex items-center justify-between p-6 text-left transition-all hover:bg-stone-surface/30 gap-6"
        >
          <div class="flex items-center gap-4">
            <div class="w-10 h-10 rounded-full bg-meadow/5 text-meadow flex items-center justify-center border border-meadow/20">
              <Check class="w-5 h-5" />
            </div>
            <div>
              <p class="text-sm font-bold text-charcoal">
                Fatura de {{ f.periodo.mes }}/{{ f.periodo.ano }}
              </p>
              <p class="text-[11px] text-ash uppercase tracking-wider mt-0.5">
                {{ getCartaoNome(f.cartaoId) }} • Resp: {{ getMembroNome(f.responsavelId) }}
              </p>
            </div>
          </div>

          <div class="flex items-center gap-6">
            <div class="text-right hidden sm:block">
              <p class="text-[10px] text-ash font-bold uppercase tracking-widest">Valor Pago</p>
              <p class="font-display text-lg text-charcoal">R$ {{ calcularTotalFatura(f.id).toFixed(2).replace('.', ',') }}</p>
            </div>

            <div class="flex items-center gap-3">
              <span class="text-[9px] bg-meadow/10 text-meadow border border-meadow/20 font-bold px-3 py-1 rounded-full uppercase tracking-widest hidden md:block">
                Quitada
              </span>
              <ChevronDown v-if="faturaExpandidaId !== f.id" class="w-5 h-5 text-ash" />
              <ChevronUp v-else class="w-5 h-5 text-ash" />
            </div>
          </div>
        </button>

        <!-- Detalhes Expandidos -->
        <div 
          v-if="faturaExpandidaId === f.id"
          class="border-t border-stone-surface p-6 bg-[#fbfaf9] space-y-8 animate-in fade-in slide-in-from-top-2"
        >
          <!-- Extrato Simplificado -->
          <div class="space-y-4">
            <div class="flex items-center gap-2">
              <Activity class="w-3.5 h-3.5 text-ember" />
              <span class="text-[10px] font-bold uppercase text-ash tracking-widest">Extrato de Compras</span>
            </div>
            <div class="grid gap-2">
              <div 
                v-for="g in getGastosFatura(f.id)" 
                :key="g.id"
                class="flex justify-between items-center bg-card border border-stone-surface p-3 rounded-xl text-xs"
              >
                <div class="flex items-center gap-3">
                  <div class="w-7 h-7 rounded-full bg-stone border border-stone-surface font-display text-[10px] flex items-center justify-center text-charcoal">
                    {{ getMembroNome(g.compradorId)[0] }}
                  </div>
                  <div>
                    <p class="text-charcoal font-bold leading-tight">{{ g.descricao }}</p>
                    <p class="text-[10px] text-ash mt-0.5">Por: {{ getMembroNome(g.compradorId) }}</p>
                  </div>
                </div>
                <strong class="text-charcoal font-bold">R$ {{ (g.valorTotal.centavos / 100).toFixed(2).replace('.', ',') }}</strong>
              </div>
            </div>
          </div>

          <!-- Acertos Pix Realizados -->
          <div class="space-y-4">
            <div class="flex items-center gap-2">
              <CreditCard class="w-3.5 h-3.5 text-meadow" />
              <span class="text-[10px] font-bold uppercase text-ash tracking-widest">Reembolsos Pix</span>
            </div>
            <div class="grid gap-2">
              <div 
                v-for="a in getAcertosFatura(f.id)" 
                :key="a.id"
                class="flex justify-between items-center bg-card border border-stone-surface p-4 rounded-xl text-xs"
              >
                <div class="flex items-center gap-4">
                  <div class="w-8 h-8 rounded-full bg-meadow text-white flex items-center justify-center">
                    <Check class="w-4 h-4" />
                  </div>
                  <div>
                    <p class="text-charcoal font-bold">{{ getMembroNome(a.membroId) }} → Resp.</p>
                    <p class="text-[10px] text-meadow font-bold mt-0.5 uppercase tracking-wider">
                      Quitado em {{ a.dataPagamento ? new Date(a.dataPagamento).toLocaleDateString() : 'N/A' }}
                    </p>
                  </div>
                </div>
                <div class="text-right">
                  <p class="text-charcoal font-bold block">R$ {{ (a.valorAcerto.centavos / 100).toFixed(2).replace('.', ',') }}</p>
                  <p class="text-[9px] text-ash font-bold uppercase tracking-widest">Transferido</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  </div>
</template>
