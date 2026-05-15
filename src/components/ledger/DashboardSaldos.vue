<script setup lang="ts">
import { computed, ref } from 'vue'
import { User, ArrowRight, TrendingUp, ChevronDown, ChevronUp } from 'lucide-vue-next'
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
  const relevantTransactions = props.transacoes.filter(t => 
    t.pagamentos.some(p => p.membro_id === id) || 
    t.divisoes.some(d => d.beneficiario_id === id)
  )
  
  const rawDetails = relevantTransactions.map(t => {
    const pRaw = t.pagamentos.find(p => p.membro_id === id)?.valor
    const dRaw = t.divisoes.find(d => d.beneficiario_id === id)?.valor
    
    // Hidrata os valores se forem POJOs
    const paid = (pRaw && typeof pRaw.subtrair === 'function') 
      ? pRaw 
      : Dinheiro.deCentavos((pRaw as any)?.centavos || 0)
      
    const consumed = (dRaw && typeof dRaw.subtrair === 'function')
      ? dRaw
      : Dinheiro.deCentavos((dRaw as any)?.centavos || 0)

    const net = paid.subtrair(consumed)
    
    return {
      id: t.id,
      descricao: t.descricao,
      total: t.total,
      paid,
      consumed,
      net,
      data: t.data,
      todos_pagadores: t.pagamentos.map(p => getMembroNome(p.membro_id)),
      todos_beneficiarios: t.divisoes.map(d => getMembroNome(d.beneficiario_id)),
      pagamentos_detalhados: (t.divisoes.length > 1)
        ? props.membros
            .filter(m => t.pagamentos.some(p => p.membro_id === m.id) || t.divisoes.some(d => d.beneficiario_id === m.id))
            .map(m => ({
              nome: m.nome,
              valor: t.pagamentos.find(p => p.membro_id === m.id)?.valor || Dinheiro.deCentavos(0)
            }))
        : t.pagamentos.map(p => ({
            nome: getMembroNome(p.membro_id),
            valor: p.valor
          }))
    }
  }).sort((a, b) => a.data.getTime() - b.data.getTime())

  // Cálculo do Saldo Acumulado
  let runningBalance = Dinheiro.deCentavos(0)
  return rawDetails.map(d => {
    runningBalance = runningBalance.somar(d.net)
    return { ...d, acumulado: runningBalance }
  })
}

const formatarDinheiro = (valor: Dinheiro) => {
  if (typeof valor.formatar === 'function') {
    return valor.formatar()
  }
  // Se for um POJO (objeto simples vindo do banco/JSON), reconstrói a instância
  return Dinheiro.deCentavos((valor as any).centavos || 0).formatar()
}
</script>

<template>
  <div class="max-w-md mx-auto space-y-6">
    <!-- Header/Resumo -->
    <div class="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-bold text-gray-800">Saldos</h2>
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
          <div v-if="selectedMemberId === item.id" class="bg-white border-x border-b border-blue-50 p-4 space-y-2 animate-fade-in rounded-b-xl">
            <div v-if="getMemberDetails(item.id).length > 0" class="overflow-x-auto">
              <table class="w-full text-[10px] text-left border-collapse">
                <thead>
                  <tr class="text-gray-400 uppercase tracking-wider border-b border-gray-50">
                    <th class="py-2 font-bold">Descrição</th>
                    <th class="py-2 font-bold text-right">Pagou</th>
                    <th class="py-2 font-bold text-right">Consumiu</th>
                    <th class="py-2 font-bold text-right">Saldo</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-50">
                  <tr v-for="m in getMemberDetails(item.id)" :key="m.id" class="text-gray-600">
                    <td class="py-2 pr-2">
                      <div class="font-medium text-gray-800">
                        {{ m.descricao }}
                        <span class="text-[10px] text-gray-400 font-normal ml-0.5">({{ formatarDinheiro(m.total) }})</span>
                      </div>
                      <div class="text-[9px] text-gray-400 leading-tight mt-1.5 space-y-1">
                        <div class="flex items-baseline gap-1.5">
                          <span class="font-bold">-</span>
                          <template v-if="m.todos_beneficiarios.length > 1">
                            Dividido com: {{ m.todos_beneficiarios.filter(n => n !== getMembroNome(item.id)).join(', ') }}
                          </template>
                          <template v-else-if="m.todos_beneficiarios[0] !== getMembroNome(item.id)">
                            Destinado a: {{ m.todos_beneficiarios[0] }}
                          </template>
                          <template v-else>
                            Lançamento individual
                          </template>
                        </div>
                        <div class="pl-2.5 space-y-0.5 border-l border-gray-100 ml-0.5">
                          <div v-for="p in m.pagamentos_detalhados" :key="p.nome" class="flex items-center gap-1.5">
                            <span class="text-[7px] opacity-50">•</span> 
                            <span class="font-medium text-gray-400">{{ p.nome }}:</span>
                            <span>{{ formatarDinheiro(p.valor) }}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td :class="['py-2 text-right', m.paid.isZero() ? 'text-gray-300' : 'text-green-600']">
                      {{ formatarDinheiro(m.paid) }}
                    </td>
                    <td :class="['py-2 text-right', m.consumed.isZero() ? 'text-gray-300' : 'text-red-600']">
                      {{ formatarDinheiro(m.consumed) }}
                    </td>
                    <td :class="['py-2 text-right font-bold', m.net.isZero() ? 'text-gray-400' : (m.net.isPositivo() ? 'text-green-600' : 'text-red-600')]">
                      {{ m.net.isPositivo() ? '+' : '' }}{{ formatarDinheiro(m.net) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div v-else class="text-center py-4 text-xs text-gray-400 italic">
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
