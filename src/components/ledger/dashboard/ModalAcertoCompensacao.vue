<script setup lang="ts">
import { ref, watch } from 'vue'

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
  <div v-if="visible" class="fixed inset-0 bg-[#040814]/80 backdrop-blur-md flex items-center justify-center z-[9999] p-4">
    <div class="glass-card w-full max-w-sm rounded-3xl shadow-2xl p-6 border border-divi-border relative text-divi-t1 space-y-4 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
      <h3 class="text-xl font-black text-divi-t1 flex items-center gap-2 mb-1">🤝 Registrar Acerto Pix</h3>
      <p class="text-xs text-divi-t2 leading-relaxed">
        Você está registrando a baixa da transferência PIX entre moradores para equilibrar os saldos da casa.
      </p>

      <!-- Valor Input -->
      <div class="space-y-1.5">
        <label class="block text-[10px] font-black uppercase text-divi-t2 tracking-wider">Valor do Pix (R$)</label>
        <div class="flex items-center gap-2 glass-input rounded-2xl p-3">
          <span class="text-divi-t3 text-sm font-bold">R$</span>
          <input 
            v-model.number="valorReal"
            type="number"
            step="0.01"
            class="w-full bg-transparent font-black text-sm text-divi-t1 outline-none"
            placeholder="0,00"
          />
        </div>
      </div>

      <!-- Descrição -->
      <div class="space-y-1.5">
        <label class="block text-[10px] font-black uppercase text-divi-t2 tracking-wider">Descrição / Lembrete</label>
        <input 
          v-model="descricao"
          type="text"
          class="w-full glass-input rounded-2xl p-3 font-bold text-sm text-divi-t1 outline-none"
        />
      </div>

      <!-- Método de Acerto -->
      <div class="space-y-1.5">
        <label class="block text-[10px] font-black uppercase text-divi-t2 tracking-wider">Método de Baixa</label>
        <div class="flex gap-2">
          <button 
            v-for="m in [{id:'pix', n:'⚡ Pix'}, {id:'cash', n:'💵 Dinheiro'}, {id:'mutual', n:'🤝 Ajuste'}]"
            :key="m.id"
            type="button"
            @click="method = m.id as any"
            :class="['flex-1 py-2 text-center text-xs font-black rounded-xl border transition-all', method === m.id ? 'bg-divi-primary border-divi-primary text-white shadow-lg shadow-indigo-600/20' : 'bg-divi-s2 border-divi-border text-divi-t2']"
          >
            {{ m.n }}
          </button>
        </div>
      </div>

      <!-- Rodapé Ações -->
      <div class="flex justify-end gap-3 pt-3 border-t border-divi-border">
        <button 
          type="button" 
          @click="emit('cancel')"
          class="px-4 py-2.5 text-xs font-black bg-divi-s2 hover:bg-divi-s3 text-divi-t1 border border-divi-border rounded-xl transition-all"
        >
          Cancelar
        </button>
        <button 
          type="button" 
          @click="handleConfirmar"
          :disabled="valorReal <= 0"
          class="px-5 py-2.5 text-xs font-black bg-[#10B981] hover:bg-emerald-600 text-white rounded-xl shadow-[0_0_16px_rgba(16,185,129,0.3)] transition-all disabled:opacity-40"
        >
          Confirmar Baixa
        </button>
      </div>
    </div>
  </div>
</template>
