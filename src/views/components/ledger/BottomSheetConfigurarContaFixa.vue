<script setup lang="ts">
import { ref, watch } from 'vue'
import type { ContaFixa } from '../../../models/entities/ContaFixa'
import BottomSheet from '../ui/BottomSheet.vue'
import Button from '../ui/Button.vue'
import MembroAvatar from '../ui/MembroAvatar.vue'
import { Check } from 'lucide-vue-next'

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
    
    const validSplitIds = (newBill.defaultSplit || []).filter(id => 
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
  <BottomSheet 
    :model-value="visible" 
    @update:model-value="val => { if (!val) $emit('cancel') }" 
    subtitle="Gerencie modelos de gastos recorrentes."
    max-height="90dvh"
  >
    <template #title>
      <h3 class="text-3xl font-display text-charcoal leading-tight">Configurar <span class="text-ember">Conta Fixa</span></h3>
    </template>

    <div class="space-y-6 pt-2">
      <!-- Nome -->
      <div class="space-y-2">
        <label class="block text-[10px] font-bold uppercase tracking-widest text-graphite ml-1">Nome do Talão / Categoria</label>
        <input 
          v-model="name" 
          type="text" 
          class="w-full px-4 py-3.5 rounded-xl border border-stone bg-canvas outline-none font-bold text-charcoal focus:border-ember transition-all text-sm" 
          placeholder="Ex: Aluguel, Internet..."
        />
      </div>

      <!-- Emoji Selector -->
      <div class="space-y-2">
        <label class="block text-[10px] font-bold uppercase tracking-widest text-graphite ml-1">Emoji Representativo</label>
        <div class="flex gap-2 flex-wrap justify-start">
          <button 
            v-for="e in ['🔑','💡','💧','🌐','🐶','🔥','🛒','🍔','🚗','💊']" 
            :key="e"
            @click="icon = e"
            class="text-xl w-11 h-11 flex items-center justify-center rounded-xl border transition-all duration-300 border-none cursor-pointer"
            :class="icon === e ? 'bg-ember/10 border-ember scale-110 shadow-subtle' : 'bg-canvas border-stone hover:bg-stone/50'"
          >
            {{ e }}
          </button>
        </div>
      </div>

      <!-- Valor Fixo Sugerido -->
      <div class="space-y-2">
        <label class="block text-[10px] font-bold uppercase tracking-widest text-graphite ml-1">Valor Sugerido (Opcional)</label>
        <div class="relative">
          <span class="absolute left-4 top-1/2 -translate-y-1/2 text-graphite text-sm font-bold">R$</span>
          <input 
            v-model.number="fixedValue" 
            type="number" 
            step="0.01" 
            class="w-full pl-10 pr-4 py-3.5 rounded-xl border border-stone bg-canvas outline-none font-bold text-charcoal focus:border-ember transition-all text-sm" 
            placeholder="0,00" 
          />
        </div>
      </div>

      <!-- Divisão Padrão -->
      <div class="space-y-2">
        <label class="block text-[10px] font-bold uppercase tracking-widest text-graphite ml-1">Quem divide por padrão?</label>
        <div class="grid grid-cols-3 gap-2">
          <button 
            v-for="m in membros" 
            :key="m.id"
            @click="toggleSplit(m.id)"
            class="group relative py-3 rounded-xl font-bold text-[11px] uppercase tracking-wider transition-all duration-300 border-none cursor-pointer flex flex-col items-center gap-2"
            :class="defaultSplit.includes(m.id) ? 'bg-white shadow-subtle scale-[1.02] text-charcoal' : 'bg-stone/50 text-graphite opacity-60 hover:opacity-100'"
          >
            <MembroAvatar :nome="m.nome" size="sm" :variant="defaultSplit.includes(m.id) ? 'meadow' : 'sky'" />
            <span class="truncate max-w-full px-1">{{ m.nome }}</span>
            <div v-if="defaultSplit.includes(m.id)" class="absolute top-1.5 right-1.5 animate-in zoom-in-50 duration-300">
              <Check class="w-3.5 h-3.5 text-meadow" />
            </div>
          </button>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex flex-col gap-3">
        <div class="flex gap-3">
          <Button variant="secondary" class="flex-1 font-bold uppercase tracking-widest text-[10px] h-12" @click="$emit('cancel')">Cancelar</Button>
          <Button variant="primary" class="flex-[2] font-bold uppercase tracking-widest text-[10px] h-12" @click="salvar" :disabled="!name">Salvar Configuração</Button>
        </div>
        <button 
          v-if="bill" 
          @click="$emit('delete', bill)" 
          class="w-full py-2 text-[10px] font-bold uppercase tracking-widest text-coral hover:bg-coral/5 rounded-lg transition-all border-none bg-transparent cursor-pointer"
        >
          Excluir Modelo de Conta
        </button>
      </div>
    </template>
  </BottomSheet>
</template>

<style scoped>
</style>
