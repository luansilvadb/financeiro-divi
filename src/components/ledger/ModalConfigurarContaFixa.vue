<template>
  <div v-if="visible" class="fixed inset-0 bg-black-80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
    <div class="bg-panel-dark border border-white-08 rounded-3xl p-6 max-w-lg w-full shadow-2xl relative text-white">
      <h3 class="text-xl font-black text-white flex items-center gap-2 mb-4">
        ⚙️ Configurar Conta Fixa
      </h3>

      <!-- Nome -->
      <div class="mb-4">
        <label class="block text-xs font-black uppercase tracking-wider text-text-muted mb-2">Nome do Talão</label>
        <input 
          v-model="name" 
          type="text" 
          class="w-full bg-panel-light border border-white-05 p-3 rounded-xl text-white outline-none focus:border-primary font-bold" 
        />
      </div>

      <!-- Emoji Selector -->
      <div class="mb-4">
        <label class="block text-xs font-black uppercase tracking-wider text-text-muted mb-2">Emoji / Ícone</label>
        <div class="flex gap-2 flex-wrap justify-start">
          <button 
            v-for="e in ['🔑','💡','💧','🌐','🐶','🔥','🛒','🍔','🚗','💊']" 
            :key="e"
            @click="icon = e"
            class="text-2xl p-2.5 rounded-xl border border-white-05 transition-all duration-150"
            :class="icon === e ? 'bg-primary border-primary text-white scale-110 shadow-lg' : 'bg-panel-light hover:bg-white-08 text-text-dim'"
          >
            {{ e }}
          </button>
        </div>
      </div>

      <!-- Valor Fixo Sugerido -->
      <div class="mb-4">
        <label class="block text-xs font-black uppercase tracking-wider text-text-muted mb-2">Valor Sugerido Padrão (Opcional)</label>
        <input 
          v-model.number="fixedValue" 
          type="number" 
          step="0.01" 
          class="w-full bg-panel-light border border-white-05 p-3 rounded-xl text-white outline-none focus:border-primary font-bold" 
          placeholder="Deixe em branco ou 0 se for variável (Luz/Água)" 
        />
      </div>

      <!-- Divisão Padrão -->
      <div class="mb-6">
        <label class="block text-xs font-black uppercase tracking-wider text-text-muted mb-2">Quem divide por padrão?</label>
        <div class="flex gap-2 flex-wrap">
          <button 
            v-for="m in membros" 
            :key="m.id"
            @click="toggleSplit(m.id)"
            class="px-4 py-2.5 rounded-xl border font-bold text-xs transition-all duration-200"
            :class="defaultSplit.includes(m.id) ? 'bg-primary border-primary text-white font-black' : 'bg-panel-light border-white-05 text-text-dim'"
          >
            {{ m.nome }}
          </button>
        </div>
      </div>

      <div class="flex justify-between items-center flex-wrap gap-3">
        <button 
          v-if="bill?.id" 
          @click="$emit('delete', bill.id)" 
          class="px-4 py-3 text-xs font-black bg-rose-900/30 hover:bg-rose-900/50 text-rose-300 border border-rose-800 rounded-xl transition-all"
        >
          🗑️ Excluir Conta
        </button>
        <div class="flex gap-2 ml-auto">
          <button @click="$emit('cancel')" class="px-5 py-3 text-xs font-black bg-white-06 hover:bg-white-12 text-white border border-white-08 rounded-xl transition-all">
            Cancelar
          </button>
          <button 
            @click="salvar" 
            class="px-5 py-3 text-xs font-black bg-accent-emerald hover:bg-emerald-600 text-white rounded-xl transition-all" 
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
import { ContaFixa } from '../../core/domain/ContaFixa'

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
