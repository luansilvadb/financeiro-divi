<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Gasto } from '../../../modules/ledger/core/domain/Gasto'
import { DivisaoDeGasto } from '../../../modules/ledger/core/domain/DivisaoDeGasto'
import { Dinheiro } from '../../../shared/primitives/Dinheiro'
import SeletorMembros from '../shared/SeletorMembros.vue'
import NonModalBottomSheet from '../../ui/NonModalBottomSheet.vue'

interface Props {
  show: boolean
  gasto: Gasto | null
  membros: { id: string; nome: string }[]
}

const props = defineProps<Props>()
const emit = defineEmits(['close', 'salvar'])

const compradorId = ref('')
const modo = ref<'IGUAL' | 'MANUAL'>('IGUAL')
const participantes = ref<string[]>([])
const valores = ref<Record<string, number>>({})

// Carrega os dados quando o gasto muda
watch(
  () => props.gasto,
  (g) => {
    if (g) {
      compradorId.value = g.compradorId
      participantes.value = g.divisoes.map(d => d.membroId)
      
      const ehSimplificada = g.divisoes.length === 1 && g.divisoes[0].membroId === g.compradorId && g.divisoes[0].valor.centavos === g.valorTotal.centavos
      
      if (ehSimplificada) {
        modo.value = 'IGUAL'
      } else {
        const todosIguais = g.divisoes.every((d, _, arr) => d.valor.centavos === arr[0].valor.centavos)
        modo.value = todosIguais ? 'IGUAL' : 'MANUAL'
      }

      const vals: Record<string, number> = {}
      g.divisoes.forEach(d => {
        vals[d.membroId] = d.valor.centavos / 100
      })
      valores.value = vals
    }
  },
  { immediate: true }
)

const setModo = (newModo: 'IGUAL' | 'MANUAL') => {
  modo.value = newModo
  if (newModo === 'MANUAL') {
    recalcularSugestaoManual()
  }
}

const recalcularSugestaoManual = () => {
  if (!props.gasto) return
  const valorTotalReais = props.gasto.valorTotal.centavos / 100
  const sugerido = Number((valorTotalReais / (participantes.value.length || 1)).toFixed(2))
  const newVals: Record<string, number> = {}
  participantes.value.forEach(id => {
    newVals[id] = sugerido
  })
  valores.value = newVals
}

const valorSugeridoIgual = computed(() => {
  if (!props.gasto || participantes.value.length === 0) return 0
  return (props.gasto.valorTotal.centavos / 100) / participantes.value.length
})

const somaManual = computed(() => {
  return participantes.value.reduce((sum, id) => sum + (valores.value[id] || 0), 0)
})

const erroSoma = computed(() => {
  if (!props.gasto || modo.value === 'IGUAL') return false
  const valorTotalReais = props.gasto.valorTotal.centavos / 100
  return Math.abs(somaManual.value - valorTotalReais) > 0.01
})

const podeSalvar = computed(() => {
  if (!props.gasto) return false
  if (participantes.value.length === 0) return false
  if (modo.value === 'MANUAL' && erroSoma.value) return false
  return true
})

const salvar = () => {
  if (!props.gasto || !podeSalvar.value) return

  const total = props.gasto.valorTotal
  let divisoes: DivisaoDeGasto[] = []

  if (modo.value === 'IGUAL') {
    const partes = total.distribuir(participantes.value.length)
    divisoes = participantes.value.map((id, idx) => new DivisaoDeGasto(id, partes[idx]))
  } else {
    divisoes = participantes.value.map(id => new DivisaoDeGasto(id, Dinheiro.deReais(valores.value[id] || 0)))
  }

  emit('salvar', props.gasto.id, compradorId.value, divisoes)
}
</script>

<template>
  <NonModalBottomSheet :visible="show && props.gasto !== null" width-class="md:w-[460px]">
    <div v-if="props.gasto" class="p-6 sm:p-8 space-y-6 overflow-y-auto custom-scrollbar flex-grow flex flex-col">
        <!-- Header -->
        <div class="flex justify-between items-center border-b border-stone-surface pb-4 shrink-0">
          <div>
            <h3 class="text-lg font-bold text-charcoal">Rateio & Comprador</h3>
            <span class="text-xs text-ash font-bold block mt-1">Ajuste de rateio de forma simples</span>
          </div>
          <button 
            @click="emit('close')"
            class="w-8 h-8 rounded-full bg-stone-surface hover:bg-stone text-ash hover:text-charcoal font-bold flex items-center justify-center transition-all"
          >
            ✕
          </button>
        </div>

        <!-- Info Gasto -->
        <div class="bg-stone-surface border border-stone-surface rounded-cards p-4 flex justify-between items-center shrink-0">
          <div>
            <span class="text-[10px] uppercase font-bold tracking-widest text-ember">Gasto sob Revisão</span>
            <strong class="block text-charcoal text-sm mt-0.5">{{ props.gasto.descricao }}</strong>
          </div>
          <div class="text-right">
            <span class="text-xs font-bold text-ash">Valor</span>
            <strong class="block text-ember text-lg font-bold">R$ {{ (props.gasto.valorTotal.centavos / 100).toFixed(2).replace('.', ',') }}</strong>
          </div>
        </div>

        <div class="space-y-5 overflow-y-auto flex-1 pr-1 custom-scrollbar">
          <!-- 1. Comprador -->
          <div class="space-y-2">
            <label class="text-xs font-bold uppercase text-ash tracking-wider block">Quem Comprou (Dono do gasto)</label>
            <SeletorMembros 
              :membros="props.membros"
              v-model="compradorId"
            />
          </div>

          <!-- 2. Rateio e Divisão -->
          <div class="bg-stone-surface/30 border border-stone-surface rounded-cards p-4 space-y-4">
            <div class="flex justify-between items-center pb-2 border-b border-stone-surface">
              <span class="text-xs font-bold uppercase text-ash tracking-wider">Configurar Rateio</span>
              <div class="flex bg-stone-surface p-0.5 rounded-lg border border-stone-surface">
                <button 
                  type="button"
                  @click="setModo('IGUAL')"
                  :class="[
                    'text-[10px] font-bold px-2.5 py-1 rounded-md transition-all',
                    modo === 'IGUAL' ? 'bg-midnight text-white shadow-sm' : 'text-ash hover:text-charcoal'
                  ]"
                >
                  ⚖️ Igual
                </button>
                <button 
                  type="button"
                  @click="setModo('MANUAL')"
                  :class="[
                    'text-[10px] font-bold px-2.5 py-1 rounded-md transition-all',
                    modo === 'MANUAL' ? 'bg-midnight text-white shadow-sm' : 'text-ash hover:text-charcoal'
                  ]"
                >
                  ✏️ Manual
                </button>
              </div>
            </div>

            <!-- Participantes -->
            <div class="space-y-2">
              <span class="text-xs font-bold text-ash">Quem divide essa conta:</span>
              <SeletorMembros 
                :membros="props.membros"
                v-model="participantes"
                :multiple="true"
                @update:model-value="modo === 'MANUAL' ? recalcularSugestaoManual() : null"
              />
            </div>

            <!-- Valores Detalhados -->
            <div v-if="participantes.length > 0" class="pt-3 border-t border-stone-surface">
              <!-- Modo IGUAL -->
              <div v-if="modo === 'IGUAL'" class="bg-[#fbfaf9] border border-stone-surface p-4 rounded-cards text-center">
                <span class="text-[10px] text-ash font-bold block mb-1">Cada pessoa paga</span>
                <strong class="text-xl font-bold text-charcoal">R$ {{ valorSugeridoIgual.toFixed(2).replace('.', ',') }}</strong>
              </div>

              <!-- Modo MANUAL -->
              <div v-else class="space-y-3">
                <div v-for="id in participantes" :key="id" class="flex justify-between items-center text-xs">
                  <span class="font-bold text-charcoal">{{ props.membros.find(m => m.id === id)?.nome }}</span>
                  <div class="flex items-center gap-1.5">
                    <span class="text-ash font-bold">R$</span>
                    <input 
                      type="number"
                      step="0.01"
                      v-model.number="valores[id]"
                      class="w-24 px-2 py-1.5 text-center font-bold text-charcoal rounded-lg border border-stone-surface bg-[#fbfaf9] focus:border-ember outline-none"
                    />
                  </div>
                </div>

                <!-- Erro de Soma Manual -->
                <div v-if="erroSoma" class="text-[10px] font-bold text-coral-red leading-normal bg-coral-red/5 border border-coral-red/25 p-2 rounded-cards text-center animate-pulse">
                  ⚠️ A soma dos valores (R$ {{ somaManual.toFixed(2).replace('.', ',') }}) deve fechar exatamente R$ {{ (props.gasto.valorTotal.centavos / 100).toFixed(2).replace('.', ',') }}.
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer Buttons -->
        <div class="border-t border-stone-surface pt-4 mt-6 flex gap-3 shrink-0">
          <button 
            @click="emit('close')"
            class="flex-1 py-3 border border-stone-surface bg-[#f6f4ef] hover:bg-stone-surface rounded-buttonspill text-xs font-semibold text-charcoal transition-all active:scale-[0.98]"
          >
            Cancelar
          </button>
          <button 
            @click="salvar"
            :disabled="!podeSalvar"
            :class="[
              'flex-1 py-3 rounded-buttonspill text-xs font-semibold text-white transition-all',
              podeSalvar ? 'bg-midnight hover:bg-charcoal-primary shadow-sm' : 'bg-[#e2dfd9] text-smoke cursor-not-allowed shadow-none'
            ]"
          >
            Salvar Rateio
          </button>
        </div>
    </div>
  </NonModalBottomSheet>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: var(--color-stone-surface);
  border-radius: 9999px;
}
</style>
