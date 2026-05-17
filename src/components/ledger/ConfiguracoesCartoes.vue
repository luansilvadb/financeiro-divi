<script setup lang="ts">
import { ref } from 'vue'
import { Cartao } from '../../modules/ledger/core/domain/Cartao'
import { useCartoesEFaturas } from '../../modules/ledger/composables/useCartoesEFaturas'
import { useMembros } from '../../modules/ledger/composables/useMembros'
import Card from '../ui/Card.vue'
import Button from '../ui/Button.vue'
import { Plus, Trash2, CreditCard, Calendar, User } from 'lucide-vue-next'

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
  <div class="space-y-10">
    <!-- Adicionar Novo -->
    <Card class="p-8 shadow-subtle bg-card rounded-cards space-y-6">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-full bg-ember/5 text-ember flex items-center justify-center">
          <Plus class="w-4 h-4" />
        </div>
        <h4 class="text-[10px] font-bold uppercase tracking-widest text-ash">Novo Cartão</h4>
      </div>

      <div class="space-y-4">
        <div class="space-y-2">
          <label class="block text-[10px] font-bold uppercase text-ash tracking-widest ml-1">Nome do Cartão</label>
          <input 
            v-model="nome" 
            type="text" 
            placeholder="Ex: Nubank, C6, etc." 
            class="w-full px-4 py-3 rounded-xl border border-stone bg-[#fbfaf9] outline-none font-bold text-charcoal focus:border-ember transition-all text-sm" 
          />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <label class="block text-[10px] font-bold uppercase text-ash tracking-widest ml-1">Dia Fechamento</label>
            <div class="relative">
              <Calendar class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ash" />
              <input 
                v-model.number="diaFechamento" 
                type="number" 
                min="1" 
                max="28" 
                class="w-full pl-11 pr-4 py-3 rounded-xl border border-stone bg-[#fbfaf9] outline-none font-bold text-charcoal focus:border-ember transition-all text-sm" 
              />
            </div>
          </div>
          <div class="space-y-2">
            <label class="block text-[10px] font-bold uppercase text-ash tracking-widest ml-1">Responsável</label>
            <div class="relative">
              <User class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ash" />
              <select 
                v-model="responsavelId" 
                class="w-full pl-11 pr-4 py-3 rounded-xl border border-stone bg-[#fbfaf9] outline-none font-bold text-charcoal focus:border-ember appearance-none transition-all text-sm"
              >
                <option value="" disabled>Escolha...</option>
                <option v-for="m in ativos" :key="m.id" :value="m.id">{{ m.nome }}</option>
              </select>
            </div>
          </div>
        </div>

        <Button 
          @click="adicionarCard" 
          class="w-full h-12"
          variant="primary"
          :disabled="!nome || !responsavelId"
        >
          Cadastrar Cartão
        </Button>
      </div>
    </Card>

    <!-- Lista -->
    <div class="space-y-4">
      <div class="flex items-center gap-2 mb-2">
        <CreditCard class="w-4 h-4 text-ash" />
        <h4 class="text-[10px] font-bold uppercase tracking-widest text-ash">Cartões Ativos</h4>
      </div>

      <div class="grid gap-3">
        <Card 
          v-for="c in cartoes" 
          :key="c.id" 
          class="p-4 flex justify-between items-center bg-card border border-stone-surface shadow-subtle hover:border-ember/30 transition-all rounded-cards"
        >
          <div class="flex items-center gap-4">
            <div class="w-10 h-10 rounded-xl bg-stone flex items-center justify-center">
              <CreditCard class="w-5 h-5 text-charcoal" />
            </div>
            <div>
              <span class="font-bold text-charcoal block">{{ c.nome }}</span>
              <p class="text-[10px] text-ash font-medium uppercase tracking-wider mt-0.5">
                Dia {{ c.diaFechamento }} • {{ ativos.find(m => m.id === c.responsavelPadraoId)?.nome || 'N/A' }}
              </p>
            </div>
          </div>
          
          <Button 
            variant="secondary"
            size="icon"
            @click="excluirCartaoManual(c.id)" 
            class="text-ash hover:text-coral-red hover:bg-[#fff0f0] border border-transparent rounded-full"
          >
            <Trash2 class="w-4 h-4" />
          </Button>
        </Card>
        
        <div v-if="cartoes.length === 0" class="text-center py-10 border border-dashed border-stone rounded-xl">
          <p class="text-sm text-ash italic">Nenhum cartão cadastrado.</p>
        </div>
      </div>
    </div>
  </div>
</template>
