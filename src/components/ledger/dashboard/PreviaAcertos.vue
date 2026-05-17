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
  <div class="space-y-4">
    <div class="flex justify-between items-center border-b border-divi-border pb-1.5">
      <span class="text-xs font-black uppercase text-divi-t2 tracking-wider">Prévia de Acertos (Saldos Coletivos)</span>
      <span class="text-[9px] text-divi-primary font-black bg-divi-primary-dim border border-indigo-500/20 px-2 py-0.5 rounded">Reativo</span>
    </div>

    <!-- Tabela de Consumos e Adiantamentos Individuais -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-2.5">
      <div 
        v-for="s in saldosLiquidos" 
        :key="s.id"
        :class="[
          'p-3.5 rounded-2xl border transition-all flex flex-col justify-between space-y-2.5 glass-card',
          s.id === props.responsavelId ? 'border-divi-primary/40 bg-divi-primary-dim/10' : 'border-divi-border'
        ]"
      >
        <div class="flex justify-between items-center">
          <div class="flex items-center gap-2">
            <div class="w-6 h-6 rounded-full bg-divi-s2 border border-divi-border font-black text-[9px] flex items-center justify-center text-divi-t1 shadow-[0_0_8px_rgba(255,255,255,0.05)]">
              {{ s.nome[0].toUpperCase() }}
            </div>
            <strong class="text-xs text-divi-t1 font-bold">{{ s.nome }}</strong>
          </div>
          <span 
            v-if="s.id === props.responsavelId" 
            class="text-[8px] bg-divi-primary-dim text-divi-primary font-black border border-indigo-500/20 px-1.5 py-0.5 rounded uppercase"
          >
            Quitou Fatura
          </span>
        </div>

        <div class="grid grid-cols-2 gap-2 text-[9px]">
          <div>
            <span class="text-divi-t2 font-medium block">Consumido:</span>
            <strong class="text-divi-t1 font-bold">R$ {{ s.consumo.toFixed(2).replace('.', ',') }}</strong>
          </div>
          <div>
            <span class="text-divi-t2 font-medium block">Adiantado:</span>
            <strong class="text-divi-t1 font-bold">R$ {{ s.antecipado.toFixed(2).replace('.', ',') }}</strong>
          </div>
        </div>

        <div class="pt-1.5 border-t border-divi-border flex justify-between items-center text-[10px]">
          <span class="text-divi-t2 font-bold">Líquido:</span>
          <strong 
            :class="[
              'font-black',
              s.balanco > 0 ? 'text-divi-rose' : s.balanco < 0 ? 'text-divi-emerald text-glow-emerald' : 'text-divi-t3'
            ]"
          >
            {{ s.balanco > 0 ? `Deve R$ ${s.balanco.toFixed(2).replace('.', ',')}` : s.balanco < 0 ? `Crédito R$ ${Math.abs(s.balanco).toFixed(2).replace('.', ',')}` : 'Zerado' }}
          </strong>
        </div>
      </div>
    </div>

    <!-- Fluxo Pix Recomendado (Quem Paga Quem) -->
    <div class="glass-card border border-divi-border text-divi-t1 rounded-3xl p-4 shadow-lg space-y-3">
      <div class="flex items-center gap-2">
        <span class="text-base">💸</span>
        <div>
          <h4 class="text-xs font-black uppercase tracking-wider text-divi-t1">Fluxo do Acerto (Pix)</h4>
          <span class="text-[9px] text-divi-t2 font-bold block mt-0.5">Transferências calculadas para acerto de contas</span>
        </div>
      </div>

      <div v-if="transferenciasPix.length === 0" class="text-center py-3 text-xs text-divi-t2">
        ⚖️ Contas zeradas! Não há necessidade de transferências Pix.
      </div>

      <div class="space-y-2" v-else>
        <div 
          v-for="(t, idx) in transferenciasPix" 
          :key="idx"
          class="flex items-center justify-between bg-divi-s1/30 border border-divi-border p-3 rounded-2xl"
        >
          <!-- Remetente -->
          <div class="flex items-center gap-2 flex-1 min-w-0">
            <div class="w-8 h-8 rounded-full bg-divi-s2 border border-divi-border font-black text-xs text-divi-t1 flex items-center justify-center shrink-0">
              {{ t.deNome[0].toUpperCase() }}
            </div>
            <div class="min-w-0">
              <strong class="text-xs font-bold block truncate leading-tight">{{ t.deNome }}</strong>
              <span class="text-[8px] text-divi-t3 font-medium">envia Pix</span>
            </div>
          </div>

          <!-- Seta com Direção e Valor -->
          <div class="flex flex-col items-center justify-center px-3 shrink-0">
            <span class="text-xs font-black text-divi-amber text-glow-amber">R$ {{ t.valor.toFixed(2).replace('.', ',') }}</span>
            <span class="text-xs tracking-widest text-divi-t3/30 mt-0.5">➔➔➔</span>
          </div>

          <!-- Destinatário -->
          <div class="flex items-center gap-2 flex-1 justify-end min-w-0 text-right">
            <div class="min-w-0">
              <strong class="text-xs font-bold block truncate leading-tight">{{ t.paraNome }}</strong>
              <span class="text-[8px] text-divi-t3 font-medium">recebe Pix</span>
            </div>
            <div class="w-8 h-8 rounded-full bg-divi-s2 border border-divi-border font-black text-xs text-divi-t1 flex items-center justify-center shrink-0">
              {{ t.paraNome[0].toUpperCase() }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
