<script setup lang="ts">
import { computed, ref } from 'vue'
import { User, ArrowRight, PlusCircle, TrendingUp, ChevronDown, ChevronUp, ArrowUpRight, ArrowDownRight } from 'lucide-vue-next'
import { Dinheiro } from '../../shared/primitives/Dinheiro'
import { CalculadoraSaldos } from '../../modules/ledger/core/services/CalculadoraSaldos'
import { Transacao } from '../../modules/ledger/core/domain/Transacao'

interface Props {
  saldos: Map<string, Dinheiro>
  membros: { id: string; nome: string }[]
  transacoes: Transacao[]
}

const props = defineProps<Props>()
const emit = defineEmits(['novo-lancamento'])

const selectedMemberId = ref<string | null>(null)

const getMembroNome = (id: string) => {
  return props.membros.find(m => m.id === id)?.nome || id
}

const acertos = computed(() => {
  return CalculadoraSaldos.calcularAcertos(props.saldos)
})

const saldosList = computed(() => {
  return props.membros.map(m => ({
    id: m.id,
    nome: m.nome,
    saldo: props.saldos.get(m.id) || Dinheiro.deCentavos(0)
  })).sort((a, b) => b.saldo.centavos - a.saldo.centavos)
})

const toggleDrilldown = (id: string) => {
  if (selectedMemberId.value === id) {
    selectedMemberId.value = null
  } else {
    selectedMemberId.value = id
  }
}

const getMemberDetails = (id: string) => {
  const credits = props.transacoes.filter(t => t.origem_id === id)
  const debits = props.transacoes.filter(t => t.divisoes.some(d => d.beneficiario_id === id))
  
  return {
    credits: credits.map(t => ({
      id: t.id,
      descricao: t.descricao,
      valor: t.total,
      data: t.data
    })),
    debits: debits.map(t => {
      const divisao = t.divisoes.find(d => d.beneficiario_id === id)!
      return {
        id: t.id,
        descricao: t.descricao,
        valor: divisao.valor,
        data: t.data
      }
    })
  }
}

const formatarDinheiro = (valor: Dinheiro) => {
  return valor.formatar()
}
</script>

<template>
  <div class="max-w-md mx-auto space-y-6">
    <!-- Header/Resumo -->
    <div class="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-bold text-gray-800">Saldos</h2>
        <button 
          @click="emit('novo-lancamento')"
          class="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-full font-medium hover:bg-blue-700 transition shadow-sm"
        >
          <PlusCircle class="w-5 h-5" />
          Novo
        </button>
      </div>

      <div class="space-y-4">
        <div 
          v-for="item in saldosList" 
          :key="item.id"
          class="rounded-xl overflow-hidden"
        >
          <div 
            @click="toggleDrilldown(item.id)"
            :class="['flex items-center justify-between p-3 cursor-pointer transition', selectedMemberId === item.id ? 'bg-blue-50' : 'bg-gray-50 hover:bg-gray-100']"
          >
            <div class="flex items-center gap-3">
              <div :class="['p-2 rounded-full', item.saldo.centavos >= 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600']">
                <User class="w-5 h-5" />
              </div>
              <span class="font-medium text-gray-700">{{ item.nome }}</span>
            </div>
            <div class="flex items-center gap-4">
              <div class="text-right">
                <div :class="['font-bold text-lg', item.saldo.centavos >= 0 ? 'text-green-600' : 'text-red-600']">
                  {{ item.saldo.centavos > 0 ? '+' : '' }}{{ formatarDinheiro(item.saldo) }}
                </div>
              </div>
              <component :is="selectedMemberId === item.id ? ChevronUp : ChevronDown" class="w-4 h-4 text-gray-400" />
            </div>
          </div>

          <!-- Drilldown Detail -->
          <div v-if="selectedMemberId === item.id" class="bg-white border-x border-b border-blue-50 p-4 space-y-4 animate-fade-in">
            <div v-if="getMemberDetails(item.id).credits.length > 0">
              <div class="text-[10px] uppercase font-bold text-green-600 mb-2 tracking-wider flex items-center gap-1">
                <ArrowUpRight class="w-3 h-3" /> Créditos (Pagou)
              </div>
              <div class="space-y-1">
                <div v-for="c in getMemberDetails(item.id).credits" :key="c.id" class="flex justify-between text-sm">
                  <span class="text-gray-600">{{ c.descricao }}</span>
                  <span class="font-medium text-green-600">+{{ formatarDinheiro(c.valor) }}</span>
                </div>
              </div>
            </div>

            <div v-if="getMemberDetails(item.id).debits.length > 0">
              <div class="text-[10px] uppercase font-bold text-red-600 mb-2 tracking-wider flex items-center gap-1">
                <ArrowDownRight class="w-3 h-3" /> Débitos (Consumiu)
              </div>
              <div class="space-y-1">
                <div v-for="d in getMemberDetails(item.id).debits" :key="d.id" class="flex justify-between text-sm">
                  <span class="text-gray-600">{{ d.descricao }}</span>
                  <span class="font-medium text-red-600">-{{ formatarDinheiro(d.valor) }}</span>
                </div>
              </div>
            </div>

            <div v-if="getMemberDetails(item.id).credits.length === 0 && getMemberDetails(item.id).debits.length === 0" class="text-center text-xs text-gray-400 italic">
              Nenhuma movimentação para este membro.
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Acertos (Quem paga quem) -->
    <div v-if="acertos.length > 0" class="bg-blue-50 rounded-2xl p-6 border border-blue-100">
      <h3 class="text-blue-800 font-bold mb-4 flex items-center gap-2">
        <TrendingUp class="w-5 h-5" />
        Como acertar as contas
      </h3>
      
      <div class="space-y-3">
        <div 
          v-for="(acerto, index) in acertos" 
          :key="index"
          class="flex items-center gap-3 bg-white p-3 rounded-xl shadow-sm border border-blue-50"
        >
          <div class="flex-1 text-sm font-medium text-gray-600">
            <span class="text-gray-900 font-bold">{{ getMembroNome(acerto.de) }}</span>
          </div>
          <div class="flex flex-col items-center px-2">
            <ArrowRight class="w-4 h-4 text-blue-400" />
            <span class="text-[10px] font-bold text-blue-500 uppercase">{{ formatarDinheiro(acerto.valor) }}</span>
          </div>
          <div class="flex-1 text-right text-sm font-medium text-gray-600">
            <span class="text-gray-900 font-bold">{{ getMembroNome(acerto.para) }}</span>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="text-center py-8 text-gray-400 italic">
      Tudo zerado! Ninguém deve nada.
    </div>
  </div>
</template>
