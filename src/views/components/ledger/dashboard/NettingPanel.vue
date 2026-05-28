<script setup lang="ts">
import { Sparkles, ArrowUpRight } from 'lucide-vue-next'
import Card from '../../ui/Card.vue'
import Button from '../../ui/Button.vue'

defineProps<{
  nettingTransferencias: any[]
  faturaSelecionadaTrancada: boolean
  getMembroNome: (id: string) => string
}>()

const emit = defineEmits<{
  (e: 'abrirNetting', transferencia: any): void
}>()
</script>

<template>
  <Card class="p-0 overflow-hidden shadow-subtle bg-white text-graphite border-l-4 border-l-ember">
    <!-- Cabeçalho Padronizado -->
    <div class="p-6 border-b border-stone bg-parchment flex justify-between items-center">
      <div class="flex items-center gap-4">
        <div class="w-10 h-10 rounded-xl bg-midnight text-white flex items-center justify-center">
          <Sparkles class="w-5 h-5" />
        </div>
        <div>
          <h3 class="font-bold text-lg leading-tight text-charcoal">Acertos Otimizados</h3>
          <p class="text-[11px] text-ash uppercase tracking-wider mt-0.5">
            Compensação inteligente de dívidas
          </p>
        </div>
      </div>
    </div>

    <div class="p-6 grid gap-4">
      <div 
        v-for="t in nettingTransferencias" 
        :key="t.from + '-' + t.to" 
        class="p-5 border border-stone bg-canvas shadow-none rounded-xl"
      >
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div class="flex items-start gap-4">
            <div class="w-10 h-10 rounded-full bg-ember/10 flex items-center justify-center shrink-0">
              <ArrowUpRight class="w-5 h-5 text-ember" />
            </div>
            <div>
              <p class="text-sm leading-relaxed">
                <span class="font-bold text-charcoal">{{ getMembroNome(t.from) }}</span> 
                deve enviar para 
                <span class="font-bold text-charcoal">{{ getMembroNome(t.to) }}</span>
              </p>
              <p class="font-display text-2xl text-ember mt-1">
                R$ {{ t.val.toFixed(2).replace('.', ',') }}
              </p>
            </div>
          </div>
          <div class="w-full md:w-auto flex flex-col items-center">
            <Button 
              @click="$emit('abrirNetting', t)"
              :disabled="faturaSelecionadaTrancada"
              :aria-disabled="faturaSelecionadaTrancada"
              :aria-describedby="faturaSelecionadaTrancada ? 'netting-disabled-reason-' + t.from + '-' + t.to : undefined"
              variant="primary"
              class="w-full"
            >
              Confirmar Pix
            </Button>
            <p v-if="faturaSelecionadaTrancada" :id="'netting-disabled-reason-' + t.from + '-' + t.to" class="text-[10px] text-ash mt-1.5 text-center max-w-[150px] leading-tight animate-in fade-in">
              Reabra o mês para confirmar
            </p>
          </div>
        </div>
      </div>
    </div>
  </Card>
</template>
