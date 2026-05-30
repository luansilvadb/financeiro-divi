<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import BottomSheet from '../../ui/BottomSheet.vue'
import Button from '../../ui/Button.vue'
import { ChevronDown, Lock } from 'lucide-vue-next'

const props = defineProps<{
  visible: boolean
  vm: any
  faturasFechadas: any[]
}>()

const emit = defineEmits(['close'])

const {
  periodoSelecionado,
  mesesAbertosOpcoes,
  mesesTrancadosOpcoes,
  formatarMesAno
} = props.vm

const itemSelecionadoRef = ref<HTMLElement | null>(null)
const isDropdownAbertosOpen = ref(false)

watch(isDropdownAbertosOpen, async (aberto) => {
  if (aberto) {
    await nextTick()
    itemSelecionadoRef.value?.scrollIntoView({ block: 'nearest' })
  }
})
</script>

<template>
  <BottomSheet 
    :model-value="visible" 
    @update:model-value="val => { if (!val) emit('close') }" 
    width-class="md:w-[460px]"
    max-height="85dvh"
  >
    <div class="p-6 sm:p-8 space-y-6 flex-grow custom-scrollbar" :class="isDropdownAbertosOpen ? 'overflow-y-visible' : 'overflow-y-auto'">
      <div class="space-y-3">
        <h3 class="text-3xl font-display text-charcoal leading-tight">Navegar<br>nos <span class="text-ember">Períodos</span></h3>
        <p class="text-xs text-ash leading-relaxed">
          Selecione o mês que você deseja gerenciar. Todos os meses estão abertos para lançamentos até serem fechados.
        </p>
      </div>

      <div class="space-y-3">
        <h4 class="text-[9px] font-bold uppercase tracking-widest text-ash">Gerenciar Período Aberto</h4>
        <div class="relative" @blur="isDropdownAbertosOpen = false">
          <div 
            @click="isDropdownAbertosOpen = !isDropdownAbertosOpen"
            @keydown.enter.prevent="isDropdownAbertosOpen = !isDropdownAbertosOpen"
            @keydown.space.prevent="isDropdownAbertosOpen = !isDropdownAbertosOpen"
            aria-label="Gerenciar período aberto"
            role="button"
            tabindex="0"
            :aria-expanded="isDropdownAbertosOpen ? 'true' : 'false'"
            class="w-full px-4 py-3.5 rounded-xl border border-stone bg-canvas outline-none font-bold text-charcoal cursor-pointer flex justify-between items-center"
          >
            <span class="flex items-center gap-2.5">
              <span class="w-2 h-2 rounded-full bg-meadow animate-pulse" />
              <span class="block truncate">
                {{ (periodoSelecionado && faturasFechadas.every(f => f.periodo.mes !== periodoSelecionado.mes || f.periodo.ano !== periodoSelecionado.ano))
                  ? formatarMesAno(periodoSelecionado.mes, periodoSelecionado.ano)
                  : 'Selecionar mês aberto...'
                }}
              </span>
            </span>
            <ChevronDown class="w-4 h-4 text-ash pointer-events-none transition-transform duration-200" :class="isDropdownAbertosOpen ? 'rotate-180' : ''" />
          </div>
          
          <transition name="dropdown-slide">
            <div v-if="isDropdownAbertosOpen" class="absolute left-0 w-full mt-1.5 max-h-48 overflow-y-auto bg-canvas border border-stone rounded-xl shadow-xl z-50 py-2 custom-scrollbar">
              <div 
                v-for="op in mesesAbertosOpcoes" 
                :key="op.nome" 
                :ref="(el) => { if (el && periodoSelecionado.mes === op.mes && periodoSelecionado.ano === op.ano) itemSelecionadoRef = el as HTMLElement }"
                @mousedown.prevent="periodoSelecionado.mes = op.mes; periodoSelecionado.ano = op.ano; isDropdownAbertosOpen = false; emit('close')" 
                @keydown.enter.prevent="periodoSelecionado.mes = op.mes; periodoSelecionado.ano = op.ano; isDropdownAbertosOpen = false; emit('close')"
                @keydown.space.prevent="periodoSelecionado.mes = op.mes; periodoSelecionado.ano = op.ano; isDropdownAbertosOpen = false; emit('close')"
                role="button"
                tabindex="0"
                class="px-4 py-3 text-sm font-medium hover:bg-stone cursor-pointer transition-colors flex items-center gap-3"
                :class="periodoSelecionado.mes === op.mes && periodoSelecionado.ano === op.ano ? 'text-ember bg-ember/5' : 'text-charcoal'"
              >
                <span class="w-2 h-2 rounded-full bg-meadow animate-pulse shrink-0" />
                {{ op.nome }}
              </div>
            </div>
          </transition>
        </div>
      </div>

      <hr class="border-stone/60 my-6" />

      <div class="space-y-3">
        <h4 class="text-[9px] font-bold uppercase tracking-widest text-ash">Histórico de Fechados (Arquivados)</h4>
        <div class="grid gap-2">
          <div 
            v-for="item in mesesTrancadosOpcoes" 
            :key="item.nome"
            @click="periodoSelecionado.mes = item.mes; periodoSelecionado.ano = item.ano; emit('close')"
            @keydown.enter.prevent="periodoSelecionado.mes = item.mes; periodoSelecionado.ano = item.ano; emit('close')"
            @keydown.space.prevent="periodoSelecionado.mes = item.mes; periodoSelecionado.ano = item.ano; emit('close')"
            :aria-label="'Selecionar período arquivado ' + item.nome"
            role="button"
            tabindex="0"
            class="p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between"
            :class="periodoSelecionado.mes === item.mes && periodoSelecionado.ano === item.ano ? 'border-ember bg-ember/5 text-ember font-bold' : 'border-stone bg-canvas text-charcoal'"
          >
            <div class="flex items-center gap-3">
              <span class="w-2.5 h-2.5 rounded-full bg-ash" />
              <span class="text-sm font-semibold">{{ item.nome }}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-[10px] uppercase font-bold text-ash">Arquivado</span>
              <Lock class="w-3.5 h-3.5 text-ash shrink-0" />
            </div>
          </div>
          
          <div v-if="mesesTrancadosOpcoes.length === 0" class="text-center py-6 border border-dashed border-stone rounded-xl">
            <p class="text-xs text-ash italic">Nenhum período arquivado ainda.</p>
          </div>
        </div>
      </div>
    </div>
    
    <div class="p-6 sm:px-8 sm:pb-8 border-t border-stone bg-white shrink-0">
      <Button variant="secondary" class="w-full" @click="emit('close')">Fechar</Button>
    </div>
  </BottomSheet>
</template>
