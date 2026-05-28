<script setup lang="ts">
import { TrendingUp } from 'lucide-vue-next'
import Card from '../../ui/Card.vue'

defineProps<{
  membrosVisiveis: { id: string; nome: string }[]
  saldosUnificadosAtivos: Record<string, number>
}>()
</script>

<template>
  <Card class="p-0 overflow-hidden shadow-subtle bg-white text-graphite">
    <div class="py-7 px-6 border-b border-stone bg-parchment flex items-center">
      <div class="flex items-center gap-5">
        <div class="w-11 h-11 rounded-xl bg-midnight text-white flex items-center justify-center shadow-sm">
          <TrendingUp class="w-5 h-5" />
        </div>
        <div>
          <h3 class="font-bold text-lg leading-tight text-charcoal tracking-tight">Saldos Unificados</h3>
          <p class="text-[11px] text-ash uppercase tracking-wider mt-0.5 font-medium">
            Créditos e débitos da casa
          </p>
        </div>
      </div>
    </div>

    <div class="p-6 space-y-4 relative z-10">
      <div 
        v-for="m in membrosVisiveis" 
        :key="m.id" 
        class="group flex justify-between items-center p-4 rounded-xl border border-stone bg-canvas hover:border-ember/30 hover:bg-white transition-all duration-300"
      >
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-full bg-ember/10 flex items-center justify-center font-display text-lg text-ember">
            {{ m.nome[0] }}
          </div>
          <div>
            <span class="font-bold text-base block text-charcoal">{{ m.nome }}</span>
            <span class="text-[11px] text-ash block mt-0.5">
              {{ (saldosUnificadosAtivos[m.id] ?? 0) > 0.005 ? 'Crédito acumulado' : (saldosUnificadosAtivos[m.id] ?? 0) < -0.005 ? 'Débito pendente' : 'Tudo em dia' }}
            </span>
          </div>
        </div>
        <div class="text-right">
          <span :class="['font-display text-xl block', (saldosUnificadosAtivos[m.id] ?? 0) > 0.005 ? 'text-meadow' : (saldosUnificadosAtivos[m.id] ?? 0) < -0.005 ? 'text-coral' : 'text-ash']">
            {{ (saldosUnificadosAtivos[m.id] ?? 0) > 0.005 ? '+' : '' }}R$ {{ (saldosUnificadosAtivos[m.id] ?? 0).toFixed(2).replace('.', ',') }}
          </span>
        </div>
      </div>
    </div>
  </Card>
</template>
