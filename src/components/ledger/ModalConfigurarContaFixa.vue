<template>
  <div v-if="visible" class="fixed inset-0 bg-midnight/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
    <div class="bg-card w-full max-w-[420px] rounded-cards p-8 relative text-charcoal border border-stone-surface space-y-6 shadow-lg">
      <h3 class="text-xl font-display text-charcoal flex items-center gap-2 mb-2">
        ⚙️ Configurar Conta Fixa
      </h3>

      <!-- Nome -->
      <div class="space-y-2">
        <label class="block text-[10px] font-bold uppercase tracking-widest text-ash">Nome do Talão</label>
        <input 
          v-model="name" 
          type="text" 
          class="w-full px-4 py-3 rounded-xl border border-stone bg-[#fbfaf9] outline-none font-bold text-charcoal focus:border-ember transition-all text-sm" 
        />
      </div>

      <!-- Emoji Selector -->
      <div class="space-y-2">
        <label class="block text-[10px] font-bold uppercase tracking-widest text-ash">Emoji / Ícone</label>
        <div class="flex gap-2 flex-wrap justify-start">
          <button 
            v-for="e in ['🔑','💡','💧','🌐','🐶','🔥','🛒','🍔','🚗','💊']" 
            :key="e"
            @click="icon = e"
            class="text-2xl p-2.5 rounded-xl border border-stone-surface transition-all duration-150"
            :class="icon === e ? 'bg-ember text-white scale-110 shadow-sm border border-stone-surface' : 'bg-stone hover:bg-[#eae7e2] text-charcoal'"
          >
            {{ e }}
          </button>
        </div>
      </div>

      <!-- Valor Fixo Sugerido -->
      <div class="space-y-2">
        <label class="block text-[10px] font-bold uppercase tracking-widest text-ash">Valor Sugerido Padrão (Opcional)</label>
        <input 
          v-model.number="fixedValue" 
          type="number" 
          step="0.01" 
          class="w-full px-4 py-3 rounded-xl border border-stone bg-[#fbfaf9] outline-none font-bold text-charcoal focus:border-ember transition-all text-sm" 
          placeholder="Ex: 150,00" 
        />
      </div>

      <!-- Divisão Padrão -->
      <div class="space-y-2">
        <label class="block text-[10px] font-bold uppercase tracking-widest text-ash">Quem divide por padrão?</label>
        <div class="flex gap-2 flex-wrap">
          <button 
            v-for="m in membros" 
            :key="m.id"
            @click="toggleSplit(m.id)"
            class="px-4 py-2.5 rounded-xl border border-stone-surface font-bold text-xs transition-all duration-200"
            :class="defaultSplit.includes(m.id) ? 'bg-ember text-white font-bold border border-stone-surface shadow-sm' : 'bg-stone text-charcoal hover:bg-[#eae7e2]'"
          >
            {{ m.nome }}
          </button>
        </div>
      </div>

      <div class="flex justify-between items-center flex-wrap gap-3 pt-2">
        <button 
          v-if="bill?.id" 
          @click="$emit('delete', bill.id)" 
          class="px-4 py-3 text-xs font-bold bg-[#fff0f0] hover:bg-[#ffe5e5] text-coral-red border border-transparent rounded-xl transition-all"
        >
          🗑️ Excluir Conta
        </button>
        <div class="flex gap-2 ml-auto">
          <button @click="$emit('cancel')" class="px-5 py-3 text-xs font-bold bg-[#f2f0ed] hover:bg-[#eae7e2] text-graphite border border-stone-surface rounded-xl transition-all">
            Cancelar
          </button>
          <button 
            @click="salvar" 
            class="px-5 py-3 text-xs font-bold bg-ember border border-stone-surface hover:bg-[#ff551a] text-white rounded-xl shadow-sm transition-all" 
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
