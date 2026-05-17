<script setup lang="ts">
import { computed } from 'vue'
import { Gasto } from '../../../modules/ledger/core/domain/Gasto'
import { Antecipacao } from '../../../modules/ledger/core/domain/Antecipacao'

interface Props {
  faturaId: string
  responsavelId: string
  gastos: Gasto[]
  antecipacoes: Antecipacao[]
  membros: { id: string; nome: string }[]
}

const props = defineProps<Props>()

const getMembroNome = (id: string) => {
  return props.membros.find(m => m.id === id)?.nome || 'Outro'
}

// Calcula saldos liquidos de cada membro na fatura
const saldosLiquidos = computed(() => {
  const consumoMap: Record<string, number> = {}
  const antMap: Record<string, number> = {}

  // Inicializa mapas para todos os membros
  props.membros.forEach(m => {
    consumoMap[m.id] = 0
    antMap[m.id] = 0
  })

  // Agrega consumo
  props.gastos.forEach(g => {
    g.divisoes.forEach(d => {
      if (consumoMap[d.membroId] !== undefined) {
        consumoMap[d.membroId] += d.valor.centavos
      }
    })
  })

  // Agrega antecipações
  props.antecipacoes.forEach(a => {
    if (antMap[a.membroId] !== undefined) {
      antMap[a.membroId] += a.valor.centavos
    }
  })

  // Calcula balanço líquido: Consumo - Antecipado
  // Balanço positivo = consumiu mais do que adiantou -> deve PAGAR
  // Balanço negativo = adiantou mais do que consumiu -> deve RECEBER (crédito)
  return props.membros.map(m => {
    const consumo = consumoMap[m.id] || 0
    const ant = antMap[m.id] || 0
    const balanco = consumo - ant // positivo = deve pagar; negativo = deve receber
    return {
      id: m.id,
      nome: m.nome,
      consumo: consumo / 100,
      antecipado: ant / 100,
      balanco: balanco / 100
    }
  })
})

// Calcula as transferências Pix otimizadas para liquidação (quem paga quem)
const transferenciasPix = computed(() => {
  // Separamos devedores e credores
  // O responsavelId (quem pagou o banco) assume a dívida final do cartão.
  // Matematicamente:
  // Se João pagou a fatura ao banco (R$ 1500), ele adiantou esse valor.
  // Qualquer membro que consumiu e não pagou nada deve pagar sua parte do consumo para João.
  // Se Maria pagou o aluguel (R$ 1500) e João usou o cartão, João deve para Maria.
  // Vamos calcular os saldos líquidos consolidados em relação a quem quitou a fatura com o banco.
  // A regra de acerto do DIVI: todos os membros acertam diretamente com o responsável que pagou o banco.
  // Portanto, cada membro (excluindo o responsável da fatura) paga ou recebe diretamente do responsável.
  const respId = props.responsavelId
  const transferencias: { deId: string; deNome: string; paraId: string; paraNome: string; valor: number; tipo: 'PAGA' | 'RECEBE' }[] = []

  saldosLiquidos.value.forEach(s => {
    if (s.id === respId) return // O responsável não transfere para si mesmo

    // Se o balanço do membro for positivo (consumiu mais do que adiantou), ele PAGA ao responsável
    if (s.balanco > 0.01) {
      transferencias.push({
        deId: s.id,
        deNome: s.nome,
        paraId: respId,
        paraNome: getMembroNome(respId),
        valor: s.balanco,
        tipo: 'PAGA'
      })
    }
    // Se o balanço for negativo (adiantou mais do que consumiu), ele tem crédito e RECEBE do responsável
    else if (s.balanco < -0.01) {
      transferencias.push({
        deId: respId,
        deNome: getMembroNome(respId),
        paraId: s.id,
        paraNome: s.nome,
        valor: Math.abs(s.balanco),
        tipo: 'RECEBE'
      })
    }
  })

  return transferencias
})
</script>

<template>
  <div class="space-y-5">
    <div class="flex justify-between items-center border-b border-slate-100 pb-2">
      <span class="text-xs font-black uppercase text-gray-400 tracking-wider">Prévia de Acertos (Saldos Coletivos)</span>
      <span class="text-[10px] text-indigo-500 font-bold bg-indigo-50 px-2 py-0.5 rounded">Reativo</span>
    </div>

    <!-- Tabela de Consumos e Adiantamentos Individuais -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
      <div 
        v-for="s in saldosLiquidos" 
        :key="s.id"
        :class="[
          'p-4 rounded-2xl border-2 transition-all flex flex-col justify-between space-y-3 bg-white',
          s.id === props.responsavelId ? 'border-indigo-100 bg-indigo-50/10' : 'border-slate-100'
        ]"
      >
        <div class="flex justify-between items-center">
          <div class="flex items-center gap-2">
            <div class="w-6 h-6 rounded-full bg-slate-100 font-black text-[10px] flex items-center justify-center text-slate-600">
              {{ s.nome[0].toUpperCase() }}
            </div>
            <strong class="text-xs text-gray-700 font-black">{{ s.nome }}</strong>
          </div>
          <span 
            v-if="s.id === props.responsavelId" 
            class="text-[8px] bg-indigo-100 text-indigo-700 font-black px-1.5 py-0.5 rounded uppercase"
          >
            Quitou Fatura
          </span>
        </div>

        <div class="grid grid-cols-2 gap-2 text-[10px]">
          <div>
            <span class="text-gray-400 font-medium block">Consumido:</span>
            <strong class="text-gray-700 font-bold">R$ {{ s.consumo.toFixed(2).replace('.', ',') }}</strong>
          </div>
          <div>
            <span class="text-gray-400 font-medium block">Adiantado:</span>
            <strong class="text-gray-700 font-bold">R$ {{ s.antecipado.toFixed(2).replace('.', ',') }}</strong>
          </div>
        </div>

        <div class="pt-2 border-t border-slate-50 flex justify-between items-center text-xs">
          <span class="text-gray-400 font-bold">Líquido:</span>
          <strong 
            :class="[
              'font-black',
              s.balanco > 0 ? 'text-rose-500' : s.balanco < 0 ? 'text-emerald-500' : 'text-gray-500'
            ]"
          >
            {{ s.balanco > 0 ? `Deve R$ ${s.balanco.toFixed(2).replace('.', ',')}` : s.balanco < 0 ? `Crédito R$ ${Math.abs(s.balanco).toFixed(2).replace('.', ',')}` : 'Zerado' }}
          </strong>
        </div>
      </div>
    </div>

    <!-- Fluxo Pix Recomendado (Quem Paga Quem) -->
    <div class="bg-indigo-900 text-white rounded-3xl p-5 shadow-lg border border-indigo-950 space-y-4">
      <div class="flex items-center gap-2">
        <span class="text-lg">💸</span>
        <div>
          <h4 class="text-xs font-black uppercase tracking-wider">Fluxo do Acerto (Pix)</h4>
          <span class="text-[9px] text-indigo-300 font-bold block mt-0.5">Transferências calculadas para acerto de contas</span>
        </div>
      </div>

      <div v-if="transferenciasPix.length === 0" class="text-center py-4 text-xs text-indigo-200">
        ⚖️ Contas zeradas! Não há necessidade de transferências Pix.
      </div>

      <div v-else class="space-y-3">
        <div 
          v-for="(t, idx) in transferenciasPix" 
          :key="idx"
          class="flex items-center justify-between bg-indigo-950/40 border border-indigo-800/40 p-4 rounded-2xl"
        >
          <!-- Remetente -->
          <div class="flex items-center gap-2 flex-1 min-w-0">
            <div class="w-8 h-8 rounded-full bg-indigo-800 font-black text-xs flex items-center justify-center shrink-0">
              {{ t.deNome[0].toUpperCase() }}
            </div>
            <div class="min-w-0">
              <strong class="text-xs font-bold block truncate">{{ t.deNome }}</strong>
              <span class="text-[8px] text-indigo-300 font-medium">envia Pix</span>
            </div>
          </div>

          <!-- Seta com Direção e Valor -->
          <div class="flex flex-col items-center justify-center px-4 shrink-0">
            <span class="text-xs font-black text-amber-300">R$ {{ t.valor.toFixed(2).replace('.', ',') }}</span>
            <span class="text-sm tracking-widest text-indigo-300/60 mt-0.5">➔➔➔</span>
          </div>

          <!-- Destinatário -->
          <div class="flex items-center gap-2 flex-1 justify-end min-w-0 text-right">
            <div class="min-w-0">
              <strong class="text-xs font-bold block truncate">{{ t.paraNome }}</strong>
              <span class="text-[8px] text-indigo-300 font-medium">recebe Pix</span>
            </div>
            <div class="w-8 h-8 rounded-full bg-indigo-800 font-black text-xs flex items-center justify-center shrink-0">
              {{ t.paraNome[0].toUpperCase() }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
