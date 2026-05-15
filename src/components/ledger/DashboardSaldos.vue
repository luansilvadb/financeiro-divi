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
const expandedTransactionId = ref<string | null>(null)

const getMembroNome = (id: string) => {
  return props.membros.find(m => m.id === id)?.nome || id
}

const formatDataCurta = (date: Date) => {
  return new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).toUpperCase()
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

const toggleTransaction = (id: string) => {
  if (expandedTransactionId.value === id) {
    expandedTransactionId.value = null
  } else {
    expandedTransactionId.value = id
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
            <template v-for="details in [getMemberDetails(item.id)]" :key="item.id">
              <div v-if="details.length > 0" class="space-y-4">
                <div v-for="m in details" :key="m.id" 
                     class="bg-[#FAFAFA] rounded-[24px] shadow-sm border border-slate-100 relative overflow-hidden flex flex-col transition-all active:scale-[0.98]">
                  
                  <!-- Borda Semântica Lateral -->
                  <div :class="['absolute top-0 left-0 w-1.5 h-full', 
                                 m.net.isPositivo() ? 'bg-emerald-500' : (m.net.isZero() ? 'bg-slate-300' : 'bg-red-500')]"></div>

                  <!-- Nível 1: Cabeçalho (Simetria Óptica) -->
                  <div class="p-6 pb-4 flex justify-between items-center">
                    <div class="flex-1">
                      <h2 class="text-[17px] font-bold text-slate-800 leading-tight">{{ m.descricao }}</h2>
                      <span :class="['inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-black mt-2 uppercase tracking-tighter border',
                                      m.net.isPositivo() ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                                      (m.net.isZero() ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-red-50 text-red-600 border-red-100')]">
                        {{ m.net.isPositivo() ? 'CRÉDITO' : (m.net.isZero() ? 'NEUTRO' : 'DÉBITO') }}
                      </span>
                    </div>
                    <div class="text-right">
                      <div :class="['text-2xl font-mono font-black tracking-tighter', 
                                    m.net.isPositivo() ? 'text-emerald-600' : (m.net.isZero() ? 'text-slate-400' : 'text-red-600')]">
                        {{ m.net.isPositivo() ? '+' : '' }}{{ formatarDinheiro(m.net).replace('R$', '').trim() }}
                      </div>
                      <p class="text-[10px] font-bold text-slate-300 mt-1 uppercase tracking-widest">{{ formatDataCurta(m.data) }}</p>
                    </div>
                  </div>

                  <!-- Nível 2: Grid de Fluxo Simétrica -->
                  <div class="mx-6 py-5 flex border-t border-slate-50">
                    <div class="flex-1 space-y-1 pr-4 border-r border-slate-50">
                      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Você Pagou</span>
                      <p class="text-sm font-mono font-bold text-slate-800">{{ formatarDinheiro(m.paid) }}</p>
                    </div>
                    <div class="flex-1 space-y-1 pl-6">
                      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sua Parte</span>
                      <p class="text-sm font-mono font-bold text-slate-800">{{ formatarDinheiro(m.consumed) }}</p>
                    </div>
                  </div>

                  <!-- Nível 2: Avatares e Botão Detalhes -->
                  <div class="px-6 pb-6 flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <div class="flex -space-x-2">
                        <div v-for="pagador in m.pagamentos_detalhados.slice(0, 3)" :key="pagador.nome"
                             class="w-7 h-7 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-600 uppercase">
                          {{ pagador.nome.substring(0, 1) }}
                        </div>
                      </div>
                      <span v-if="m.pagamentos_detalhados.length > 3" class="text-[10px] font-bold text-slate-400">
                        +{{ m.pagamentos_detalhados.length - 3 }} outros
                      </span>
                    </div>
                    <button @click="toggleTransaction(m.id)" 
                            class="flex items-center gap-1.5 py-1.5 px-4 rounded-full bg-slate-50 text-[10px] font-bold text-slate-600 border border-slate-100 active:scale-95 transition-all">
                      {{ expandedTransactionId === m.id ? 'OCULTAR' : 'DETALHES' }}
                      <svg :class="['w-3 h-3 transition-transform duration-300', expandedTransactionId === m.id ? 'rotate-180' : '']" 
                           fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M19 9l-7 7-7-7" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              <div v-else class="text-center py-4 text-xs text-gray-400 italic">
                Nenhuma movimentação para este membro.
              </div>
            </template>
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
