<!-- src/views/components/ledger/dashboard/HelpExplanationModal.vue -->
<script setup lang="ts">
import BottomSheet from '../../ui/BottomSheet.vue'
import Button from '../../ui/Button.vue'
import { ArrowUpRight, ArrowDownLeft, Scale, Info } from 'lucide-vue-next'

interface Props {
  show: boolean
}

defineProps<Props>()
const emit = defineEmits<{
  (e: 'close'): void
}>()
</script>

<template>
  <BottomSheet
    :model-value="show"
    @update:model-value="val => { if (!val) emit('close') }"
    subtitle="Saiba como o DIVI calcula as divisões de despesas da casa para facilitar os acertos de contas."
  >
    <template #title>
      <h3 class="text-3xl font-display text-charcoal leading-tight">
        Entenda os <span class="text-ember">Saldos</span>
      </h3>
    </template>

    <div class="space-y-6 pt-4">
      <!-- Item: A Receber (Créditos) -->
      <div class="flex items-start gap-4 p-4 rounded-2xl bg-meadow/5 border border-meadow/10">
        <div class="w-10 h-10 rounded-xl bg-meadow/10 text-meadow flex items-center justify-center shrink-0 shadow-sm">
          <ArrowUpRight class="w-5 h-5" />
        </div>
        <div>
          <h4 class="font-bold text-sm text-charcoal tracking-tight">Valores a Receber (Crédito)</h4>
          <p class="text-xs text-graphite font-medium mt-1 leading-relaxed">
            Sempre que você paga uma conta do grupo ou usa o seu cartão para o grupo, você acumula um <strong class="text-meadow font-semibold">Crédito (+)</strong>. Isso significa que o grupo deve te devolver esse valor.
          </p>
        </div>
      </div>

      <!-- Item: A Pagar (Débitos) -->
      <div class="flex items-start gap-4 p-4 rounded-2xl bg-coral/5 border border-coral/10">
        <div class="w-10 h-10 rounded-xl bg-coral/10 text-coral flex items-center justify-center shrink-0 shadow-sm">
          <ArrowDownLeft class="w-5 h-5" />
        </div>
        <div>
          <h4 class="font-bold text-sm text-charcoal tracking-tight">Valores a Pagar (Débito)</h4>
          <p class="text-xs text-graphite font-medium mt-1 leading-relaxed">
            Quando você consome itens pagos por outra pessoa ou usa a fatura do cartão de outro membro, você acumula um <strong class="text-coral font-semibold">Débito (-)</strong>. Significa que você deve pagar sua parte de volta.
          </p>
        </div>
      </div>

      <!-- Item: Saldo Final -->
      <div class="flex items-start gap-4 p-4 rounded-2xl bg-stone/30 border border-stone">
        <div class="w-10 h-10 rounded-xl bg-white text-charcoal flex items-center justify-center shrink-0 shadow-sm">
          <Scale class="w-5 h-5" />
        </div>
        <div>
          <h4 class="font-bold text-sm text-charcoal tracking-tight">Saldo Final Unificado</h4>
          <p class="text-xs text-graphite font-medium mt-1 leading-relaxed">
            É a matemática final. O sistema junta tudo o que você pagou e subtrai o que você consumiu. O resultado mostra seu saldo líquido final: se deve pagar ou se tem dinheiro a receber.
          </p>
        </div>
      </div>

      <!-- Nota Importante -->
      <div class="flex items-center gap-3 p-3.5 bg-canvas border border-stone rounded-xl">
        <Info class="w-4 h-4 text-ash shrink-0" />
        <p class="text-[11px] text-graphite font-semibold leading-snug">
          O objetivo é fazer com que a soma dos saldos de todos na casa seja sempre zero.
        </p>
      </div>
    </div>

    <template #footer>
      <Button 
        variant="primary" 
        class="w-full font-bold uppercase tracking-widest text-xs h-12 rounded-pill" 
        @click="emit('close')"
      >
        Entendi, Fechar
      </Button>
    </template>
  </BottomSheet>
</template>

<style scoped>
</style>
