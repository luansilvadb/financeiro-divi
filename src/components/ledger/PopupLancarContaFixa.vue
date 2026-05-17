<template>
  <div v-if="visible" class="fixed inset-0 bg-[#040814]/80 backdrop-blur-md flex items-center justify-center z-[9999] p-4">
    <div class="glass-card w-full max-w-[420px] rounded-3xl p-6 relative text-divi-t1 space-y-5 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
      <h3 class="text-xl font-black text-divi-t1 flex items-center gap-2 mb-2">
        <span>{{ bill?.icon }}</span> Lançar {{ bill?.name }}
      </h3>

      <!-- Valor Input -->
      <div class="space-y-2">
        <label class="block text-xs font-black uppercase tracking-wider text-divi-t2">Valor Total do Talão (R$)</label>
        <input 
          type="number" 
          step="0.01"
          v-model.number="valorReal"
          class="w-full px-4 py-3 rounded-2xl glass-input outline-none font-bold text-divi-t1"
          placeholder="0,00"
        />
      </div>

      <!-- Payer Selection -->
      <div class="space-y-2">
        <label class="block text-xs font-black uppercase tracking-wider text-divi-t2">Quem pagou?</label>
        <div class="flex gap-2 flex-wrap">
          <button 
            v-for="m in membros" 
            :key="m.id"
            @click="compradorId = m.id"
            class="px-4 py-2.5 rounded-xl border font-bold text-xs transition-all duration-200"
            :class="compradorId === m.id ? 'bg-divi-primary border-indigo-400 text-white font-black shadow-[0_0_12px_var(--primary-glow)]' : 'bg-divi-s1 border-divi-border text-divi-t2 hover:bg-divi-s2'"
          >
            {{ m.nome }}
          </button>
        </div>
      </div>

      <!-- Split Selection -->
      <div class="space-y-2">
        <label class="block text-xs font-black uppercase tracking-wider text-divi-t2">Dividido com quem?</label>
        <div class="flex gap-2 flex-wrap">
          <button 
            v-for="m in membros" 
            :key="m.id"
            @click="toggleSplit(m.id)"
            class="px-4 py-2.5 rounded-xl border font-bold text-xs transition-all duration-200 flex items-center gap-2"
            :class="splitIds.includes(m.id) ? 'bg-divi-emerald-dim/15 border-divi-emerald text-divi-t1 shadow-[0_0_12px_var(--emerald-glow)]' : 'bg-divi-s1 border-divi-border text-divi-t2 hover:bg-divi-s2'"
          >
            <span>{{ splitIds.includes(m.id) ? '✅' : '⬜' }}</span> {{ m.nome }}
          </button>
        </div>
      </div>

      <!-- Cognitive Reassurance -->
      <div class="bg-divi-s1/50 p-4 rounded-2xl border border-divi-border text-sm text-divi-t2 shadow-inner leading-relaxed">
        A conta de <strong class="text-divi-t1">R$ {{ (valorReal || 0).toFixed(2) }}</strong> paga por <strong class="text-divi-t1">{{ obterNome(compradorId) }}</strong> será dividida igualmente entre <strong class="text-divi-t1">{{ splitIds.map(obterNome).join(', ') }}</strong>. Cada um assume <strong class="text-divi-emerald text-glow-emerald font-black">R$ {{ obterDivisao() }}</strong>.
      </div>

      <!-- Actions -->
      <div class="flex justify-end gap-3 pt-2">
        <button @click="$emit('cancel')" class="px-5 py-3 text-xs font-black bg-divi-s2 hover:bg-divi-s3 text-divi-t1 border border-divi-border rounded-2xl transition-all">
          Cancelar
        </button>
        <button 
          @click="confirmar" 
          class="px-5 py-3 text-xs font-black bg-divi-amber border border-amber-500/25 hover:bg-amber-600 text-slate-950 font-black rounded-2xl shadow-[0_0_16px_var(--amber-dim)] transition-all" 
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
import type { ContaFixa } from '../../modules/ledger/core/domain/ContaFixa'

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
