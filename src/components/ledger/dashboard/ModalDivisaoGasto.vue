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
    class="fixed inset-0 bg-[#040814]/85 backdrop-blur-md z-[9999] flex items-center justify-center p-4"
  >
    <div class="glass-card w-full max-w-md rounded-3xl shadow-2xl p-6 border border-divi-border flex flex-col max-h-[90vh] text-divi-t1">
      <!-- Header -->
      <div class="flex justify-between items-center mb-6 border-b border-divi-border pb-4">
        <div>
          <h3 class="text-lg font-black text-divi-t1">Rateio & Comprador</h3>
          <span class="text-xs text-divi-t2 font-bold block mt-1">Ajuste de rateio de forma simples</span>
        </div>
        <button 
          @click="emit('close')"
          class="w-8 h-8 rounded-full bg-divi-s2 hover:bg-divi-s3 text-divi-t2 hover:text-divi-t1 font-bold flex items-center justify-center transition-all"
        >
          ✕
        </button>
      </div>

      <!-- Info Gasto -->
      <div class="bg-divi-s1 border border-divi-border rounded-2xl p-4 mb-5 flex justify-between items-center">
        <div>
          <span class="text-[10px] uppercase font-black tracking-widest text-divi-primary">Gasto sob Revisão</span>
          <strong class="block text-divi-t1 text-sm mt-0.5">{{ props.gasto.descricao }}</strong>
        </div>
        <div class="text-right">
          <span class="text-xs font-bold text-divi-t2">Valor</span>
          <strong class="block text-divi-primary text-lg font-black text-glow-primary">R$ {{ (props.gasto.valorTotal.centavos / 100).toFixed(2).replace('.', ',') }}</strong>
        </div>
      </div>

      <div class="space-y-5 overflow-y-auto flex-1 pr-1">
        <!-- 1. Comprador -->
        <div class="space-y-2">
          <label class="text-xs font-black uppercase text-divi-t2 tracking-wider block">Quem Comprou (Dono do gasto)</label>
          <SeletorMembros 
            :membros="props.membros"
            v-model="compradorId"
          />
        </div>

        <!-- 2. Rateio e Divisão -->
        <div class="bg-divi-s1/30 border border-divi-border rounded-2xl p-4 space-y-4">
          <div class="flex justify-between items-center pb-2 border-b border-divi-border">
            <span class="text-xs font-black uppercase text-divi-t2 tracking-wider">Configurar Rateio</span>
            <div class="flex bg-divi-s2 p-0.5 rounded-lg border border-divi-border">
              <button 
                type="button"
                @click="setModo('IGUAL')"
                :class="[
                  'text-[10px] font-black px-2.5 py-1 rounded-md transition-all',
                  modo === 'IGUAL' ? 'bg-divi-primary text-white shadow-sm shadow-[0_0_12px_var(--primary-glow)]' : 'text-divi-t2 hover:text-divi-t1'
                ]"
              >
                ⚖️ Igual
              </button>
              <button 
                type="button"
                @click="setModo('MANUAL')"
                :class="[
                  'text-[10px] font-black px-2.5 py-1 rounded-md transition-all',
                  modo === 'MANUAL' ? 'bg-divi-primary text-white shadow-sm shadow-[0_0_12px_var(--primary-glow)]' : 'text-divi-t2 hover:text-divi-t1'
                ]"
              >
                ✏️ Manual
              </button>
            </div>
          </div>

          <!-- Participantes -->
          <div class="space-y-2">
            <span class="text-xs font-bold text-divi-t2">Quem divide essa conta:</span>
            <SeletorMembros 
              :membros="props.membros"
              v-model="participantes"
              :multiple="true"
              @update:model-value="modo === 'MANUAL' ? recalcularSugestaoManual() : null"
            />
          </div>

          <!-- Valores Detalhados -->
          <div v-if="participantes.length > 0" class="pt-3 border-t border-divi-border">
            <!-- Modo IGUAL -->
            <div v-if="modo === 'IGUAL'" class="bg-divi-s1 border border-divi-border p-4 rounded-xl text-center">
              <span class="text-[10px] text-divi-t2 font-bold block mb-1">Cada pessoa paga</span>
              <strong class="text-xl font-black text-divi-primary text-glow-primary">R$ {{ valorSugeridoIgual.toFixed(2).replace('.', ',') }}</strong>
            </div>

            <!-- Modo MANUAL -->
            <div v-else class="space-y-3">
              <div v-for="id in participantes" :key="id" class="flex justify-between items-center text-xs">
                <span class="font-bold text-divi-t1">{{ props.membros.find(m => m.id === id)?.nome }}</span>
                <div class="flex items-center gap-1.5">
                  <span class="text-divi-t2 font-bold">R$</span>
                  <input 
                    type="number"
                    step="0.01"
                    v-model.number="valores[id]"
                    class="w-24 px-2 py-1.5 text-center font-bold text-divi-t1 rounded-lg glass-input outline-none"
                  />
                </div>
              </div>

              <!-- Soma manual erro -->
              <div v-if="erroSoma" class="text-[10px] font-bold text-divi-rose leading-normal bg-divi-rose-dim/15 border border-divi-rose/25 p-2 rounded-xl text-center">
                ⚠️ A soma dos valores (R$ {{ somaManual.toFixed(2).replace('.', ',') }}) deve fechar exatamente R$ {{ (props.gasto.valorTotal.centavos / 100).toFixed(2).replace('.', ',') }}.
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer Buttons -->
      <div class="border-t border-divi-border pt-4 mt-6 flex gap-3">
        <button 
          @click="emit('close')"
          class="flex-1 py-3.5 border border-divi-border bg-divi-s2 hover:bg-divi-s3 rounded-2xl text-xs font-black text-divi-t1 transition-all"
        >
          Cancelar
        </button>
        <button 
          @click="salvar"
          :disabled="!podeSalvar"
          :class="[
            'flex-1 py-3.5 rounded-2xl text-xs font-black text-white transition-all shadow-md',
            podeSalvar ? 'bg-divi-primary hover:bg-indigo-500 shadow-[0_0_16px_var(--primary-glow)] border border-indigo-400/25' : 'bg-divi-s1 border border-divi-border text-divi-t3 cursor-not-allowed shadow-none'
          ]"
        >
          Salvar Rateio
        </button>
      </div>
    </div>
  </div>
</template>
