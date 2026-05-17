<script setup lang="ts">
import { Dinheiro } from '../../shared/primitives/Dinheiro'

interface Props {
  membros: { id: string; nome: string }[]
  faturasAbertas: any[]
  faturasFechadas: any[]
  acertosPendentes: any[]
  cartoes: any[]
  calcularConsumo: (faturaId: string, membroId: string) => number
}

const props = defineProps<Props>()
const emit = defineEmits(['quitarAcerto', 'fecharFatura', 'novoGasto', 'reabrirFatura'])

const getMembroNome = (id: string) => {
  return props.membros.find(m => m.id === id)?.nome || id
}

const getCartaoNome = (cartaoId: string) => {
  return props.cartoes.find(c => c.id === cartaoId)?.nome || 'Cartão'
}

const acertosDaFatura = (faturaId: string) => {
  return props.acertosPendentes.filter(a => a.faturaId === faturaId && !a.pago)
}

const formatarDinheiro = (centavos: number) => {
  return Dinheiro.deCentavos(centavos).centavos / 100
}
</script>

<template>
  <div class="max-w-md mx-auto space-y-6">
    <!-- Seção 1: Faturas Fechadas (Acertos Ativos) -->
    <div v-if="faturasFechadas.length > 0" class="bg-amber-50 rounded-2xl p-6 border border-amber-200 shadow-sm">
      <h3 class="text-xs font-bold text-amber-800 uppercase tracking-wider mb-4">⚠️ Faturas Fechadas (Acertos Pendentes)</h3>
      
      <div v-for="fatura in faturasFechadas" :key="fatura.id" class="space-y-4 mb-4 last:mb-0">
        <div class="flex justify-between items-center border-b border-amber-200/50 pb-2">
          <div class="flex flex-col">
            <span class="font-bold text-slate-800 text-sm">💳 {{ getCartaoNome(fatura.cartaoId) }} • {{ fatura.periodo.mes }}/{{ fatura.periodo.ano }}</span>
            <span class="text-[10px] text-amber-700 font-semibold uppercase tracking-wider">Responsável: {{ getMembroNome(fatura.responsavelId) }}</span>
          </div>
          <button 
            @click="emit('reabrirFatura', fatura.id)"
            class="text-[11px] font-bold text-amber-700 hover:text-amber-900 bg-amber-200/40 hover:bg-amber-200/70 px-2 py-1 rounded-lg transition-all border border-amber-300/30 flex items-center gap-1 shadow-sm"
          >
            ↩️ Desfazer
          </button>
        </div>

        <div v-for="acerto in acertosDaFatura(fatura.id)" :key="acerto.id" class="flex justify-between items-center bg-white p-3 rounded-xl border border-amber-100 shadow-sm">
          <div>
            <span class="font-bold text-slate-800 text-sm">{{ getMembroNome(acerto.membroId) }} deve para {{ getMembroNome(fatura.responsavelId) }}</span>
          </div>
          <div class="flex items-center gap-3">
            <span class="text-red-600 font-extrabold">R$ {{ formatarDinheiro(acerto.valorAcerto.centavos).toFixed(2).replace('.', ',') }}</span>
            <button @click="emit('quitarAcerto', acerto.id)" class="bg-indigo-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-indigo-500 transition-colors shadow-sm">Quitar</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Seção 2: Faturas Abertas (Previsão de Gastos) -->
    <div class="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
      <h3 class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">🔍 Faturas Abertas (Previsão de Gastos)</h3>
      
      <div v-for="fatura in faturasAbertas" :key="fatura.id" class="border-b border-slate-100 last:border-0 pb-4 mb-4 last:pb-0 last:mb-0">
        <div class="flex justify-between items-center mb-3">
          <span class="font-bold text-slate-800">💳 {{ getCartaoNome(fatura.cartaoId) }} • {{ fatura.periodo.mes }}/{{ fatura.periodo.ano }}</span>
          <button @click="emit('fecharFatura', fatura.id)" class="text-xs font-bold bg-slate-800 text-white px-3 py-1 rounded-lg hover:bg-slate-700 shadow-sm transition-colors">Fechar Fatura</button>
        </div>

        <div class="space-y-2">
          <div v-for="membro in membros" :key="membro.id" class="flex justify-between items-center text-sm">
            <span class="text-slate-600">{{ membro.nome }} <span v-if="membro.id === fatura.responsavelId" class="text-xs text-indigo-500 font-semibold">(Responsável)</span>:</span>
            <span class="font-semibold text-slate-800">R$ {{ formatarDinheiro(calcularConsumo(fatura.id, membro.id)).toFixed(2).replace('.', ',') }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
