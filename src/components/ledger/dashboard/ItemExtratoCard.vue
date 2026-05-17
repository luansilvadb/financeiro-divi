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
  <div class="glass-card border border-divi-border rounded-[24px] shadow-lg relative overflow-hidden flex flex-col mb-3">
    <!-- Borda Semântica Lateral -->
    <div :class="['absolute top-0 left-0 w-1 h-full', 
                   item.valorLiquido.centavos > 0 ? 'bg-divi-emerald' : (item.valorLiquido.centavos === 0 ? 'bg-divi-t3' : 'bg-divi-rose')]"></div>

    <!-- Nível 1: Cabeçalho Compacto -->
    <div class="p-4 pb-3 flex justify-between items-center text-divi-t1">
      <div class="flex-1 min-w-0 pr-3">
        <h2 class="text-sm font-bold text-divi-t1 leading-tight truncate">{{ item.descricao }}</h2>
        <span :class="['inline-flex items-center px-2 py-0.5 rounded-md text-[8px] font-black mt-1.5 uppercase tracking-wider border',
                        item.valorLiquido.centavos > 0 ? 'bg-emerald-500/10 text-divi-emerald border-emerald-500/20' : 
                        (item.valorLiquido.centavos === 0 ? 'bg-divi-s2 text-divi-t2 border-divi-border' : 'bg-rose-500/10 text-divi-rose border-rose-500/20')]">
          {{ item.valorLiquido.centavos > 0 ? 'CRÉDITO' : (item.valorLiquido.centavos === 0 ? 'NEUTRO' : 'DÉBITO') }}
        </span>
      </div>
      <div class="text-right shrink-0">
        <div :class="['text-lg font-mono font-black tracking-tighter text-glow-indigo', 
                      item.valorLiquido.centavos > 0 ? 'text-divi-emerald text-glow-emerald' : (item.valorLiquido.centavos === 0 ? 'text-divi-t3' : 'text-divi-rose')]">
          {{ item.valorLiquido.centavos > 0 ? '+' : '' }}{{ formatarDinheiro(item.valorLiquido).replace('R$', '').trim() }}
        </div>
        <p class="text-[9px] font-black text-divi-t3 mt-0.5 uppercase tracking-widest">{{ formatDataCurta(item.data) }}</p>
      </div>
    </div>

    <!-- Nível 2: Grid de Fluxo Compactado -->
    <div class="mx-4 py-3 flex border-t border-divi-border text-divi-t1">
      <div class="flex-1 space-y-0.5 pr-3 border-r border-divi-border">
        <span class="text-[8px] font-bold text-divi-t2 uppercase tracking-wider">Você Pagou</span>
        <p class="text-xs font-mono font-bold text-divi-t1">{{ formatarDinheiro(item.valorPago) }}</p>
      </div>
      <div class="flex-1 space-y-0.5 pl-4">
        <span class="text-[8px] font-bold text-divi-t2 uppercase tracking-wider">Sua Parte</span>
        <p class="text-xs font-mono font-bold text-divi-t1">{{ formatarDinheiro(item.valorConsumido) }}</p>
      </div>
    </div>

    <!-- Nível 2: Avatares e Botão Detalhes Compacto -->
    <div class="px-4 pb-4 flex items-center justify-between">
      <div class="flex items-center gap-1.5">
        <div class="flex -space-x-1.5">
          <div v-for="pagador in pagamentosDetalhados.slice(0, 3)" :key="pagador.nome"
               class="w-6 h-6 rounded-full bg-divi-s2 border border-divi-border flex items-center justify-center text-[9px] font-black text-divi-t1 uppercase">
            {{ pagador.nome.substring(0, 1) }}
          </div>
        </div>
        <span v-if="pagamentosDetalhados.length > 3" class="text-[8px] font-bold text-divi-t3">
          +{{ pagamentosDetalhados.length - 3 }}
        </span>
      </div>
      <button @click="toggleDetails" 
              class="flex items-center gap-1 py-1 px-3 rounded-full bg-divi-s2 hover:bg-divi-s3 text-[8px] font-black text-divi-t2 border border-divi-border transition-all active:scale-95">
        {{ isExpanded ? 'OCULTAR' : 'DETALHES' }}
        <svg :class="['w-2.5 h-2.5 transition-transform', isExpanded ? 'rotate-180' : '']" 
             fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M19 9l-7 7-7-7" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>

    <!-- Nível 3: Auditoria Compacta -->
    <div v-if="isExpanded" class="bg-divi-s1/20 border-t border-divi-border p-4 space-y-3 text-divi-t1">
      <div class="flex justify-between items-center border-b border-divi-border pb-2">
        <span class="text-[9px] font-black text-divi-t2 uppercase tracking-wider">Total Bruto da Nota</span>
        <span class="text-xs font-mono font-black text-divi-t1">{{ formatarDinheiro(item.transacao.total) }}</span>
      </div>

      <div class="space-y-2.5">
        <div v-for="p in pagamentosDetalhados" :key="p.nome" class="flex items-center gap-2.5">
          <div class="w-6 h-6 rounded-full bg-divi-s2 flex items-center justify-center text-[9px] font-black text-divi-t1 border border-divi-border shadow-sm uppercase">
            {{ p.nome.substring(0, 1) }}
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex justify-between text-[10px] font-bold text-divi-t1">
              <span class="truncate pr-2">{{ p.nome }}</span>
              <span class="text-divi-t2 shrink-0">Parte: {{ formatarDinheiro(p.valor) }}</span>
            </div>
            <div class="text-[8px] text-divi-t3 mt-0.5">
              {{ p.valor.centavos > 0 ? 'Contribuiu no pagamento' : 'Não contribuiu no pagamento' }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Rodapé: Saldo Acumulado -->
    <div :class="['px-4 py-2 flex justify-between items-center border-t border-divi-border', 
                   item.valorLiquido.centavos > 0 ? 'bg-divi-emerald-dim/5' : 
                   (item.valorLiquido.centavos === 0 ? 'bg-divi-s1/5' : 'bg-divi-rose-dim/5')]">
      <span :class="['text-[9px] font-black uppercase tracking-wider', 
                      item.valorLiquido.centavos > 0 ? 'text-divi-emerald/60' : (item.valorLiquido.centavos === 0 ? 'text-divi-t2/55' : 'text-divi-rose/60')]">
        Saldo pós lançamento
      </span>
      <div :class="['text-xs font-mono font-black', 
                     item.saldoAcumulado.centavos > 0 ? 'text-divi-emerald text-glow-emerald' : (item.saldoAcumulado.centavos === 0 ? 'text-divi-t3' : 'text-divi-rose')]">
        {{ item.saldoAcumulado.centavos > 0 ? '+' : '' }}{{ formatarDinheiro(item.saldoAcumulado) }}
      </div>
    </div>
  </div>
</template>
