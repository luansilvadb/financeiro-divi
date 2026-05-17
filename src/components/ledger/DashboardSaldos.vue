<script setup lang="ts">
import { computed, ref } from 'vue'
import { Dinheiro } from '../../shared/primitives/Dinheiro'
import { CalculadoraSaldos } from '../../modules/ledger/core/services/CalculadoraSaldos'
import { Transacao } from '../../modules/ledger/core/domain/Transacao'
import CardSaldoMembro from './dashboard/CardSaldoMembro.vue'
import ItemExtratoCard from './dashboard/ItemExtratoCard.vue'

interface Props {
  saldos: Map<string, Dinheiro>
  membros: { id: string; nome: string; ativo?: boolean }[]
  transacoes: Transacao[]
}

const props = defineProps<Props>()
const selectedMemberId = ref<string | null>(null)

const saldosList = computed(() => {
  return props.membros
    .map(m => ({
      id: m.id,
      nome: m.nome,
      ativo: m.ativo ?? true,
      saldo: props.saldos.get(m.id) || Dinheiro.deCentavos(0),
      temTransacoes: props.saldos.has(m.id)
    }))
    .filter(item => item.ativo || item.temTransacoes)
    .sort((a, b) => b.saldo.centavos - a.saldo.centavos)
})

const getExtrato = (id: string) => {
  return CalculadoraSaldos.obterExtratoMembro(id, props.transacoes).reverse() // Mostrar mais recentes primeiro
}

const toggleDrilldown = (id: string) => {
  selectedMemberId.value = selectedMemberId.value === id ? null : id
}
</script>

<template>
  <div class="max-w-md mx-auto space-y-6">
    <div class="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
      <h2 class="text-2xl font-bold text-gray-800 mb-6">Saldos</h2>

      <CardSaldoMembro 
        v-for="item in saldosList" 
        :key="item.id"
        :nome="item.nome"
        :saldo="item.saldo"
        :is-expanded="selectedMemberId === item.id"
        @toggle="toggleDrilldown(item.id)"
      >
        <template #details>
          <ItemExtratoCard 
            v-for="extratoItem in getExtrato(item.id)" 
            :key="extratoItem.id"
            :item="extratoItem"
            :membros="membros"
          />
        </template>
      </CardSaldoMembro>
    </div>
  </div>
</template>
