<script setup lang="ts">
import { Clock } from 'lucide-vue-next'
import type { Transacao } from '../../modules/ledger/core/domain/Transacao'
import { Dinheiro } from '../../shared/primitives/Dinheiro'

interface Props {
  transacoes: Transacao[]
  membros: { id: string; nome: string }[]
}

const props = defineProps<Props>()

const getMembroNome = (id: string) => {
  return props.membros.find(m => m.id === id)?.nome || id
}

// Create a reactive sorted list
import { computed } from 'vue'
const sortedTransacoes = computed(() => {
  return [...props.transacoes].sort((a, b) => b.data.getTime() - a.data.getTime())
})

const formatDate = (date: Date) => {
  return new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

const formatarDinheiro = (valor: any) => {
  if (valor && typeof valor.formatar === 'function') {
    return valor.formatar()
  }
  return Dinheiro.deCentavos(valor?.centavos || 0).formatar()
}
</script>

<template>
  <div class="glass-card border border-divi-border rounded-3xl p-3.5 shadow-lg text-divi-t1">
    <!-- Header -->
    <div class="flex justify-between items-center border-b border-divi-border/40 pb-2 mb-3">
      <h3 class="text-xs font-black uppercase text-divi-t2 tracking-wider flex items-center gap-1.5">
        <Clock class="w-3.5 h-3.5 text-divi-primary text-glow-primary" /> Atividade Recente
      </h3>
      <span class="text-[9px] bg-divi-s2 border border-divi-border text-divi-t2 font-bold px-2 py-0.5 rounded-full">
        {{ sortedTransacoes.length }} lançamentos
      </span>
    </div>

    <!-- Empty State -->
    <div v-if="sortedTransacoes.length === 0" class="text-center py-6 text-xs text-divi-t3">
      Nenhuma atividade recente encontrada neste período.
    </div>

    <!-- Feed List -->
    <div v-else class="space-y-2 max-h-[384px] overflow-y-auto pr-1">
      <div 
        v-for="t in sortedTransacoes" 
        :key="t.id"
        class="flex justify-between items-center p-2.5 rounded-2xl bg-divi-s1/30 border border-divi-border/40 hover:border-divi-primary/30 transition-all hover:bg-divi-s1/50"
      >
        <div class="flex items-center gap-2.5 min-w-0">
          <!-- Compact Avatar -->
          <div class="w-8 h-8 rounded-full bg-divi-s2 border border-divi-border font-black text-xs text-divi-t1 flex items-center justify-center shrink-0 shadow-sm uppercase">
            {{ t.descricao[0] }}
          </div>
          
          <div class="min-w-0">
            <strong class="text-xs text-divi-t1 font-bold block truncate leading-tight">{{ t.descricao }}</strong>
            <span class="text-[9px] text-divi-t3 block mt-0.5 uppercase tracking-wider font-medium">
              {{ formatDate(t.data) }} • Pago por {{ getMembroNome(t.pagamentos[0].membro_id) }}
            </span>
          </div>
        </div>

        <div class="text-right shrink-0">
          <strong class="text-xs font-black text-divi-t1 block">{{ formatarDinheiro(t.total) }}</strong>
        </div>
      </div>
    </div>
  </div>
</template>
