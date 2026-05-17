<script setup lang="ts">
const props = defineProps<{
  membros: { id: string; nome: string }[]
  beneficiarios_selecionados: string[]
  pagamentos: Record<string, number>
  valor: number
  pagamentosEquilibrados: boolean
  restantePagamento: number
}>()

const emit = defineEmits(['toggle-beneficiario', 'marcar-todos', 'limpar', 'update:pagamentos'])

const updatePagamento = (id: string, value: number) => {
  const newPagamentos = { ...props.pagamentos, [id]: value }
  emit('update:pagamentos', newPagamentos)
}
</script>

<template>
  <div key="step3">
    <div class="space-y-6">
      <div class="flex justify-between items-center mb-4">
        <p class="font-bold text-gray-800">Com quem vamos dividir?</p>
        <button 
          @click="beneficiarios_selecionados.length === membros.length ? emit('limpar') : emit('marcar-todos')" 
          class="text-xs font-bold text-green-600 uppercase tracking-tighter"
        >
          {{ beneficiarios_selecionados.length === membros.length ? 'Limpar' : 'Marcar todos' }}
        </button>
      </div>

      <div class="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2 no-scrollbar">
        <div 
          v-for="membro in membros" 
          :key="membro.id"
          @click="emit('toggle-beneficiario', membro.id)"
          class="flex flex-col items-center gap-2 cursor-pointer min-w-[70px]"
        >
          <div :class="['w-16 h-16 rounded-full flex items-center justify-center font-bold text-xl border-4', beneficiarios_selecionados.includes(membro.id) ? 'bg-green-500 border-green-100 text-white' : 'bg-gray-100 border-transparent text-gray-400']">
            {{ membro.nome.charAt(0) }}
          </div>
          <span :class="['text-xs font-bold', beneficiarios_selecionados.includes(membro.id) ? 'text-green-600' : 'text-gray-400']">
            {{ membro.nome.split(' ')[0] }}
          </span>
        </div>
      </div>

      <div class="space-y-4 border-t pt-6">
        <div class="flex justify-between items-center">
          <p class="font-bold text-gray-800">Quem abriu a carteira?</p>
          <div :class="['text-[10px] font-black px-2 py-1 rounded-full', pagamentosEquilibrados ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700']">
            {{ pagamentosEquilibrados ? '✅ Equilibrado' : `Faltam R$ ${restantePagamento.toFixed(2)}` }}
          </div>
        </div>

        <div class="space-y-3">
          <div v-for="membro in membros" :key="membro.id" class="flex items-center gap-4 bg-gray-50/50 p-3 rounded-2xl border border-transparent hover:border-blue-100">
            <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600 text-sm shadow-sm">
              {{ membro.nome.charAt(0) }}
            </div>
            <div class="flex-1">
              <span class="block text-sm font-bold text-gray-700">{{ membro.nome }}</span>
            </div>
            <div class="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-gray-200 focus-within:border-blue-500 shadow-sm">
              <span class="text-[10px] font-bold text-gray-400">R$</span>
              <input 
                :value="pagamentos[membro.id]"
                @input="updatePagamento(membro.id, Number(($event.target as HTMLInputElement).value))"
                type="number" 
                step="0.01"
                class="w-20 text-right font-bold text-gray-800 focus:outline-none bg-transparent text-sm"
                placeholder="0,00"
              />
            </div>
          </div>
        </div>
      </div>

      <div :class="['p-5 rounded-3xl border-2', beneficiarios_selecionados.length > 1 ? 'bg-green-50 border-green-100' : 'bg-amber-50 border-amber-100']">
        <div class="flex justify-between items-center mb-3">
          <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total</span>
          <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Para cada um</span>
        </div>
        <div class="flex justify-between items-baseline">
          <span class="text-lg font-bold text-gray-700">R$ {{ valor.toFixed(2).replace('.', ',') }}</span>
          <span :class="['text-2xl font-black', beneficiarios_selecionados.length > 1 ? 'text-green-600' : 'text-amber-600']">
            R$ {{ (valor / (beneficiarios_selecionados.length || 1)).toFixed(2).replace('.', ',') }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
