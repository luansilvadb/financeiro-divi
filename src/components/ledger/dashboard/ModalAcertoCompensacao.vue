<script setup lang="ts">
import { ref, watch } from 'vue'
import Card from '../../ui/Card.vue'
import Button from '../../ui/Button.vue'
import SectionLabel from '../../ui/SectionLabel.vue'
import { Wallet, Banknote, RefreshCcw } from 'lucide-vue-next'

interface Props {
  visible: boolean
  fromId?: string
  toId?: string
  fromName?: string
  toName?: string
  suggestedValue: number
}

const props = defineProps<Props>()
const emit = defineEmits(['confirm', 'cancel'])

const valorReal = ref(0)
const method = ref<'pix' | 'cash' | 'mutual'>('pix')
const descricao = ref('')

watch(() => props.visible, (isVisible) => {
  if (isVisible) {
    valorReal.value = props.suggestedValue
    method.value = 'pix'
    descricao.value = `Acerto: ${props.fromName} ➜ ${props.toName}`
  }
}, { immediate: true })

const handleConfirmar = () => {
  if (valorReal.value <= 0 || !props.fromId || !props.toId) return
  emit('confirm', {
    from: props.fromId,
    to: props.toId,
    valor: valorReal.value,
    method: method.value,
    descricao: descricao.value
  })
}
</script>

<template>
  <div v-if="visible" class="fixed inset-0 bg-midnight/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-6">
    <Card class="w-full max-w-md p-0 overflow-hidden bg-card shadow-lg border border-stone-surface rounded-cards">
      <div class="p-8 space-y-6">
        <div class="space-y-2 text-center">
          <SectionLabel class="mx-auto">Liquidação</SectionLabel>
          <h3 class="text-3xl font-display text-charcoal">Registrar <span class="text-ember">Acerto</span></h3>
          <p class="text-xs text-ash leading-relaxed">
            Confirmar a transferência entre moradores para equilibrar os saldos da casa.
          </p>
        </div>

        <div class="space-y-5">
          <!-- Valor Input -->
          <div class="space-y-2">
            <label class="block text-[10px] font-bold uppercase text-ash tracking-widest ml-1">Valor do Repasse</label>
            <div class="relative">
              <span class="absolute left-4 top-1/2 -translate-y-1/2 text-ash text-sm font-bold">R$</span>
              <input 
                v-model.number="valorReal"
                type="number"
                step="0.01"
                class="w-full pl-10 pr-4 py-3 rounded-xl border border-stone bg-[#fbfaf9] outline-none font-bold text-lg text-charcoal focus:border-ember transition-all"
                placeholder="0,00"
              />
            </div>
          </div>

          <!-- Descrição -->
          <div class="space-y-2">
            <label class="block text-[10px] font-bold uppercase text-ash tracking-widest ml-1">Descrição</label>
            <input 
              v-model="descricao"
              type="text"
              class="w-full px-4 py-3 rounded-xl border border-stone bg-[#fbfaf9] outline-none font-bold text-sm text-charcoal focus:border-ember transition-all"
            />
          </div>

          <!-- Método de Acerto -->
          <div class="space-y-2">
            <label class="block text-[10px] font-bold uppercase text-ash tracking-widest ml-1">Método de Baixa</label>
            <div class="grid grid-cols-3 gap-2">
              <button 
                v-for="m in [{id:'pix', n:'Pix', icon: Wallet}, {id:'cash', n:'Dinheiro', icon: Banknote}, {id:'mutual', n:'Ajuste', icon: RefreshCcw}]"
                :key="m.id"
                type="button"
                @click="method = m.id as any"
                class="flex flex-col items-center gap-2 py-3 rounded-xl border border-stone-surface transition-all duration-200"
                :class="[
                  method === m.id 
                    ? 'bg-ember border-stone-surface text-white font-bold shadow-sm' 
                    : 'bg-stone text-charcoal hover:bg-[#eae7e2]'
                ]"
              >
                <component :is="m.icon" class="w-4 h-4" />
                <span class="text-[10px] font-bold uppercase tracking-wider">{{ m.n }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Rodapé Ações -->
        <div class="grid grid-cols-2 gap-3 pt-4 border-t border-stone-surface">
          <Button variant="secondary" @click="emit('cancel')">Cancelar</Button>
          <Button variant="primary" @click="handleConfirmar" :disabled="valorReal <= 0">Confirmar</Button>
        </div>
      </div>
    </Card>
  </div>
</template>
