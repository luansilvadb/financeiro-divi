<script setup lang="ts">
import { ref, computed } from 'vue'
import { Dinheiro } from '../../../shared/primitives/Dinheiro'
import { Transacao } from '../../../modules/ledger/core/domain/Transacao'

interface ItemExtrato {
  id: string
  descricao: string
  data: Date
  valorPago: Dinheiro
  valorConsumido: Dinheiro
  valorLiquido: Dinheiro
  saldoAcumulado: Dinheiro
  transacao: Transacao
}

const props = defineProps<{
  item: ItemExtrato
  membros: { id: string; nome: string }[]
}>()

const isExpanded = ref(false)

const formatDataCurta = (date: Date) => {
  return new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).toUpperCase()
}

const formatarDinheiro = (valor: Dinheiro) => {
  return valor.formatar()
}

const getMembroNome = (id: string) => {
  return props.membros.find(m => m.id === id)?.nome || id
}

const toggleDetails = () => {
  isExpanded.value = !isExpanded.value
}

const pagamentosDetalhados = computed(() => {
  const t = props.item.transacao
  return props.membros
    .filter(m => t.pagamentos.some(p => p.membro_id === m.id) || t.divisoes.some(d => d.beneficiario_id === m.id))
    .map(m => ({
      nome: m.nome,
      valor: t.pagamentos.find(p => p.membro_id === m.id)?.valor || Dinheiro.deCentavos(0)
    }))
})
</script>

<template>
  <div class="bg-[#FAFAFA] rounded-[24px] shadow-sm border border-slate-100 relative overflow-hidden flex flex-col mb-4">
    <!-- Borda Semântica Lateral -->
    <div :class="['absolute top-0 left-0 w-1.5 h-full', 
                   item.valorLiquido.centavos > 0 ? 'bg-emerald-500' : (item.valorLiquido.centavos === 0 ? 'bg-slate-300' : 'bg-red-500')]"></div>

    <!-- Nível 1: Cabeçalho -->
    <div class="p-6 pb-4 flex justify-between items-center">
      <div class="flex-1">
        <h2 class="text-[17px] font-bold text-slate-800 leading-tight">{{ item.descricao }}</h2>
        <span :class="['inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-black mt-2 uppercase tracking-tighter border',
                        item.valorLiquido.centavos > 0 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                        (item.valorLiquido.centavos === 0 ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-red-50 text-red-600 border-red-100')]">
          {{ item.valorLiquido.centavos > 0 ? 'CRÉDITO' : (item.valorLiquido.centavos === 0 ? 'NEUTRO' : 'DÉBITO') }}
        </span>
      </div>
      <div class="text-right">
        <div :class="['text-2xl font-mono font-black tracking-tighter', 
                      item.valorLiquido.centavos > 0 ? 'text-emerald-600' : (item.valorLiquido.centavos === 0 ? 'text-slate-400' : 'text-red-600')]">
          {{ item.valorLiquido.centavos > 0 ? '+' : '' }}{{ formatarDinheiro(item.valorLiquido).replace('R$', '').trim() }}
        </div>
        <p class="text-[10px] font-bold text-slate-300 mt-1 uppercase tracking-widest">{{ formatDataCurta(item.data) }}</p>
      </div>
    </div>

    <!-- Nível 2: Grid de Fluxo -->
    <div class="mx-6 py-5 flex border-t border-slate-50">
      <div class="flex-1 space-y-1 pr-4 border-r border-slate-50">
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Você Pagou</span>
        <p class="text-sm font-mono font-bold text-slate-800">{{ formatarDinheiro(item.valorPago) }}</p>
      </div>
      <div class="flex-1 space-y-1 pl-6">
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sua Parte</span>
        <p class="text-sm font-mono font-bold text-slate-800">{{ formatarDinheiro(item.valorConsumido) }}</p>
      </div>
    </div>

    <!-- Nível 2: Avatares e Botão Detalhes -->
    <div class="px-6 pb-6 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <div class="flex -space-x-2">
          <div v-for="pagador in pagamentosDetalhados.slice(0, 3)" :key="pagador.nome"
               class="w-7 h-7 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-600 uppercase">
            {{ pagador.nome.substring(0, 1) }}
          </div>
        </div>
        <span v-if="pagamentosDetalhados.length > 3" class="text-[10px] font-bold text-slate-400">
          +{{ pagamentosDetalhados.length - 3 }} outros
        </span>
      </div>
      <button @click="toggleDetails" 
              class="flex items-center gap-1.5 py-1.5 px-4 rounded-full bg-slate-50 text-[10px] font-bold text-slate-600 border border-slate-100">
        {{ isExpanded ? 'OCULTAR' : 'DETALHES' }}
        <svg :class="['w-3 h-3 transition-transform', isExpanded ? 'rotate-180' : '']" 
             fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M19 9l-7 7-7-7" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>

    <!-- Nível 3: Auditoria -->
    <div v-if="isExpanded" class="bg-slate-50/80 border-y border-slate-100 p-6 space-y-5">
      <div class="flex justify-between items-center">
        <span class="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Total Bruto da Nota</span>
        <span class="text-sm font-mono font-bold text-slate-900">{{ formatarDinheiro(item.transacao.total) }}</span>
      </div>

      <div class="space-y-4">
        <div v-for="p in pagamentosDetalhados" :key="p.nome" class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 border border-white shadow-sm uppercase">
            {{ p.nome.substring(0, 1) }}
          </div>
          <div class="flex-1">
            <div class="flex justify-between text-[11px] font-bold text-slate-700">
              <span>{{ p.nome }}</span>
              <span class="text-slate-500">Parte: {{ formatarDinheiro(p.valor) }}</span>
            </div>
            <div class="text-[9px] text-slate-400 mt-0.5 italic">
              {{ p.valor.centavos > 0 ? 'Contribuiu no pagamento' : 'Não contribuiu no pagamento' }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Rodapé: Saldo Acumulado -->
    <div :class="['px-6 py-3 flex justify-between items-center border-t', 
                   item.valorLiquido.centavos > 0 ? 'bg-emerald-500/[0.04] border-emerald-50' : 
                   (item.valorLiquido.centavos === 0 ? 'bg-slate-500/[0.04] border-slate-50' : 'bg-red-500/[0.04] border-red-50')]">
      <span :class="['text-[11px] font-bold uppercase tracking-widest', 
                      item.valorLiquido.centavos > 0 ? 'text-emerald-900/40' : (item.valorLiquido.centavos === 0 ? 'text-slate-900/30' : 'text-red-900/40')]">
        Saldo após lançamento
      </span>
      <div :class="['text-sm font-mono font-bold', 
                     item.saldoAcumulado.centavos > 0 ? 'text-emerald-600/70' : (item.saldoAcumulado.centavos === 0 ? 'text-slate-400/70' : 'text-red-600/70')]">
        {{ item.saldoAcumulado.centavos > 0 ? '+' : '' }}{{ formatarDinheiro(item.saldoAcumulado) }}
      </div>
    </div>
  </div>
</template>
