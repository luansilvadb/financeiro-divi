<script setup lang="ts">
import { ref } from 'vue'
import { Cartao } from '../../modules/ledger/core/domain/Cartao'
import { useCartoesEFaturas } from '../../modules/ledger/composables/useCartoesEFaturas'
import { useMembros } from '../../modules/ledger/composables/useMembros'

const { ativos } = useMembros()
const { cartoes, salvarCartaoManual, excluirCartaoManual } = useCartoesEFaturas()

const nome = ref('')
const diaFechamento = ref<number>(10)
const responsavelId = ref('')

const adicionarCard = async () => {
  if (!nome.value || !responsavelId.value) return
  const novo = new Cartao({
    id: crypto.randomUUID(),
    nome: nome.value,
    diaFechamento: diaFechamento.value,
    responsavelPadraoId: responsavelId.value
  })
  await salvarCartaoManual(novo)
  nome.value = ''
  responsavelId.value = ''
}
</script>

<template>
  <div class="space-y-6">
    <div class="glass-card p-5 rounded-3xl border border-divi-border shadow-lg space-y-4">
      <h4 class="text-xs font-black uppercase tracking-wider text-divi-t2 mb-1">➕ Novo Cartão</h4>
      <div class="space-y-3">
        <input 
          v-model="nome" 
          type="text" 
          placeholder="Nome do Cartão (ex: Nubank)" 
          class="w-full px-4 py-3 rounded-2xl glass-input outline-none font-bold text-divi-t1 text-sm" 
        />
        <div class="grid grid-cols-2 gap-3">
          <div class="space-y-1">
            <label class="text-[10px] uppercase font-bold text-divi-t2 block">Dia Fechamento (1 a 28)</label>
            <input 
              v-model.number="diaFechamento" 
              type="number" 
              min="1" 
              max="28" 
              class="w-full px-4 py-3 rounded-2xl glass-input outline-none font-bold text-divi-t1 text-sm" 
            />
          </div>
          <div class="space-y-1">
            <label class="text-[10px] uppercase font-bold text-divi-t2 block">Dono/Responsável</label>
            <select v-model="responsavelId" class="w-full px-4 py-3 rounded-2xl glass-input outline-none font-bold text-divi-t1 text-sm bg-divi-bg appearance-none border border-divi-border">
              <option value="" disabled>Escolha...</option>
              <option v-for="m in ativos" :key="m.id" :value="m.id">{{ m.nome }}</option>
            </select>
          </div>
        </div>
        <button 
          @click="adicionarCard" 
          class="w-full bg-divi-primary hover:bg-indigo-500 border border-indigo-400/25 text-white font-bold py-3.5 rounded-2xl text-xs shadow-[0_0_16px_var(--primary-glow)] transition-all"
        >
          Cadastrar Cartão
        </button>
      </div>
    </div>

    <div class="space-y-3">
      <h4 class="text-xs font-black uppercase tracking-wider text-divi-t2">💳 Cartões Cadastrados</h4>
      <div 
        v-for="c in cartoes" 
        :key="c.id" 
        class="flex justify-between items-center bg-divi-s1/50 p-4 rounded-2xl border border-divi-border shadow-sm hover:bg-divi-s1/70 transition-colors duration-150"
      >
        <div>
          <span class="font-bold text-divi-t1 block">{{ c.nome }}</span>
          <span class="text-xs text-divi-t2">
            Fechamento dia: {{ c.diaFechamento }} • Responsável: {{ ativos.find(m => m.id === c.responsavelPadraoId)?.nome || 'Outro' }}
          </span>
        </div>
        <button 
          @click="excluirCartaoManual(c.id)" 
          class="text-divi-rose bg-divi-rose-dim/12 hover:bg-divi-rose-dim/20 border border-divi-rose/20 text-xs font-bold px-3 py-2 rounded-xl transition-all shadow-sm"
        >
          Excluir
        </button>
      </div>
    </div>
  </div>
</template>
