<script setup lang="ts">
import { Sparkles, ArrowUpRight } from 'lucide-vue-next'
import Card from '../../ui/Card.vue'
import Button from '../../ui/Button.vue'

defineProps<{
  nettingTransferencias: any[]
  faturaSelecionadaFechada: boolean
  getMembroNome: (id: string) => string
}>()

const emit = defineEmits<{
  (e: 'abrirNetting', transferencia: any): void
}>()
</script>

<template>
  <Card class="!p-0 overflow-hidden shadow-subtle bg-white text-graphite">
    <!-- Cabeçalho Padronizado -->
    <div class="py-5 px-5 sm:py-7 sm:px-6 border-b border-stone bg-parchment flex justify-between items-center">
      <div class="flex items-center gap-5">
        <div class="w-11 h-11 rounded-xl bg-midnight text-white flex items-center justify-center shadow-sm">
          <Sparkles class="w-5 h-5" aria-hidden="true" />
        </div>
        <div>
          <h2 class="font-bold text-lg leading-tight text-charcoal tracking-tight">Acertos Inteligentes</h2>
          <p class="text-[11px] text-graphite uppercase tracking-widest mt-0.5 font-semibold">
            Compensação otimizada de saldos
          </p>
        </div>
      </div>
    </div>

    <div class="p-4 sm:p-6 grid gap-4">
      <div 
        v-for="t in nettingTransferencias" 
        :key="t.from + '-' + t.to" 
        class="p-5 border border-stone bg-canvas rounded-2xl shadow-subtle hover:border-ember/30 transition-all duration-300"
      >
        <div class="flex flex-col gap-5">
          <div class="flex items-start gap-4">
            <div class="w-12 h-12 rounded-full bg-ember/10 flex items-center justify-center shrink-0 shadow-subtle">
              <ArrowUpRight class="w-6 h-6 text-ember" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-sm leading-snug text-graphite font-medium">
                <span class="font-bold text-charcoal">{{ getMembroNome(t.from) }}</span> 
                deve enviar para 
                <span class="font-bold text-charcoal">{{ getMembroNome(t.to) }}</span>
              </p>
              <p class="font-display text-3xl text-ember mt-1 tracking-tight">
                R$ {{ t.val.toFixed(2).replace('.', ',') }}
              </p>
            </div>
          </div>
          <div class="w-full">
            <Button 
              @click="$emit('abrirNetting', t)"
              variant="primary"
              class="w-full h-12 font-bold uppercase tracking-widest text-[10px] shadow-sm"
            >
              Registrar Pagamento
            </Button>
          </div>
        </div>
      </div>
    </div>
  </Card>
</template>
