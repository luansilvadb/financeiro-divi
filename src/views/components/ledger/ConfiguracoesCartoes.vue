<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { useCartoesEFaturas } from '../../../viewmodels/useCartoesEFaturas'
import { useMembros } from '../../../viewmodels/useMembros'
import Button from '../ui/Button.vue'
import BottomSheet from '../ui/BottomSheet.vue'
import { Trash2, CreditCard, Calendar, ChevronDown, Check, Plus } from 'lucide-vue-next'
import { useCasasMultitenant } from '../../../viewmodels/useCasasMultitenant'
import { useToast } from '../../../composables/useToast'

const { activeTenantId } = useCasasMultitenant()
const { currentMembro } = useMembros()
const { cartoes, adicionarCartao, excluirCartao } = useCartoesEFaturas()
const toast = useToast()

const nome = ref('')
const diaFechamento = ref<number>(10)

const formularioAberto = ref(false)

const toggleFormulario = () => {
  formularioAberto.value = !formularioAberto.value
  if (!formularioAberto.value) {
    nome.value = ''
    diaFechamento.value = 10
    isDiaDropdownOpen.value = false
  }
}

const isDiaDropdownOpen = ref(false)

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

const meusCartoes = computed(() => {
  if (!currentMembro.value) return []
  return cartoes.value.filter(c => c.responsavelPadraoId === currentMembro.value?.id)
})

const adicionarCard = async () => {
  const ownerId = currentMembro.value?.id
  if (!nome.value || !ownerId) return
  try {
    await adicionarCartao(nome.value, diaFechamento.value, ownerId)
    nome.value = ''
    diaFechamento.value = 10
    formularioAberto.value = false
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
  <div class="space-y-6 w-full">
    <!-- Card de Adicionar Novo Cartão -->
    <div class="bg-white border border-stone/30 rounded-[32px] shadow-subtle overflow-hidden">
      <div class="px-6 pt-6 pb-2">
        <h3 class="text-heading-sm text-charcoal flex items-center gap-2">
          <CreditCard class="w-5 h-5 text-ember" />
          Meus Cartões
        </h3>
        <p class="text-[11px] text-ash font-medium mt-1 uppercase tracking-wider">Gestão de cartões pessoais</p>
      </div>

      <div class="p-4 space-y-4">
        <div class="flex justify-center pb-2">
          <Button 
            @click="formularioAberto = true"
            variant="secondary"
            class="w-full"
          >
            <Plus class="w-5 h-5 mr-2" />
            Novo Cartão
          </Button>
        </div>

        <!-- Lista de Cartões -->
        <div class="space-y-2">
          <div
            v-for="c in meusCartoes"
            :key="c.id"
            class="p-4 flex justify-between items-center bg-canvas/50 border border-stone/50 rounded-2xl hover:border-ember/40 transition-all duration-500 group"
          >
            <div class="flex items-center gap-4 min-w-0">
              <div class="w-10 h-10 rounded-xl bg-white shadow-subtle flex items-center justify-center shrink-0 border border-stone/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                <CreditCard class="w-5 h-5 text-ember" />
              </div>
              <div class="min-w-0">
                <span class="font-bold text-charcoal text-sm block truncate">{{ c.nome }}</span>
                <p class="text-caption text-[9px] mt-1 text-ash">
                  Fecha dia {{ c.diaFechamento }}
                </p>
              </div>
            </div>

            <button
              @click="handleExcluir(c.id)"
              class="bg-coral/5 text-coral hover:bg-coral hover:text-white border-none rounded-full h-10 w-10 flex items-center justify-center transition-all duration-500 active:scale-90 cursor-pointer shrink-0"
              aria-label="Excluir cartão"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </div>

          <div v-if="meusCartoes.length === 0" class="flex flex-col items-center justify-center py-10 px-6 text-center space-y-4 animate-in fade-in zoom-in-95 duration-700">
            <IllustrationMascot variant="sunburst" :size="70" mood="happy" class="opacity-40" />
            <p class="text-xs text-ash font-bold italic max-w-[180px] leading-relaxed">
              Você ainda não cadastrou nenhum cartão próprio.
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom Sheet de Cadastro de Novo Cartão -->
    <BottomSheet 
      v-model="formularioAberto"
      :show-close="true"
      max-height="90dvh"
      min-height="60dvh"
      width-class="md:w-[560px]"
    >
      <template #header>
        <div class="flex items-center gap-3 w-full pr-8">
          <div class="w-10 h-10 rounded-xl bg-ember/15 text-ember flex items-center justify-center shrink-0">
            <CreditCard class="w-5 h-5" />
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="text-base font-bold text-charcoal leading-tight">Novo Cartão</h3>
            <p class="text-[10px] text-ash font-medium mt-0.5">Adicione um novo cartão de crédito</p>
          </div>
        </div>
      </template>

      <div class="px-6 pt-5 pb-4 space-y-6 flex-grow overflow-y-auto custom-scrollbar min-h-0">
        <!-- Nome do Cartão -->
        <div class="space-y-2">
          <label class="block text-[10px] font-bold uppercase text-graphite tracking-widest ml-1">Nome do Cartão</label>
          <input
            v-model="nome"
            type="text"
            placeholder="Ex: Nubank, C6, etc."
            class="w-full px-4 py-3.5 rounded-xl border border-stone bg-canvas outline-none font-bold text-charcoal focus:border-ember transition-all text-sm"
            @keyup.enter="adicionarCard"
          />
        </div>

        <!-- Dia de Fechamento -->
        <div class="space-y-2">
          <label class="block text-[10px] font-bold uppercase text-graphite tracking-widest ml-1">Dia de Fechamento</label>
          <div class="relative" tabindex="0" @blur="isDiaDropdownOpen = false">
            <Calendar class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-graphite pointer-events-none z-10 opacity-60" />
            <div
              @click="toggleDiaDropdown"
              class="w-full pl-12 pr-10 py-3.5 rounded-xl border border-stone bg-canvas outline-none font-bold text-charcoal transition-all text-sm cursor-pointer select-none"
              :class="isDiaDropdownOpen ? 'border-ember ring-4 ring-ember/10' : 'shadow-subtle'"
            >
              <span class="block truncate">{{ diaFechamento ? 'Dia ' + diaFechamento : 'Selecione o dia...' }}</span>
            </div>
            <ChevronDown
              class="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-graphite pointer-events-none transition-transform duration-300"
              :class="isDiaDropdownOpen ? 'rotate-180' : ''"
            />

            <!-- Dropdown Dia -->
            <div
              v-if="isDiaDropdownOpen"
              ref="diaDropdownRef"
              class="absolute left-0 w-full mt-2 max-h-48 overflow-y-auto bg-white border border-stone rounded-xl shadow-xl z-50 py-2 custom-scrollbar animate-in fade-in zoom-in-95 duration-200"
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

        <!-- Aviso sem casa -->
        <div v-if="!activeTenantId" class="p-3 bg-coral/5 border border-coral/10 rounded-xl">
          <p class="text-[10px] text-coral font-bold text-center uppercase tracking-widest">
            Selecione uma casa primeiro!
          </p>
        </div>
      </div>

      <!-- Rodapé -->
      <div class="shrink-0 flex gap-2.5 px-6 py-4 border-t border-stone/60 bg-white">
        <button 
          type="button"
          @click="formularioAberto = false"
          class="flex-1 h-12 bg-white border border-stone rounded-xl text-ash font-bold uppercase tracking-widest text-[10px] cursor-pointer hover:border-graphite active:scale-95 transition-all"
        >
          Cancelar
        </button>
        <Button
          variant="primary"
          @click="adicionarCard"
          class="flex-1"
          :disabled="!nome || !currentMembro || !activeTenantId"
        >
          Cadastrar
        </Button>
      </div>
    </BottomSheet>
  </div>
</template>
