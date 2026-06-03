<template>
  <BottomSheet :model-value="visible" @update:model-value="val => { if (!val) $emit('cancel') }" width-class="md:w-[440px]" max-height="90dvh">
    <div class="p-6 sm:p-8 space-y-6 flex flex-col flex-grow overflow-y-auto custom-scrollbar text-graphite">
      <div class="flex items-center gap-4">
        <div class="w-12 h-12 rounded-xl bg-canvas shadow-subtle flex items-center justify-center text-2xl shrink-0 border border-stone">
          {{ bill?.icon }}
        </div>
        <div class="min-w-0">
          <h3 class="text-2xl font-bold text-charcoal tracking-tighter leading-none">
            Lançar {{ bill?.name }}
          </h3>
          <p class="text-[10px] font-bold uppercase tracking-widest text-ember mt-1.5">
            Conta fixa recorrente
          </p>
        </div>
      </div>

      <div class="rounded-2xl bg-parchment shadow-subtle p-6 border border-stone/50 transition-all duration-300">
        <label for="fixed-bill-value" class="block text-[10px] font-bold text-graphite uppercase tracking-widest mb-3 ml-1">Valor do Talão</label>
        <div class="flex items-center gap-2.5">
          <span class="text-[24px] font-bold text-charcoal tracking-tight" aria-hidden="true">R$</span>
          <input
            id="fixed-bill-value"
            type="number"
            step="0.01"
            v-model.number="valorReal"
            data-testid="valor-conta-fixa"
            class="w-full bg-transparent border-none outline-none text-[40px] leading-none font-bold text-midnight tracking-tighter placeholder:text-stone/40"
            placeholder="0,00"
            autofocus
          />
        </div>
      </div>

      <div class="space-y-3">
        <label class="block text-[10px] font-bold text-graphite uppercase tracking-widest ml-1">Quem pagou este mês?</label>
        <div class="grid grid-cols-3 gap-2">
          <button
            v-for="m in membros"
            :key="m.id"
            @click="compradorId = m.id"
            class="py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 border-none cursor-pointer"
            :class="compradorId === m.id ? 'bg-midnight text-white shadow-sm scale-[1.02]' : 'bg-stone hover:bg-ash/20 text-charcoal'"
            :data-testid="`pagador-${m.id}`"
          >
            {{ m.nome }}
          </button>
        </div>
      </div>

      <div class="space-y-3">
        <label class="block text-[10px] font-bold text-graphite uppercase tracking-widest ml-1">Dividir com a casa</label>
        <div class="grid grid-cols-3 gap-2">
          <button
            v-for="m in membros"
            :key="m.id"
            @click="toggleSplit(m.id)"
            class="relative py-3.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all duration-300 flex flex-col items-center gap-2 border-none cursor-pointer"
            :class="splitIds.includes(m.id) ? 'bg-white shadow-subtle scale-[1.02] text-charcoal' : 'bg-stone/50 text-graphite opacity-60 hover:opacity-100'"
            :data-testid="`split-${m.id}`"
          >
            <div class="w-8 h-8 rounded-full flex items-center justify-center font-display text-sm" :class="splitIds.includes(m.id) ? 'bg-midnight text-white' : 'bg-canvas text-charcoal'">
              {{ m.nome[0] }}
            </div>
            <span>{{ m.nome }}</span>
            <div v-if="splitIds.includes(m.id)" class="absolute top-1 right-1 animate-in zoom-in-50 duration-300">
              <Check class="w-3 h-3 text-[#00a83d]" stroke-width="4" />
            </div>
          </button>
        </div>
      </div>

      <div class="rounded-2xl bg-[#00a83d]/5 border border-[#00a83d]/10 p-5 text-[11px] leading-relaxed text-[#00a83d] flex gap-4 items-center">
        <div class="w-10 h-10 rounded-full bg-[#00a83d]/10 flex items-center justify-center shrink-0">
          <Info class="w-5 h-5 text-[#00a83d]" />
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

      <div class="grid grid-cols-2 gap-3 pt-2">
        <Button
          variant="secondary"
          @click="$emit('cancel')"
          class="h-14 text-xs font-bold uppercase tracking-widest"
        >
          Cancelar
        </Button>
        <Button
          @click="confirmar"
          class="h-14 text-xs font-bold uppercase tracking-widest bg-midnight hover:bg-charcoal text-white rounded-pill transition-all shadow-md"
          :disabled="valorReal <= 0 || !compradorId || splitIds.length === 0"
          data-testid="confirmar-conta-fixa"
        >
          Confirmar Lançamento
        </Button>
      </div>
    </div>
  </BottomSheet>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { ContaFixa } from '../../../models/entities/ContaFixa'
import BottomSheet from '../ui/BottomSheet.vue'
import Button from '../ui/Button.vue'
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
