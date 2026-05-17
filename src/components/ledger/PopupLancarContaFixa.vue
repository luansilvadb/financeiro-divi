<template>
  <BottomSheet :model-value="visible" @update:model-value="val => { if (!val) $emit('cancel') }" width-class="md:w-[420px]">
    <div class="p-8 relative text-charcoal space-y-6 flex flex-col flex-grow">
      <h3 class="text-xl font-display text-charcoal flex items-center gap-2 mb-2">
        <span>{{ bill?.icon }}</span> Lançar {{ bill?.name }}
      </h3>

      <!-- Valor Input -->
      <div class="space-y-2">
        <label class="block text-[10px] font-bold uppercase tracking-widest text-ash">Valor Total do Talão (R$)</label>
        <input 
          type="number" 
          step="0.01"
          v-model.number="valorReal"
          class="w-full px-4 py-3 rounded-xl border border-stone bg-[#fbfaf9] outline-none font-bold text-charcoal focus:border-ember transition-all text-sm"
          placeholder="0,00"
        />
      </div>

      <!-- Payer Selection -->
      <div class="space-y-2">
        <label class="block text-[10px] font-bold uppercase tracking-widest text-ash">Quem pagou?</label>
        <div class="flex gap-2 flex-wrap">
          <button 
            v-for="m in membros" 
            :key="m.id"
            @click="compradorId = m.id"
            class="px-4 py-2.5 rounded-xl border border-stone-surface font-bold text-xs transition-all duration-200"
            :class="compradorId === m.id ? 'bg-ember text-white font-bold border border-stone-surface shadow-sm' : 'bg-stone text-charcoal hover:bg-[#eae7e2]'"
          >
            {{ m.nome }}
          </button>
        </div>
      </div>

      <!-- Split Selection -->
      <div class="space-y-2">
        <label class="block text-[10px] font-bold uppercase tracking-widest text-ash">Dividido com quem?</label>
        <div class="flex gap-2 flex-wrap">
          <button 
            v-for="m in membros" 
            :key="m.id"
            @click="toggleSplit(m.id)"
            class="px-4 py-2.5 rounded-xl border border-stone-surface font-bold text-xs transition-all duration-200 flex items-center gap-2"
            :class="splitIds.includes(m.id) ? 'bg-meadow/10 border-meadow/40 text-meadow font-bold shadow-sm' : 'bg-stone text-charcoal hover:bg-[#eae7e2]'"
          >
            <span>{{ splitIds.includes(m.id) ? '✅' : '⬜' }}</span> {{ m.nome }}
          </button>
        </div>
      </div>

      <!-- Cognitive Reassurance (Caixa Meadow Green no padrão Family) -->
      <div class="bg-meadow/5 p-4 rounded-xl border border-meadow/20 text-xs text-meadow leading-relaxed font-semibold">
        A conta de <strong>R$ {{ (valorReal || 0).toFixed(2).replace('.', ',') }}</strong> paga por <strong>{{ obterNome(compradorId) }}</strong> será dividida igualmente entre <strong>{{ splitIds.map(obterNome).join(', ') }}</strong>. Cada um assume <strong>R$ {{ obterDivisao().replace('.', ',') }}</strong>.
      </div>

      <!-- Actions -->
      <div class="flex justify-end gap-3 pt-2">
        <button @click="$emit('cancel')" class="px-5 py-3 text-xs font-bold bg-[#f2f0ed] hover:bg-[#eae7e2] text-graphite border border-stone-surface rounded-xl transition-all">
          Cancelar
        </button>
        <button 
          @click="confirmar" 
          class="px-5 py-3 text-xs font-bold bg-ember border border-stone-surface hover:bg-[#ff551a] text-white rounded-xl shadow-sm transition-all" 
          :disabled="valorReal <= 0 || !compradorId || splitIds.length === 0"
        >
          Confirmar e Lançar
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
    splitIds.value = [...newBill.defaultSplit]
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
