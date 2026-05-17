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
    <div class="bg-slate-50 p-4 rounded-xl border border-slate-200">
      <h4 class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">➕ Novo Cartão</h4>
      <div class="space-y-3">
        <input 
          v-model="nome" 
          type="text" 
          placeholder="Nome do Cartão (ex: Nubank)" 
          class="w-full p-2.5 border rounded-lg text-sm bg-white" 
        />
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="text-[10px] uppercase font-bold text-slate-400 block mb-1">Dia Fechamento (1 a 28)</label>
            <input 
              v-model.number="diaFechamento" 
              type="number" 
              min="1" 
              max="28" 
              class="w-full p-2.5 border rounded-lg text-sm bg-white" 
            />
          </div>
          <div>
            <label class="text-[10px] uppercase font-bold text-slate-400 block mb-1">Dono/Responsável</label>
            <select v-model="responsavelId" class="w-full p-2.5 border rounded-lg text-sm bg-white">
              <option value="" disabled>Escolha...</option>
              <option v-for="m in ativos" :key="m.id" :value="m.id">{{ m.nome }}</option>
            </select>
          </div>
        </div>
        <button 
          @click="adicionarCard" 
          class="w-full bg-slate-800 text-white font-bold py-2 rounded-lg text-xs hover:bg-slate-700 transition-colors shadow-sm"
        >
          Cadastrar Cartão
        </button>
      </div>
    </div>

    <div class="space-y-3">
      <h4 class="text-xs font-bold uppercase tracking-wider text-slate-500">💳 Cartões Cadastrados</h4>
      <div 
        v-for="c in cartoes" 
        :key="c.id" 
        class="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200 shadow-sm"
      >
        <div>
          <span class="font-bold text-slate-800 block">{{ c.nome }}</span>
          <span class="text-xs text-slate-500">
            Fechamento dia: {{ c.diaFechamento }} • Responsável: {{ ativos.find(m => m.id === c.responsavelPadraoId)?.nome || 'Outro' }}
          </span>
        </div>
        <button 
          @click="excluirCartaoManual(c.id)" 
          class="text-red-500 hover:text-red-700 text-xs font-bold px-2 py-1 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
        >
          Excluir
        </button>
      </div>
    </div>
  </div>
</template>
