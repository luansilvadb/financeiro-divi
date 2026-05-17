<template>
  <div v-if="visible" class="fixed inset-0 bg-[#040814]/80 backdrop-blur-md flex items-center justify-center z-[9999] p-4">
    <div class="glass-card w-full max-w-[420px] rounded-3xl p-6 relative text-divi-t1 space-y-5 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
      <h3 class="text-xl font-black text-divi-t1 flex items-center gap-2 mb-2">
        ⚙️ Configurar Conta Fixa
      </h3>

      <!-- Nome -->
      <div class="space-y-2">
        <label class="block text-xs font-black uppercase tracking-wider text-divi-t2">Nome do Talão</label>
        <input 
          v-model="name" 
          type="text" 
          class="w-full px-4 py-3 rounded-2xl glass-input outline-none font-bold text-divi-t1" 
        />
      </div>

      <!-- Emoji Selector -->
      <div class="space-y-2">
        <label class="block text-xs font-black uppercase tracking-wider text-divi-t2">Emoji / Ícone</label>
        <div class="flex gap-2 flex-wrap justify-start">
          <button 
            v-for="e in ['🔑','💡','💧','🌐','🐶','🔥','🛒','🍔','🚗','💊']" 
            :key="e"
            @click="icon = e"
            class="text-2xl p-2.5 rounded-xl border transition-all duration-150"
            :class="icon === e ? 'bg-divi-primary border-indigo-500 text-white scale-110 shadow-[0_0_12px_var(--primary-glow)]' : 'bg-divi-s1 border-divi-border hover:bg-divi-s2 text-divi-t2'"
          >
            {{ e }}
          </button>
        </div>
      </div>

      <!-- Valor Fixo Sugerido -->
      <div class="space-y-2">
        <label class="block text-xs font-black uppercase tracking-wider text-divi-t2">Valor Sugerido Padrão (Opcional)</label>
        <input 
          v-model.number="fixedValue" 
          type="number" 
          step="0.01" 
          class="w-full px-4 py-3 rounded-2xl glass-input outline-none font-bold text-divi-t1" 
          placeholder="Ex: 150,00" 
        />
      </div>

      <!-- Divisão Padrão -->
      <div class="space-y-2">
        <label class="block text-xs font-black uppercase tracking-wider text-divi-t2">Quem divide por padrão?</label>
        <div class="flex gap-2 flex-wrap">
          <button 
            v-for="m in membros" 
            :key="m.id"
            @click="toggleSplit(m.id)"
            class="px-4 py-2.5 rounded-xl border font-bold text-xs transition-all duration-200"
            :class="defaultSplit.includes(m.id) ? 'bg-divi-primary border-indigo-400 text-white font-black shadow-[0_0_12px_var(--primary-glow)]' : 'bg-divi-s1 border-divi-border text-divi-t2 hover:bg-divi-s2'"
          >
            {{ m.nome }}
          </button>
        </div>
      </div>

      <div class="flex justify-between items-center flex-wrap gap-3 pt-2">
        <button 
          v-if="bill?.id" 
          @click="$emit('delete', bill.id)" 
          class="px-4 py-3 text-xs font-black bg-divi-rose-dim/15 hover:bg-divi-rose-dim/30 text-divi-rose border border-divi-rose/25 rounded-2xl transition-all"
        >
          🗑️ Excluir Conta
        </button>
        <div class="flex gap-2 ml-auto">
          <button @click="$emit('cancel')" class="px-5 py-3 text-xs font-black bg-divi-s2 hover:bg-divi-s3 text-divi-t1 border border-divi-border rounded-2xl transition-all">
            Cancelar
          </button>
          <button 
            @click="salvar" 
            class="px-5 py-3 text-xs font-black bg-divi-emerald border border-emerald-500/25 hover:bg-emerald-600 text-white rounded-2xl shadow-[0_0_16px_var(--emerald-glow)] transition-all" 
            :disabled="!name"
          >
            Salvar
          </button>
        </div>
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

const emit = defineEmits(['save', 'delete', 'cancel'])

const name = ref('')
const icon = ref('💡')
const fixedValue = ref<number | null>(null)
const defaultSplit = ref<string[]>([])

watch(() => props.bill, (newBill) => {
  if (newBill) {
    name.value = newBill.name
    icon.value = newBill.icon
    fixedValue.value = newBill.fixedValue
    defaultSplit.value = [...newBill.defaultSplit]
  } else {
    name.value = ''
    icon.value = '💡'
    fixedValue.value = null
    defaultSplit.value = props.membros.map(m => m.id)
  }
}, { immediate: true })

const toggleSplit = (id: string) => {
  if (defaultSplit.value.includes(id)) {
    if (defaultSplit.value.length > 1) {
      defaultSplit.value = defaultSplit.value.filter(sid => sid !== id)
    }
  } else {
    defaultSplit.value.push(id)
  }
}

const salvar = () => {
  emit('save', {
    id: props.bill?.id || `rec_custom_${Date.now()}`,
    name: name.value,
    icon: icon.value,
    fixedValue: fixedValue.value && fixedValue.value > 0 ? fixedValue.value : null,
    defaultSplit: defaultSplit.value
  })
}
</script>
