<template>
  <BottomSheet :model-value="visible" @update:model-value="val => { if (!val) $emit('cancel') }" width-class="md:w-[420px]">
    <div class="p-6 sm:p-8 space-y-5 flex flex-col flex-grow overflow-y-auto custom-scrollbar">
      <div class="flex items-start gap-3">
        <div class="w-10 h-10 rounded-full bg-parchment shadow-subtle flex items-center justify-center text-base shrink-0">
          {{ bill?.icon }}
        </div>
        <div class="min-w-0">
          <h3 class="text-[19px] leading-tight font-semibold text-charcoal tracking-[-0.25px]">
            Lancar {{ bill?.name }}
          </h3>
          <p class="text-xs text-ash mt-1 leading-snug">
            Registre valor, pagador e divisao.
          </p>
        </div>
      </div>

      <div class="rounded-card bg-parchment shadow-subtle p-4">
        <label class="block text-xs font-semibold text-ash tracking-[-0.14px] mb-2">Valor do talao</label>
        <div class="flex items-center gap-2">
          <span class="text-[23px] font-semibold text-charcoal tracking-[-0.44px]">R$</span>
          <input
            type="number"
            step="0.01"
            v-model.number="valorReal"
            data-testid="valor-conta-fixa"
            class="w-full bg-transparent outline-none text-[32px] leading-none font-semibold text-midnight tracking-[-0.8px] placeholder:text-smoke"
            placeholder="0,00"
          />
        </div>
      </div>

      <div class="space-y-2">
        <label class="block text-xs font-semibold text-charcoal tracking-[-0.14px]">Quem pagou?</label>
        <div class="flex gap-2 flex-wrap">
          <button
            v-for="m in membros"
            :key="m.id"
            @click="compradorId = m.id"
            class="px-3.5 py-2 rounded-full text-xs font-semibold transition-colors shadow-subtle"
            :class="compradorId === m.id ? 'bg-midnight text-white' : 'bg-stone text-graphite hover:bg-stone'"
            :data-testid="`pagador-${m.id}`"
          >
            {{ m.nome }}
          </button>
        </div>
      </div>

      <div class="space-y-2">
        <label class="block text-xs font-semibold text-charcoal tracking-[-0.14px]">Dividir com quem?</label>
        <div class="flex gap-2 flex-wrap">
          <button
            v-for="m in membros"
            :key="m.id"
            @click="toggleSplit(m.id)"
            class="px-3.5 py-2 rounded-full text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-subtle"
            :class="splitIds.includes(m.id) ? 'bg-white text-charcoal' : 'bg-stone text-ash hover:bg-stone'"
            :data-testid="`split-${m.id}`"
          >
            <span
              class="w-2 h-2 rounded-full"
              :class="splitIds.includes(m.id) ? 'bg-meadow' : 'bg-ash/30'"
            ></span>
            {{ m.nome }}
          </button>
        </div>
      </div>

      <div class="rounded-card bg-parchment p-4 shadow-subtle text-xs leading-relaxed text-graphite">
        <p class="font-semibold text-charcoal mb-1">Resumo da divisao</p>
        <p>
          R$ {{ (valorReal || 0).toFixed(2).replace('.', ',') }} pago por
          <strong>{{ obterNome(compradorId) }}</strong>, dividido entre
          <strong>{{ splitIds.length }}</strong> pessoa{{ splitIds.length === 1 ? '' : 's' }}.
          Cada uma assume <strong>R$ {{ obterDivisao().replace('.', ',') }}</strong>.
        </p>
      </div>

      <div class="grid grid-cols-2 gap-3 pt-1">
        <button @click="$emit('cancel')" class="px-4 py-3 text-xs font-semibold bg-stone hover:bg-stone text-midnight rounded-full transition-colors">
          Cancelar
        </button>
        <button
          @click="confirmar"
          class="px-4 py-3 text-xs font-semibold bg-midnight hover:bg-charcoal text-white rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          :disabled="valorReal <= 0 || !compradorId || splitIds.length === 0"
          data-testid="confirmar-conta-fixa"
        >
          Lancar conta
        </button>
      </div>
    </div>
  </BottomSheet>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { ContaFixa } from '../../modules/ledger/core/domain/ContaFixa'
import BottomSheet from '../ui/BottomSheet.vue'

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
    valorReal.value = newBill.fixedValue || 0
    compradorId.value = props.membros[0]?.id || ''
    
    // Filtra apenas os IDs que realmente existem na lista de membros atual
    const validSplitIds = newBill.defaultSplit.filter(id => 
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
    valorReal: valorReal.value,
    compradorId: compradorId.value,
    splitIds: splitIds.value
  })
}
</script>
