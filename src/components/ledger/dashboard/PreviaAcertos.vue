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

  // Balanço positivo = deve PAGAR; balanço negativo = deve RECEBER (crédito)
  return props.membros.map(m => {
    const consumo = consumoMap[m.id] || 0
    const ant = antMap[m.id] || 0
    const balanco = consumo - ant
    return {
      id: m.id,
      nome: m.nome,
      consumo: consumo / 100,
      antecipado: ant / 100,
      balanco: balanco / 100
    }
  })
})

// Calcula as transferências Pix otimizadas para liquidação
const transferenciasPix = computed(() => {
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
    <div class="flex justify-between items-center border-b border-stone-surface pb-1.5">
      <span class="text-xs font-bold uppercase text-ash tracking-wider">Prévia de Acertos (Saldos Coletivos)</span>
      <span class="text-[9px] text-ember font-bold bg-ember/15 border border-ember/20 px-2 py-0.5 rounded">Reativo</span>
    </div>

    <!-- Tabela de Consumos e Adiantamentos Individuais -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-2.5">
      <div 
        v-for="s in saldosLiquidos" 
        :key="s.id"
        :class="[
          'p-3.5 rounded-cards border transition-all flex flex-col justify-between space-y-2.5 bg-card shadow-subtle',
          s.id === props.responsavelId ? 'border-ember/40 bg-ember/5' : 'border-stone-surface'
        ]"
      >
        <div class="flex justify-between items-center">
          <div class="flex items-center gap-2">
            <div class="w-6 h-6 rounded-full bg-stone-surface border border-stone-surface font-bold text-[9px] flex items-center justify-center text-charcoal">
              {{ s.nome[0].toUpperCase() }}
            </div>
            <strong class="text-xs text-charcoal font-bold">{{ s.nome }}</strong>
          </div>
          <span 
            v-if="s.id === props.responsavelId" 
            class="text-[8px] bg-ember/15 text-ember font-bold border border-ember/20 px-1.5 py-0.5 rounded uppercase"
          >
            Quitou Fatura
          </span>
        </div>

        <div class="grid grid-cols-2 gap-2 text-[9px]">
          <div>
            <span class="text-ash font-medium block">Consumido:</span>
            <strong class="text-charcoal font-bold">R$ {{ s.consumo.toFixed(2).replace('.', ',') }}</strong>
          </div>
          <div>
            <span class="text-ash font-medium block">Adiantado:</span>
            <strong class="text-charcoal font-bold">R$ {{ s.antecipado.toFixed(2).replace('.', ',') }}</strong>
          </div>
        </div>

        <div class="pt-1.5 border-t border-stone-surface flex justify-between items-center text-[10px]">
          <span class="text-ash font-bold">Líquido:</span>
          <strong 
            :class="[
              'font-semibold',
              s.balanco > 0 ? 'text-coral-red' : s.balanco < 0 ? 'text-meadow-green' : 'text-smoke'
            ]"
          >
            {{ s.balanco > 0 ? `Deve R$ ${s.balanco.toFixed(2).replace('.', ',')}` : s.balanco < 0 ? `Crédito R$ ${Math.abs(s.balanco).toFixed(2).replace('.', ',')}` : 'Zerado' }}
          </strong>
        </div>
      </div>
    </div>

    <!-- Fluxo Pix Recomendado (Quem Paga Quem) -->
    <div class="bg-card shadow-subtle border border-stone-surface text-graphite rounded-cards p-4 space-y-3">
      <div class="flex items-center gap-2">
        <span class="text-base">💸</span>
        <div>
          <h4 class="text-xs font-bold uppercase tracking-wider text-charcoal">Fluxo do Acerto (Pix)</h4>
          <span class="text-[9px] text-ash font-bold block mt-0.5">Transferências calculadas para acerto de contas</span>
        </div>
      </div>

      <div v-if="transferenciasPix.length === 0" class="text-center py-3 text-xs text-ash">
        ⚖️ Contas zeradas! Não há necessidade de transferências Pix.
      </div>

      <div class="space-y-2" v-else>
        <div 
          v-for="(t, idx) in transferenciasPix" 
          :key="idx"
          class="flex items-center justify-between bg-stone-surface/30 border border-stone-surface p-3 rounded-cards"
        >
          <!-- Remetente -->
          <div class="flex items-center gap-2 flex-1 min-w-0">
            <div class="w-8 h-8 rounded-full bg-stone-surface border border-stone-surface font-bold text-xs text-charcoal flex items-center justify-center shrink-0">
              {{ t.deNome[0].toUpperCase() }}
            </div>
            <div class="min-w-0">
              <strong class="text-xs font-bold block truncate leading-tight">{{ t.deNome }}</strong>
              <span class="text-[8px] text-ash font-medium">envia Pix</span>
            </div>
          </div>

          <!-- Seta com Direção e Valor -->
          <div class="flex flex-col items-center justify-center px-3 shrink-0">
            <span class="text-xs font-semibold text-ember">R$ {{ t.valor.toFixed(2).replace('.', ',') }}</span>
            <span class="text-xs tracking-widest text-ash/30 mt-0.5">➔➔➔</span>
          </div>

          <!-- Destinatário -->
          <div class="flex items-center gap-2 flex-1 justify-end min-w-0 text-right">
            <div class="min-w-0">
              <strong class="text-xs font-bold block truncate leading-tight">{{ t.paraNome }}</strong>
              <span class="text-[8px] text-ash font-medium">recebe Pix</span>
            </div>
            <div class="w-8 h-8 rounded-full bg-stone-surface border border-stone-surface font-bold text-xs text-charcoal flex items-center justify-center shrink-0">
              {{ t.paraNome[0].toUpperCase() }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
