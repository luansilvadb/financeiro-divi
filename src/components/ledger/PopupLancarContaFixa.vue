<template>
  <div v-if="visible" class="fixed inset-0 bg-black-80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
    <div class="bg-panel-dark border border-white-08 rounded-3xl p-6 max-w-lg w-full shadow-2xl relative text-white">
      <h3 class="text-xl font-black text-white flex items-center gap-2 mb-4">
        <span>{{ bill.icon }}</span> Lançar {{ bill.name }}
      </h3>

      <!-- Valor Input -->
      <div class="mb-5">
        <label class="block text-xs font-black uppercase tracking-wider text-text-muted mb-2">Valor Total do Talão (R$)</label>
        <input 
          type="number" 
          step="0.01"
          v-model.number="valorReal"
          class="w-full bg-panel-light border border-white-05 p-3 rounded-xl text-white font-extrabold focus:border-primary outline-none"
          placeholder="0,00"
        />
      </div>

      <!-- Payer Selection -->
      <div class="mb-5">
        <label class="block text-xs font-black uppercase tracking-wider text-text-muted mb-2">Quem pagou?</label>
        <div class="flex gap-2 flex-wrap">
          <button 
            v-for="m in membros" 
            :key="m.id"
            @click="compradorId = m.id"
            class="px-4 py-2.5 rounded-xl border font-bold text-xs transition-all duration-200"
            :class="compradorId === m.id ? 'bg-primary border-primary text-white font-black' : 'bg-panel-light border-white-05 text-text-dim'"
          >
            {{ m.nome }}
          </button>
        </div>
      </div>

      <!-- Split Selection -->
      <div class="mb-5">
        <label class="block text-xs font-black uppercase tracking-wider text-text-muted mb-2">Dividido com quem?</label>
        <div class="flex gap-2 flex-wrap">
          <button 
            v-for="m in membros" 
            :key="m.id"
            @click="toggleSplit(m.id)"
            class="px-4 py-2.5 rounded-xl border font-bold text-xs transition-all duration-200 flex items-center gap-2"
            :class="splitIds.includes(m.id) ? 'bg-emerald-20 border-accent-emerald text-white' : 'bg-panel-light border-white-05 text-text-dim'"
          >
            <span>{{ splitIds.includes(m.id) ? '✅' : '⬜' }}</span> {{ m.nome }}
          </button>
        </div>
      </div>

      <!-- Cognitive Reassurance -->
      <div class="bg-black-18 p-4 rounded-2xl border border-white-04 mb-6 text-sm text-text-muted">
        A conta de <strong class="text-white">R$ {{ (valorReal || 0).toFixed(2) }}</strong> paga por <strong class="text-white">{{ obterNome(compradorId) }}</strong> será dividida igualmente entre <strong class="text-white">{{ splitIds.map(obterNome).join(', ') }}</strong>. Cada um assume <strong class="text-accent-emerald">R$ {{ obterDivisao() }}</strong>.
      </div>

      <!-- Actions -->
      <div class="flex justify-end gap-3">
        <button @click="$emit('cancel')" class="px-5 py-3 text-xs font-black bg-white-06 hover:bg-white-12 text-white border border-white-08 rounded-xl transition-all">
          Cancelar
        </button>
        <button 
          @click="confirmar" 
          class="px-5 py-3 text-xs font-black bg-accent-yellow hover:bg-yellow-400 text-green-950 rounded-xl transition-all" 
          :disabled="valorReal <= 0 || !compradorId || splitIds.length === 0"
        >
          Confirmar e Lançar
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { ContaFixa } from '../../core/domain/ContaFixa'

const props = defineProps<{
  visible: boolean
  bill: ContaFixa
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
