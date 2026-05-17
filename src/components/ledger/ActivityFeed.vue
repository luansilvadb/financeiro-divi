<script setup lang="ts">
import { Clock, User } from 'lucide-vue-next'
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
  <div class="glass-card rounded-3xl border border-divi-border overflow-hidden shadow-xl">
    <div class="p-4.5 border-b border-divi-border flex items-center gap-2 bg-gradient-to-r from-divi-s1/30 to-transparent">
      <Clock class="w-5 h-5 text-divi-primary text-glow-primary" />
      <h3 class="font-black text-divi-t1 tracking-tight">Atividade Recente</h3>
    </div>

    <div class="divide-y divide-divi-border max-h-[384px] overflow-y-auto">
      <div v-if="sortedTransacoes.length === 0" class="p-8 text-center text-divi-t3 italic text-sm bg-divi-s1/10">
        Nenhuma transação encontrada.
      </div>
      
      <div 
        v-for="t in sortedTransacoes" 
        :key="t.id"
        class="p-4 hover:bg-divi-s1/30 transition-colors duration-150"
      >
        <div class="flex justify-between items-start mb-1.5">
          <span class="font-bold text-divi-t1 text-sm">{{ t.descricao }}</span>
          <span class="font-bold text-divi-primary text-glow-primary text-sm">{{ formatarDinheiro(t.total) }}</span>
        </div>
        
        <div class="flex justify-between items-center text-xs text-divi-t2">
          <div class="flex items-center gap-1">
            <User class="w-3 h-3 text-divi-t3" />
            <span>
              Pago por 
              <strong class="text-divi-t1">{{ getMembroNome(t.pagamentos[0].membro_id) }}</strong>
              <template v-if="t.pagamentos.length > 1">
                e mais {{ t.pagamentos.length - 1 }}
              </template>
            </span>
          </div>
          <span class="text-divi-t3 font-medium">{{ formatDate(t.data) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
