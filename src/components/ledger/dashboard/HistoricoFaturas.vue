<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCartoesEFaturas } from '../../../modules/ledger/composables/useCartoesEFaturas'

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
  <div v-if="faturasAcertadas.length > 0" class="space-y-4">
    <div class="flex justify-between items-center border-b border-divi-border pb-2">
      <span class="text-xs font-black uppercase text-divi-t2 tracking-wider">Histórico de Faturas Acertadas</span>
      <span class="text-xs text-divi-t2 font-bold bg-divi-s2 border border-divi-border px-2.5 py-1 rounded-full">
        {{ faturasAcertadas.length }} faturas anteriores
      </span>
    </div>

    <!-- Accordion de Faturas -->
    <div class="space-y-3">
      <div 
        v-for="f in faturasAcertadas" 
        :key="f.id"
        class="glass-card border border-divi-border rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all"
      >
        <!-- Header Accordion -->
        <button 
          type="button"
          @click="toggleFatura(f.id)"
          class="w-full flex flex-col md:flex-row md:items-center md:justify-between p-5 text-left transition-all hover:bg-divi-s1/30 gap-4"
        >
          <div class="flex items-center gap-4">
            <div class="w-10 h-10 rounded-full bg-divi-emerald-dim/15 text-divi-emerald font-black text-xs flex items-center justify-center border border-divi-emerald/20 shadow-[0_0_12px_var(--emerald-glow)]">
              ✓
            </div>
            <div>
              <strong class="text-sm font-bold text-divi-t1">
                Fatura de {{ f.periodo.mes }}/{{ f.periodo.ano }}
              </strong>
              <span class="text-xs text-divi-t2 font-medium block mt-0.5">
                Cartão: {{ getCartaoNome(f.cartaoId) }} • Responsável: {{ getMembroNome(f.responsavelId) }}
              </span>
            </div>
          </div>

          <div class="flex items-center justify-between md:justify-end gap-5">
            <div class="text-right">
              <span class="text-[10px] text-divi-t2 font-bold block uppercase">Valor Total</span>
              <strong class="text-sm font-black text-divi-t1">R$ {{ calcularTotalFatura(f.id).toFixed(2).replace('.', ',') }}</strong>
            </div>

            <div class="flex items-center gap-3">
              <span class="text-[10px] bg-divi-emerald-dim/15 text-divi-emerald border border-divi-emerald/20 font-black px-2 py-1 rounded-full uppercase tracking-wider">
                Acertada
              </span>
              <span 
                :class="[
                  'text-xs font-bold text-divi-t2 transition-all transform',
                  faturaExpandidaId === f.id ? 'rotate-180' : ''
                ]"
              >
                ▼
              </span>
            </div>
          </div>
        </button>

        <!-- Detalhes Expandidos -->
        <div 
          v-if="faturaExpandidaId === f.id"
          class="border-t border-divi-border p-5 bg-divi-s1/30 space-y-6"
        >
          <!-- Extrato Simplificado -->
          <div class="space-y-3">
            <span class="text-[10px] font-black uppercase text-divi-t2 tracking-wider block">Extrato de Compras</span>
            <div class="space-y-2">
              <div 
                v-for="g in getGastosFatura(f.id)" 
                :key="g.id"
                class="flex justify-between items-center bg-divi-s1/50 border border-divi-border p-3 rounded-2xl text-xs"
              >
                <div class="flex items-center gap-3">
                  <div class="w-6 h-6 rounded-full bg-divi-s2 border border-divi-border font-black text-[9px] flex items-center justify-center text-divi-t2 shadow-[0_0_10px_rgba(255,255,255,0.05)]">
                    {{ getMembroNome(g.compradorId)[0].toUpperCase() }}
                  </div>
                  <div>
                    <strong class="text-divi-t1 font-bold">{{ g.descricao }}</strong>
                    <span class="text-[9px] text-divi-t3 block mt-0.5">Comprado por: {{ getMembroNome(g.compradorId) }}</span>
                  </div>
                </div>
                <strong class="text-divi-t1 font-black">R$ {{ (g.valorTotal.centavos / 100).toFixed(2).replace('.', ',') }}</strong>
              </div>
            </div>
          </div>

          <!-- Acertos Pix Realizados -->
          <div class="space-y-3">
            <span class="text-[10px] font-black uppercase text-divi-t2 tracking-wider block">Acertos Pix Realizados</span>
            <div class="space-y-2">
              <div 
                v-for="a in getAcertosFatura(f.id)" 
                :key="a.id"
                class="flex justify-between items-center bg-divi-s1/50 border border-divi-border p-4 rounded-2xl text-xs"
              >
                <div class="flex items-center gap-3">
                  <div class="w-6 h-6 rounded-full bg-divi-emerald-dim/15 text-divi-emerald border border-divi-emerald/20 font-black text-[9px] flex items-center justify-center">
                    ✓
                  </div>
                  <div>
                    <strong class="text-divi-t1 font-bold">Acerto Pix de {{ getMembroNome(a.membroId) }}</strong>
                    <span class="text-[9px] text-divi-emerald font-black block mt-0.5">
                      Quitado em {{ a.dataPagamento ? new Date(a.dataPagamento).toLocaleDateString() : 'N/A' }}
                    </span>
                  </div>
                </div>
                <div class="text-right">
                  <strong class="text-divi-t1 font-black block">R$ {{ (a.valorAcerto.centavos / 100).toFixed(2).replace('.', ',') }}</strong>
                  <span class="text-[8px] text-divi-emerald text-glow-emerald font-black uppercase">100% Pago</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
