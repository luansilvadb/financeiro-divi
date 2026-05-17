<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Gasto } from '../../../modules/ledger/core/domain/Gasto'
import { DivisaoDeGasto } from '../../../modules/ledger/core/domain/DivisaoDeGasto'
import { Dinheiro } from '../../../shared/primitives/Dinheiro'
import SeletorMembros from '../shared/SeletorMembros.vue'

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
      
      // Se há apenas uma divisão com 100% no comprador, é uma divisão simplificada (não dividida de fato)
      const ehSimplificada = g.divisoes.length === 1 && g.divisoes[0].membroId === g.compradorId && g.divisoes[0].valor.centavos === g.valorTotal.centavos
      
      if (ehSimplificada) {
        modo.value = 'IGUAL'
      } else {
        // Testa se os valores são iguais para inferir o modo
        const todosIguais = g.divisoes.every((d, _, arr) => d.valor.centavos === arr[0].valor.centavos)
        modo.value = todosIguais ? 'IGUAL' : 'MANUAL'
      }

      // Preenche os valores manuais
      const vals: Record<string, number> = {}
      g.divisoes.forEach(d => {
        vals[d.membroId] = d.valor.centavos / 100
      })
      valores.value = vals
    }
  },
  { immediate: true }
)

// toggleParticipante foi removido pois SeletorMembros gerencia isso nativamente com v-model

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
  <div 
    v-if="show && props.gasto" 
    class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
  >
    <div class="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 border border-slate-100 flex flex-col max-h-[90vh]">
      <!-- Header -->
      <div class="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
        <div>
          <h3 class="text-lg font-black text-gray-800">Rateio & Comprador</h3>
          <span class="text-xs text-gray-400 font-bold block mt-1">Ajuste de rateio de forma simples</span>
        </div>
        <button 
          @click="emit('close')"
          class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-gray-500 font-bold flex items-center justify-center"
        >
          ✕
        </button>
      </div>

      <!-- Info Gasto -->
      <div class="bg-blue-50/30 border border-blue-100/50 rounded-2xl p-4 mb-5 flex justify-between items-center">
        <div>
          <span class="text-[10px] uppercase font-black tracking-widest text-blue-400">Gasto sob Revisão</span>
          <strong class="block text-gray-800 text-sm mt-0.5">{{ props.gasto.descricao }}</strong>
        </div>
        <div class="text-right">
          <span class="text-xs font-bold text-gray-400">Valor</span>
          <strong class="block text-blue-600 text-lg font-black">R$ {{ (props.gasto.valorTotal.centavos / 100).toFixed(2).replace('.', ',') }}</strong>
        </div>
      </div>

      <div class="space-y-5 overflow-y-auto flex-1 pr-1">
        <!-- 1. Comprador -->
        <div class="space-y-2">
          <label class="text-xs font-black uppercase text-gray-400 tracking-wider block">Quem Comprou (Dono do gasto)</label>
          <SeletorMembros 
            :membros="props.membros"
            v-model="compradorId"
          />
        </div>

        <!-- 2. Rateio e Divisão -->
        <div class="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 space-y-4">
          <div class="flex justify-between items-center pb-2 border-b border-slate-100">
            <span class="text-xs font-black uppercase text-gray-400 tracking-wider">Configurar Rateio</span>
            <div class="flex bg-slate-200/50 p-0.5 rounded-lg">
              <button 
                type="button"
                @click="setModo('IGUAL')"
                :class="[
                  'text-[10px] font-black px-2.5 py-1 rounded-md transition-all',
                  modo === 'IGUAL' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                ]"
              >
                ⚖️ Igual
              </button>
              <button 
                type="button"
                @click="setModo('MANUAL')"
                :class="[
                  'text-[10px] font-black px-2.5 py-1 rounded-md transition-all',
                  modo === 'MANUAL' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                ]"
              >
                ✏️ Manual
              </button>
            </div>
          </div>

          <!-- Participantes -->
          <div class="space-y-2">
            <span class="text-xs font-bold text-gray-400">Quem divide essa conta:</span>
            <SeletorMembros 
              :membros="props.membros"
              v-model="participantes"
              :multiple="true"
              @update:model-value="modo === 'MANUAL' ? recalcularSugestaoManual() : null"
            />
          </div>

          <!-- Valores Detalhados -->
          <div v-if="participantes.length > 0" class="pt-3 border-t border-slate-100">
            <!-- Modo IGUAL -->
            <div v-if="modo === 'IGUAL'" class="bg-white border border-slate-100 p-4 rounded-xl text-center">
              <span class="text-[10px] text-gray-400 font-bold block mb-1">Cada pessoa paga</span>
              <strong class="text-xl font-black text-blue-600">R$ {{ valorSugeridoIgual.toFixed(2).replace('.', ',') }}</strong>
            </div>

            <!-- Modo MANUAL -->
            <div v-else class="space-y-3">
              <div v-for="id in participantes" :key="id" class="flex justify-between items-center text-xs">
                <span class="font-bold text-gray-600">{{ props.membros.find(m => m.id === id)?.nome }}</span>
                <div class="flex items-center gap-1.5">
                  <span class="text-gray-400 font-bold">R$</span>
                  <input 
                    type="number"
                    step="0.01"
                    v-model.number="valores[id]"
                    class="w-24 bg-white border border-slate-200 rounded-lg p-1.5 text-center font-black text-gray-800 focus:outline-none focus:border-blue-500 shadow-sm"
                  />
                </div>
              </div>

              <!-- Soma manual erro -->
              <div v-if="erroSoma" class="text-[10px] font-bold text-rose-500 leading-normal bg-rose-50 border border-rose-100 p-2 rounded-xl text-center">
                ⚠️ A soma dos valores (R$ {{ somaManual.toFixed(2).replace('.', ',') }}) deve fechar exatamente R$ {{ (props.gasto.valorTotal.centavos / 100).toFixed(2).replace('.', ',') }}.
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer Buttons -->
      <div class="border-t border-slate-100 pt-4 mt-6 flex gap-3">
        <button 
          @click="emit('close')"
          class="flex-1 py-3.5 border-2 border-slate-100 hover:border-slate-200 rounded-2xl text-xs font-black text-gray-500 transition-all"
        >
          Cancelar
        </button>
        <button 
          @click="salvar"
          :disabled="!podeSalvar"
          :class="[
            'flex-1 py-3.5 rounded-2xl text-xs font-black text-white transition-all shadow-md',
            podeSalvar ? 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg' : 'bg-slate-300 cursor-not-allowed shadow-none'
          ]"
        >
          Salvar Rateio
        </button>
      </div>
    </div>
  </div>
</template>
