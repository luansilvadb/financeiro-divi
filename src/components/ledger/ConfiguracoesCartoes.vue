<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { Cartao } from '../../modules/ledger/core/domain/Cartao'
import { useCartoesEFaturas } from '../../modules/ledger/composables/useCartoesEFaturas'
import { useMembros } from '../../modules/ledger/composables/useMembros'
import Card from '../ui/Card.vue'
import Button from '../ui/Button.vue'
import { Trash2, CreditCard, Calendar, User, ChevronDown } from 'lucide-vue-next'

const { ativos } = useMembros()
const { cartoes, salvarCartaoManual, excluirCartaoManual } = useCartoesEFaturas()

const nome = ref('')
const diaFechamento = ref<number>(10)
const responsavelId = ref('')

const isDiaDropdownOpen = ref(false)
const isResponsavelDropdownOpen = ref(false)

const diaDropdownRef = ref<HTMLElement | null>(null)
const toggleDiaDropdown = async () => {
  isDiaDropdownOpen.value = !isDiaDropdownOpen.value
  if (isDiaDropdownOpen.value) {
    await nextTick()
    if (diaDropdownRef.value) {
      const selected = diaDropdownRef.value.querySelector('.is-selected') as HTMLElement
      if (selected) {
        selected.scrollIntoView({ block: 'center' })
      }
    }
  }
}

const responsavelDropdownRef = ref<HTMLElement | null>(null)
const toggleResponsavelDropdown = async () => {
  isResponsavelDropdownOpen.value = !isResponsavelDropdownOpen.value
  if (isResponsavelDropdownOpen.value) {
    await nextTick()
    if (responsavelDropdownRef.value) {
      const selected = responsavelDropdownRef.value.querySelector('.is-selected') as HTMLElement
      if (selected) {
        selected.scrollIntoView({ block: 'center' })
      }
    }
  }
}

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
    <Card class="p-8 shadow-subtle bg-card rounded-card space-y-6">
      <div class="space-y-4">
        <div class="space-y-2">
          <label class="block text-[10px] font-bold uppercase text-ash tracking-widest ml-1">Nome do Cartão</label>
          <input 
            v-model="nome" 
            type="text" 
            placeholder="Ex: Nubank, C6, etc." 
            class="w-full px-4 py-3 rounded-xl border border-stone bg-canvas outline-none font-bold text-charcoal focus:border-ember transition-all text-sm" 
          />
        </div>

        <div class="space-y-4">
          <div class="space-y-2">
            <label class="block text-[10px] font-bold uppercase text-ash tracking-widest ml-1">Dia Fechamento</label>
            <div class="relative" tabindex="0" @blur="isDiaDropdownOpen = false">
              <Calendar class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ash pointer-events-none z-10" />
              <div 
                @click="toggleDiaDropdown"
                class="w-full pl-11 pr-10 py-3 rounded-xl border border-stone bg-canvas outline-none font-bold text-charcoal focus:border-ember transition-all text-sm cursor-pointer select-none"
                :class="isDiaDropdownOpen ? 'border-ember ring-2 ring-ember/20' : ''"
              >
                <span class="block truncate">{{ diaFechamento ? 'Dia ' + diaFechamento : 'Selecione...' }}</span>
              </div>
              <ChevronDown 
                class="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ash pointer-events-none transition-transform duration-200" 
                :class="isDiaDropdownOpen ? 'rotate-180' : ''"
              />
              
              <!-- Dropdown Dia -->
              <div 
                v-if="isDiaDropdownOpen" 
                ref="diaDropdownRef"
                class="absolute left-0 w-full mt-1.5 max-h-48 overflow-y-auto bg-canvas border border-stone rounded-xl shadow-xl z-50 py-2 custom-scrollbar"
              >
                <div 
                  v-for="d in 28" 
                  :key="d" 
                  @mousedown.prevent="diaFechamento = d; isDiaDropdownOpen = false" 
                  class="px-4 py-3 text-sm font-medium hover:bg-stone cursor-pointer transition-colors"
                  :class="diaFechamento === d ? 'text-ember bg-ember/5 is-selected' : 'text-charcoal'"
                >
                  Dia {{ d }}
                </div>
              </div>
            </div>
          </div>
          <div class="space-y-2">
            <label class="block text-[10px] font-bold uppercase text-ash tracking-widest ml-1">Responsável</label>
            <div class="relative" tabindex="0" @blur="isResponsavelDropdownOpen = false">
              <User class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ash pointer-events-none z-10" />
              <div 
                @click="toggleResponsavelDropdown"
                class="w-full pl-11 pr-10 py-3 rounded-xl border border-stone bg-canvas outline-none font-bold text-charcoal focus:border-ember transition-all text-sm cursor-pointer select-none"
                :class="isResponsavelDropdownOpen ? 'border-ember ring-2 ring-ember/20' : ''"
              >
                <span class="block truncate">{{ responsavelId ? ativos.find(m => m.id === responsavelId)?.nome : 'Escolha...' }}</span>
              </div>
              <ChevronDown 
                class="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ash pointer-events-none transition-transform duration-200"
                :class="isResponsavelDropdownOpen ? 'rotate-180' : ''"
              />
              
              <!-- Dropdown Responsável -->
              <div 
                v-if="isResponsavelDropdownOpen" 
                ref="responsavelDropdownRef"
                class="absolute left-0 w-full mt-1.5 max-h-48 overflow-y-auto bg-canvas border border-stone rounded-xl shadow-xl z-50 py-2 custom-scrollbar"
              >
                <div 
                  v-for="m in ativos" 
                  :key="m.id" 
                  @mousedown.prevent="responsavelId = m.id; isResponsavelDropdownOpen = false" 
                  class="px-4 py-3 text-sm font-medium hover:bg-stone cursor-pointer transition-colors truncate"
                  :class="responsavelId === m.id ? 'text-ember bg-ember/5 is-selected' : 'text-charcoal'"
                >
                  {{ m.nome }}
                </div>
              </div>
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
          class="p-4 flex justify-between items-center bg-card border border-stone shadow-subtle hover:border-ember/30 transition-all rounded-card"
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
            class="bg-coral/10 text-coral hover:bg-coral/20 border border-transparent rounded-full h-10 w-10 flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95"
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
