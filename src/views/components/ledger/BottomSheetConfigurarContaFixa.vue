<script setup lang="ts">
import { ref, watch } from 'vue'
import type { ContaFixa } from '../../../models/entities/ContaFixa'
import BottomSheet from '../ui/BottomSheet.vue'

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
    fixedValue.value = newBill.fixedValueCentavos !== null && newBill.fixedValueCentavos !== undefined ? newBill.fixedValueCentavos / 100 : null
    
    const validSplitIds = newBill.defaultSplit.filter(id => 
      props.membros.some(m => m.id === id)
    )
    if (validSplitIds.length > 0) {
      defaultSplit.value = [...validSplitIds]
    } else {
      defaultSplit.value = props.membros.map(m => m.id)
    }
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
    fixedValueCentavos: fixedValue.value && fixedValue.value > 0 ? Math.round(fixedValue.value * 100) : null,
    defaultSplit: defaultSplit.value
  })
}
</script>

<template>
  <BottomSheet :model-value="visible" @update:model-value="val => { if (!val) $emit('cancel') }" width-class="md:w-[420px]">
    <div class="p-5 sm:p-6 space-y-4 overflow-y-auto custom-scrollbar flex-grow">
        <h3 class="text-xl font-display text-charcoal flex items-center gap-2 mb-2">
          Configurar Conta Fixa
        </h3>

        <!-- Nome -->
        <div class="space-y-1">
          <label class="block text-[10px] font-bold uppercase tracking-widest text-ash">Nome do Talão</label>
          <input 
            v-model="name" 
            type="text" 
            class="w-full px-4 py-2.5 rounded-xl border border-stone bg-canvas outline-none font-bold text-charcoal focus:border-ember transition-all text-sm" 
          />
        </div>

        <!-- Emoji Selector -->
        <div class="space-y-1.5">
          <label class="block text-[10px] font-bold uppercase tracking-widest text-ash">Emoji / Ícone</label>
          <div class="flex gap-1.5 flex-wrap justify-start">
            <button 
              v-for="e in ['🔑','💡','💧','🌐','🐶','🔥','🛒','🍔','🚗','💊']" 
              :key="e"
              @click="icon = e"
              class="text-xl w-10 h-10 flex items-center justify-center rounded-xl border transition-all duration-200"
              :class="icon === e ? 'bg-ember/10 border-ember scale-105 shadow-sm' : 'bg-canvas border-stone hover:border-ember/30 hover:bg-white'"
            >
              {{ e }}
            </button>
          </div>
        </div>

        <!-- Valor Fixo Sugerido -->
        <div class="space-y-1">
          <label class="block text-[10px] font-bold uppercase tracking-widest text-ash">Valor Sugerido Padrão (Opcional)</label>
          <input 
            v-model.number="fixedValue" 
            type="number" 
            step="0.01" 
            class="w-full px-4 py-2.5 rounded-xl border border-stone bg-canvas outline-none font-bold text-charcoal focus:border-ember transition-all text-sm" 
            placeholder="Ex: 150,00" 
          />
        </div>

        <!-- Divisão Padrão -->
        <div class="space-y-1.5">
          <label class="block text-[10px] font-bold uppercase tracking-widest text-ash">Quem divide por padrão?</label>
          <div class="flex gap-2 flex-wrap">
            <button 
              v-for="m in membros" 
              :key="m.id"
              @click="toggleSplit(m.id)"
              class="px-3.5 py-2 rounded-xl border font-bold text-xs transition-all duration-200"
              :class="defaultSplit.includes(m.id) ? 'bg-midnight text-white font-bold border border-stone shadow-sm' : 'bg-stone hover:bg-stone border border-stone text-charcoal'"
            >
              {{ m.nome }}
            </button>
          </div>
        </div>

        <div class="flex justify-between items-center flex-wrap gap-3 pt-3.5 border-t border-stone">
          <button 
            v-if="bill?.id" 
            @click="$emit('delete', bill.id)" 
            class="px-4 py-2.5 text-xs font-bold bg-coral/5 hover:bg-coral/10 text-coral border border-transparent rounded-xl transition-all"
          >
            Excluir
          </button>
          <div class="flex gap-2 ml-auto">
            <button @click="$emit('cancel')" class="px-4.5 py-2.5 text-xs font-bold bg-stone hover:bg-stone text-graphite border border-stone rounded-xl transition-all">
              Cancelar
            </button>
            <button 
              @click="salvar" 
              class="px-4.5 py-2.5 text-xs font-bold bg-midnight border border-stone hover:bg-charcoal text-white rounded-xl shadow-sm transition-all" 
              :disabled="!name"
            >
              Salvar
            </button>
          </div>
        </div>
    </div>
  </BottomSheet>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: var(--color-stone);
  border-radius: 9999px;
}
</style>
