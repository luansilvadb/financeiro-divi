<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { useCartoesEFaturas } from '../../../viewmodels/useCartoesEFaturas'
import { useMembros } from '../../../viewmodels/useMembros'
import Card from '../ui/Card.vue'
import Button from '../ui/Button.vue'
import { Trash2, CreditCard, Calendar, User, ChevronDown, Check } from 'lucide-vue-next'
import { useCasasMultitenant } from '../../../viewmodels/useCasasMultitenant'
import { useToast } from '../../../composables/useToast'

const { activeTenantId } = useCasasMultitenant()
const { ativos } = useMembros()
const { cartoes, adicionarCartao, excluirCartao } = useCartoesEFaturas()
const toast = useToast()

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
  try {
    await adicionarCartao(nome.value, diaFechamento.value, responsavelId.value)
    nome.value = ''
    responsavelId.value = ''
  } catch (error: any) {
    toast.show(error.message || 'Erro ao cadastrar cartão', 'error')
  }
}

const handleExcluir = async (id: string) => {
  try {
    await excluirCartao(id)
  } catch (error: any) {
    toast.show(error.message || 'Erro ao excluir cartão', 'error')
  }
}
</script>

<template>
  <div class="space-y-10 w-full overflow-x-hidden">
    <!-- Adicionar Novo -->
    <Card class="p-8 shadow-subtle bg-card rounded-2xl space-y-6">
      <div class="space-y-4">
        <div class="space-y-2">
          <label class="block text-[10px] font-bold uppercase text-graphite tracking-widest ml-1">Nome do Cartão</label>
          <input 
            v-model="nome" 
            type="text" 
            placeholder="Ex: Nubank, C6, etc." 
            class="w-full px-4 py-3.5 rounded-xl border border-stone bg-canvas outline-none font-bold text-charcoal focus:border-ember transition-all text-sm" 
          />
        </div>

        <div class="space-y-4">
          <div class="space-y-2">
            <label class="block text-[10px] font-bold uppercase text-graphite tracking-widest ml-1">Dia de Fechamento</label>
            <div class="relative" tabindex="0" @blur="isDiaDropdownOpen = false">
              <Calendar class="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-graphite pointer-events-none z-10 opacity-60" />
              <div 
                @click="toggleDiaDropdown"
                class="w-full pl-12 pr-10 py-3.5 rounded-xl border border-stone bg-canvas outline-none font-bold text-charcoal focus:border-ember transition-all text-sm cursor-pointer select-none"
                :class="isDiaDropdownOpen ? 'border-ember ring-4 ring-ember/10' : 'shadow-subtle'"
              >
                <span class="block truncate">{{ diaFechamento ? 'Dia ' + diaFechamento : 'Selecione o dia...' }}</span>
              </div>
              <ChevronDown 
                class="absolute right-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-graphite pointer-events-none transition-transform duration-300" 
                :class="isDiaDropdownOpen ? 'rotate-180' : ''"
              />
              
              <!-- Dropdown Dia -->
              <div 
                v-if="isDiaDropdownOpen" 
                ref="diaDropdownRef"
                class="absolute left-0 w-full mt-2 max-h-48 overflow-y-auto bg-card border border-stone rounded-xl shadow-xl z-50 py-2 custom-scrollbar animate-in fade-in zoom-in-95 duration-200"
              >
                <div 
                  v-for="d in 31" 
                  :key="d" 
                  @mousedown.prevent="diaFechamento = d; isDiaDropdownOpen = false" 
                  class="px-5 py-3 text-sm font-bold hover:bg-stone cursor-pointer transition-colors flex items-center justify-between"
                  :class="diaFechamento === d ? 'text-ember bg-ember/5 is-selected' : 'text-charcoal'"
                >
                  Dia {{ d }}
                  <Check v-if="diaFechamento === d" class="w-4 h-4 text-ember" />
                </div>
              </div>
            </div>
          </div>
          <div class="space-y-2">
            <label class="block text-[10px] font-bold uppercase text-graphite tracking-widest ml-1">
              Responsável Principal
            </label>
            <div class="relative" tabindex="0" @blur="isResponsavelDropdownOpen = false">
              <User class="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-graphite pointer-events-none z-10 opacity-60" />
              <div 
                @click="toggleResponsavelDropdown"
                class="w-full pl-12 pr-10 py-3.5 rounded-xl border border-stone bg-canvas outline-none font-bold text-charcoal focus:border-ember transition-all text-sm cursor-pointer select-none"
                :class="isResponsavelDropdownOpen ? 'border-ember ring-4 ring-ember/10' : 'shadow-subtle'"
              >
                <span class="block truncate">{{ responsavelId ? ativos.find(m => m.id === responsavelId)?.nome : 'Escolha o dono do cartão...' }}</span>
              </div>
              <ChevronDown 
                class="absolute right-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-graphite pointer-events-none transition-transform duration-300"
                :class="isResponsavelDropdownOpen ? 'rotate-180' : ''"
              />
              
              <!-- Dropdown Responsável -->
              <div 
                v-if="isResponsavelDropdownOpen" 
                ref="responsavelDropdownRef"
                class="absolute left-0 w-full mt-2 max-h-48 overflow-y-auto bg-card border border-stone rounded-xl shadow-xl z-50 py-2 custom-scrollbar animate-in fade-in zoom-in-95 duration-200"
              >
                <div 
                  v-for="m in ativos" 
                  :key="m.id" 
                  @mousedown.prevent="responsavelId = m.id; isResponsavelDropdownOpen = false" 
                  class="px-5 py-3 text-sm font-bold hover:bg-stone cursor-pointer transition-colors flex items-center justify-between truncate"
                  :class="responsavelId === m.id ? 'text-ember bg-ember/5 is-selected' : 'text-charcoal'"
                >
                  {{ m.nome }}
                  <Check v-if="responsavelId === m.id" class="w-4 h-4 text-ember" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <Button 
          @click="adicionarCard" 
          class="w-full h-14 font-bold uppercase tracking-widest text-xs"
          variant="primary"
          :disabled="!nome || !responsavelId || !activeTenantId"
        >
          Cadastrar Cartão
        </Button>
        <div v-if="!activeTenantId" class="p-4 bg-coral/5 border border-coral/10 rounded-xl mt-4 animate-in fade-in duration-500">
          <p class="text-[10px] text-coral font-bold text-center uppercase tracking-widest">
            Crie ou selecione uma casa no menu superior antes de cadastrar cartões!
          </p>
        </div>
      </div>
    </Card>

    <!-- Lista -->
    <div class="space-y-4">
      <div class="flex items-center gap-3 mb-4 ml-1">
        <CreditCard class="w-5 h-5 text-ember" />
        <h4 class="text-xs font-bold uppercase tracking-[0.2em] text-graphite">Cartões da Casa</h4>
      </div>

      <div class="grid gap-3">
        <div 
          v-for="c in cartoes" 
          :key="c.id" 
          class="p-5 flex justify-between items-center bg-card border border-stone shadow-subtle hover:border-ember/30 transition-all duration-300 rounded-2xl group"
        >
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-canvas shadow-subtle flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
              <CreditCard class="w-6 h-6 text-ember" />
            </div>
            <div>
              <span class="font-bold text-charcoal text-base block tracking-tight">{{ c.nome }}</span>
              <p class="text-[10px] text-graphite font-bold uppercase tracking-widest mt-1 opacity-70">
                Dia {{ c.diaFechamento }} • {{ ativos.find(m => m.id === c.responsavelPadraoId)?.nome || 'N/A' }}
              </p>
            </div>
          </div>
          
          <button 
            @click="handleExcluir(c.id)" 
            class="bg-coral/5 text-coral hover:bg-coral hover:text-white border-none rounded-full h-11 w-11 flex items-center justify-center transition-all duration-300 active:scale-90 cursor-pointer"
            aria-label="Excluir cartão"
          >
            <Trash2 class="w-5 h-5" />
          </button>
        </div>
        
        <div v-if="cartoes.length === 0" class="text-center py-12 border border-dashed border-stone rounded-2xl bg-canvas/30">
          <p class="text-sm text-graphite font-semibold italic opacity-60">Nenhum cartão cadastrado ainda.</p>
        </div>
      </div>
    </div>
  </div>
</template>
