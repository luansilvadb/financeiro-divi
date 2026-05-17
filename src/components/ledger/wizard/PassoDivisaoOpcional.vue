<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  membros: { id: string; nome: string }[]
  valorTotal: number
  compradorId: string
  querDividir: boolean
  participantes: string[]
  modo: 'IGUAL' | 'MANUAL'
  valores: Record<string, number>
}

const props = defineProps<Props>()
const emit = defineEmits([
  'update:querDividir',
  'update:participantes',
  'update:modo',
  'update:valores'
])

const toggleDividir = (val: boolean) => {
  emit('update:querDividir', val)
  if (val && props.participantes.length === 0) {
    // Ao ativar, pré-seleciona todos por padrão
    emit('update:participantes', props.membros.map(m => m.id))
  }
}

const toggleParticipante = (id: string) => {
  const list = [...props.participantes]
  const idx = list.indexOf(id)
  if (idx >= 0) {
    list.splice(idx, 1)
  } else {
    list.push(id)
  }
  emit('update:participantes', list)
}

const setModo = (modoVal: 'IGUAL' | 'MANUAL') => {
  emit('update:modo', modoVal)
  if (modoVal === 'MANUAL') {
    // Inicializa valores manuais divididos igualmente como sugestão
    const valorSugerido = Number((props.valorTotal / (props.participantes.length || 1)).toFixed(2))
    const record: Record<string, number> = {}
    props.participantes.forEach(id => {
      record[id] = valorSugerido
    })
    emit('update:valores', record)
  }
}

const updateValorMembro = (id: string, val: number) => {
  const newVals = { ...props.valores, [id]: val }
  emit('update:valores', newVals)
}

const valorSugeridoIgual = computed(() => {
  if (props.participantes.length === 0) return 0
  return props.valorTotal / props.participantes.length
})

const somaManual = computed(() => {
  return props.participantes.reduce((sum, id) => sum + (props.valores[id] || 0), 0)
})

const erroSoma = computed(() => {
  if (props.modo === 'IGUAL') return false
  return Math.abs(somaManual.value - props.valorTotal) > 0.01
})
</script>

<template>
  <div class="space-y-6">
    <h2 class="text-xl font-bold mb-6 text-gray-800 text-center">Quer dividir essa compra agora?</h2>

    <!-- Opções de sim/não -->
    <div class="flex gap-4">
      <button 
        type="button"
        @click="toggleDividir(false)"
        :class="[
          'flex-1 p-4 border-2 rounded-2xl text-center font-bold text-sm transition-all',
          !querDividir 
            ? 'border-blue-600 bg-blue-50/20 text-blue-700 shadow-sm' 
            : 'border-slate-100 hover:border-blue-600/30 text-gray-600'
        ]"
      >
        ❌ Não, depois
        <span class="block text-[10px] text-gray-400 font-normal mt-1">100% no comprador por enquanto</span>
      </button>

      <button 
        type="button"
        @click="toggleDividir(true)"
        :class="[
          'flex-1 p-4 border-2 rounded-2xl text-center font-bold text-sm transition-all',
          querDividir 
            ? 'border-blue-600 bg-blue-50/20 text-blue-700 shadow-sm' 
            : 'border-slate-100 hover:border-blue-600/30 text-gray-600'
        ]"
      >
        ✂️ Sim, dividir agora
        <span class="block text-[10px] text-gray-400 font-normal mt-1">Definir rateio do grupo</span>
      </button>
    </div>

    <!-- Painel de Divisão Opcional -->
    <div v-if="querDividir" class="bg-slate-50/50 border-2 border-slate-100 rounded-3xl p-5 space-y-5">
      <!-- Selector de Modo -->
      <div class="flex justify-between items-center border-b border-slate-100 pb-3">
        <span class="text-xs font-black uppercase text-gray-400 tracking-wider">Tipo de Rateio</span>
        <div class="flex bg-slate-200/60 p-0.5 rounded-lg">
          <button 
            type="button"
            @click="setModo('IGUAL')"
            :class="[
              'text-[10px] font-black px-3 py-1.5 rounded-md transition-all',
              modo === 'IGUAL' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-800'
            ]"
          >
            ⚖️ Igual
          </button>
          <button 
            type="button"
            @click="setModo('MANUAL')"
            :class="[
              'text-[10px] font-black px-3 py-1.5 rounded-md transition-all',
              modo === 'MANUAL' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-800'
            ]"
          >
            ✏️ Manual
          </button>
        </div>
      </div>

      <!-- Grid de Participantes -->
      <div class="space-y-3">
        <div class="text-xs font-bold text-gray-400">Participantes do Rateio:</div>
        <div class="grid grid-cols-3 gap-3">
          <button 
            v-for="m in props.membros" 
            :key="m.id"
            type="button"
            @click="toggleParticipante(m.id)"
            :class="[
              'p-3 border-2 rounded-2xl flex flex-col items-center gap-2 transition-all relative overflow-hidden',
              participantes.includes(m.id) 
                ? 'border-blue-600 bg-blue-50/30' 
                : 'border-slate-100/50 hover:border-blue-600/30'
            ]"
          >
            <div 
              :class="[
                'w-10 h-10 rounded-full flex items-center justify-center font-black text-sm',
                participantes.includes(m.id) ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
              ]"
            >
              {{ m.nome[0].toUpperCase() }}
            </div>
            <span class="font-bold text-[11px] text-gray-800 truncate w-full text-center">{{ m.nome }}</span>
            <span v-if="m.id === props.compradorId" class="absolute top-1 right-1 text-[8px] bg-indigo-100 text-indigo-800 font-bold px-1 rounded">Comprador</span>
          </button>
        </div>
      </div>

      <!-- Detalhamento dos valores -->
      <div v-if="participantes.length > 0" class="space-y-3 pt-3 border-t border-slate-100">
        <!-- Modo IGUAL -->
        <div v-if="modo === 'IGUAL'" class="bg-white border border-slate-100 p-4 rounded-2xl text-center">
          <div class="text-xs text-gray-400 font-bold mb-1">Cada um vai pagar</div>
          <div class="text-2xl font-black text-blue-600">
            R$ {{ valorSugeridoIgual.toFixed(2).replace('.', ',') }}
          </div>
          <div class="text-[10px] text-gray-400 mt-2 leading-relaxed">
            Total de R$ {{ valorTotal.toFixed(2).replace('.', ',') }} dividido entre os {{ participantes.length }} selecionados.
          </div>
        </div>

        <!-- Modo MANUAL -->
        <div v-else class="space-y-3">
          <div class="text-xs font-bold text-gray-400">Valores Individuais:</div>
          <div v-for="id in participantes" :key="id" class="flex justify-between items-center text-xs">
            <span class="font-bold text-gray-700">{{ props.membros.find(m => m.id === id)?.nome }}</span>
            <div class="flex items-center gap-1.5">
              <span class="text-gray-400 font-bold">R$</span>
              <input 
                :value="valores[id] || 0"
                @input="updateValorMembro(id, Number(($event.target as HTMLInputElement).value))"
                type="number"
                step="0.01"
                class="w-24 bg-white border border-slate-200 rounded-xl p-2 text-center font-black text-gray-800 focus:outline-none focus:border-blue-500 text-xs shadow-sm"
              />
            </div>
          </div>

          <!-- Validação de soma manual -->
          <div v-if="erroSoma" class="text-[10px] font-black text-rose-500 text-center leading-relaxed bg-rose-50 border border-rose-100 p-2.5 rounded-xl">
            ⚠️ A soma dos valores (R$ {{ somaManual.toFixed(2).replace('.', ',') }}) deve ser exatamente igual ao total (R$ {{ valorTotal.toFixed(2).replace('.', ',') }}).<br>
            Diferença: R$ {{ Math.abs(somaManual - valorTotal).toFixed(2).replace('.', ',') }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
