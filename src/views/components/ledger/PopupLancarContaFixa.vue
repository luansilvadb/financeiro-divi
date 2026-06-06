<template>
  <BottomSheet 
    :model-value="visible" 
    @update:model-value="val => { if (!val) $emit('cancel') }" 
    :title="`Lançar ${bill?.name}`"
    subtitle="Conta fixa recorrente"
    max-height="90dvh"
  >
    <template #header>
      <div class="flex items-center gap-4 w-full">
        <div class="w-12 h-12 rounded-xl bg-canvas shadow-subtle flex items-center justify-center text-2xl shrink-0 border border-stone">
          {{ bill?.icon }}
        </div>
        <div class="min-w-0">
          <h3 class="text-3xl font-display text-charcoal leading-tight">
            Lançar <span class="text-ember">{{ bill?.name }}</span>
          </h3>
        </div>
      </div>
    </template>

    <div class="space-y-6 pt-2">
      <!-- Input de Valor Padronizado -->
      <div class="space-y-2">
        <label for="fixed-bill-value" class="block text-[10px] font-bold uppercase tracking-widest text-graphite ml-1">Valor do Talão</label>
        <div class="relative">
          <span class="absolute left-4 top-1/2 -translate-y-1/2 text-graphite text-sm font-bold">R$</span>
          <input
            id="fixed-bill-value"
            type="number"
            step="0.01"
            v-model.number="valorReal"
            data-testid="valor-conta-fixa"
            class="w-full pl-10 pr-4 py-3.5 rounded-xl border border-stone bg-canvas outline-none font-bold text-sm text-charcoal focus:border-ember transition-all"
            placeholder="0,00"
            autofocus
          />
        </div>
      </div>

      <!-- Seletor de Comprador -->
      <div class="space-y-2">
        <label class="block text-[10px] font-bold uppercase text-graphite tracking-widest ml-1">Quem pagou este mês?</label>
        <div class="grid grid-cols-3 gap-2">
          <button
            v-for="m in membros"
            :key="m.id"
            @click="compradorId = m.id"
            class="group py-3 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all duration-300 border-none cursor-pointer flex flex-col items-center gap-2"
            :class="compradorId === m.id ? 'bg-midnight text-white shadow-sm scale-[1.02]' : 'bg-stone hover:bg-stone/80 text-charcoal'"
            :data-testid="`pagador-${m.id}`"
          >
            <MembroAvatar :nome="m.nome" size="sm" :variant="compradorId === m.id ? 'ember' : 'sky'" />
            <span class="truncate max-w-full px-1">{{ m.nome }}</span>
          </button>
        </div>
      </div>

      <!-- Seletor de Split -->
      <div class="space-y-2">
        <label class="block text-[10px] font-bold uppercase text-graphite tracking-widest ml-1">Dividir com a casa</label>
        <div class="grid grid-cols-3 gap-2">
          <button
            v-for="m in membros"
            :key="m.id"
            @click="toggleSplit(m.id)"
            class="group relative py-3 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all duration-300 flex flex-col items-center gap-2 border-none cursor-pointer"
            :class="splitIds.includes(m.id) ? 'bg-white shadow-subtle scale-[1.02] text-charcoal' : 'bg-stone/50 text-graphite opacity-60 hover:opacity-100'"
            :data-testid="`split-${m.id}`"
          >
            <MembroAvatar :nome="m.nome" size="sm" :variant="splitIds.includes(m.id) ? 'meadow' : 'sky'" />
            <span class="truncate max-w-full px-1">{{ m.nome }}</span>
            <div v-if="splitIds.includes(m.id)" class="absolute top-1.5 right-1.5 animate-in zoom-in-50 duration-300">
              <Check class="w-3.5 h-3.5 text-meadow" />
            </div>
          </button>
        </div>
      </div>

      <!-- Card de Resumo do Rateio -->
      <div class="rounded-2xl bg-meadow/5 border border-meadow/10 p-4 text-[11px] leading-relaxed text-meadow flex gap-4 items-center">
        <div class="w-10 h-10 rounded-full bg-meadow/10 flex items-center justify-center shrink-0">
          <Info class="w-5 h-5 text-meadow" />
        </div>
        <div class="space-y-0.5">
          <p class="font-bold uppercase tracking-widest">Resumo do Rateio</p>
          <p class="font-semibold">
            R$ {{ (valorReal || 0).toFixed(2).replace('.', ',') }} pagos por
            <span class="text-charcoal">{{ obterNome(compradorId) }}</span>, dividido entre
            <span class="text-charcoal">{{ splitIds.length }}</span> pessoa{{ splitIds.length === 1 ? '' : 's' }}.
            Cada uma assume <span class="font-bold text-charcoal">R$ {{ obterDivisao().replace('.', ',') }}</span>.
          </p>
        </div>
      </div>
    </div>

    <!-- Rodapé -->
    <template #footer>
      <div class="grid grid-cols-2 gap-3">
        <Button
          variant="secondary"
          @click="$emit('cancel')"
          class="h-12 text-[10px] font-bold uppercase tracking-widest"
        >
          Cancelar
        </Button>
        <Button
          @click="confirmar"
          class="h-12 text-[10px] font-bold uppercase tracking-widest"
          variant="primary"
          :disabled="valorReal <= 0 || !compradorId || splitIds.length === 0"
          data-testid="confirmar-conta-fixa"
        >
          Confirmar Lançamento
        </Button>
      </div>
    </template>
  </BottomSheet>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { ContaFixa } from '../../../models/entities/ContaFixa'
import BottomSheet from '../ui/BottomSheet.vue'
import Button from '../ui/Button.vue'
import MembroAvatar from '../ui/MembroAvatar.vue'
import { Check, Info } from 'lucide-vue-next'

const props = defineProps<{
  visible: boolean
  bill: ContaFixa | null
  membros: { id: string; nome: string }[]
}>()

const emit = defineEmits(['confirm', 'cancel'])

const valorReal = ref(0)
const compradorId = ref('')
const splitIds = ref<string[]>([])

watch(() => props.bill, (newBill) => {
  if (newBill) {
    valorReal.value = newBill.fixedValueCentavos !== null && newBill.fixedValueCentavos !== undefined ? newBill.fixedValueCentavos / 100 : 0
    compradorId.value = props.membros[0]?.id || ''
    
    // Filtra apenas os IDs que realmente existem na lista de membros atual
    const validSplitIds = (newBill.defaultSplit || []).filter(id => 
      props.membros.some(m => m.id === id)
    )
    
    if (validSplitIds.length > 0) {
      splitIds.value = [...validSplitIds]
    } else {
      // Fallback: Se o template estiver vazio ou com IDs antigos, seleciona todo mundo
      splitIds.value = props.membros.map(m => m.id)
    }
  }
}, { immediate: true })

const toggleSplit = (id: string) => {
  if (splitIds.value.includes(id)) {
    if (splitIds.value.length > 1) {
      splitIds.value = splitIds.value.filter(sid => sid !== id)
    }
  } else {
    splitIds.value.push(id)
  }
}

const obterNome = (id: string) => props.membros.find(m => m.id === id)?.nome || id

const obterDivisao = () => {
  if (splitIds.value.length === 0) return '0.00'
  return ((valorReal.value || 0) / splitIds.value.length).toFixed(2)
}

const confirmar = () => {
  emit('confirm', {
    valorCentavos: Math.round((valorReal.value || 0) * 100),
    compradorId: compradorId.value,
    splitIds: splitIds.value
  })
}
</script>
