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
  setPeriodoSelecionado,
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
    subtitle="Selecione o mês que você deseja gerenciar. Todos os meses estão abertos para lançamentos até serem fechados."
    :content-class="`px-6 pb-8 flex-grow ${isDropdownAbertosOpen ? 'overflow-visible' : 'overflow-y-auto'}`"
  >
    <template #title>
      <h3 class="text-3xl font-display text-charcoal leading-tight">Navegar nos <span class="text-ember">Períodos</span></h3>
    </template>

    <div class="space-y-6 pt-2">
      <div class="space-y-3">
        <h4 class="text-[10px] font-bold uppercase tracking-widest text-graphite ml-1">Gerenciar Período Aberto</h4>
        <div class="relative" @blur="isDropdownAbertosOpen = false">
          <div 
            @click="isDropdownAbertosOpen = !isDropdownAbertosOpen"
            @keydown.enter.prevent="isDropdownAbertosOpen = !isDropdownAbertosOpen"
            @keydown.space.prevent="isDropdownAbertosOpen = !isDropdownAbertosOpen"
            aria-label="Gerenciar período aberto"
            role="button"
            tabindex="0"
            :aria-expanded="isDropdownAbertosOpen ? 'true' : 'false'"
            class="w-full px-4 py-3.5 rounded-xl border border-stone bg-canvas outline-none font-bold text-sm text-charcoal cursor-pointer flex justify-between items-center transition-all hover:bg-stone/30"
          >
            <span class="flex items-center gap-2.5">
              <span class="w-2.5 h-2.5 rounded-full bg-meadow animate-pulse" />
              <span class="block truncate">
                {{ (periodoSelecionado && faturasFechadas.every(f => f.periodo.mes !== periodoSelecionado.mes || f.periodo.ano !== periodoSelecionado.ano))
                  ? formatarMesAno(periodoSelecionado.mes, periodoSelecionado.ano)
                  : 'Selecionar mês aberto...'
                }}
              </span>
            </span>
            <ChevronDown class="w-4 h-4 text-graphite pointer-events-none transition-transform duration-300" :class="isDropdownAbertosOpen ? 'rotate-180' : ''" />
          </div>
          
          <transition name="dropdown-slide">
            <div v-if="isDropdownAbertosOpen" class="absolute left-0 w-full mt-1.5 max-h-48 overflow-y-auto bg-card border border-stone rounded-xl shadow-xl z-50 py-2 custom-scrollbar">
              <div 
                v-for="op in mesesAbertosOpcoes" 
                :key="op.nome" 
                :ref="(el) => { if (el && periodoSelecionado.mes === op.mes && periodoSelecionado.ano === op.ano) itemSelecionadoRef = el as HTMLElement }"
                @mousedown.prevent="() => { setPeriodoSelecionado(op.mes, op.ano); isDropdownAbertosOpen = false; emit('close') }" 
                role="button"
                tabindex="0"
                class="px-4 py-3.5 text-sm font-bold hover:bg-stone cursor-pointer transition-colors flex items-center gap-3"
                :class="periodoSelecionado.mes === op.mes && periodoSelecionado.ano === op.ano ? 'text-ember bg-ember/5' : 'text-charcoal'"
              >
                <span class="w-2 h-2 rounded-full bg-meadow animate-pulse shrink-0" />
                {{ op.nome }}
              </div>
            </div>
          </transition>
        </div>
      </div>

      <div class="h-px bg-stone/60 my-2" />

      <div class="space-y-3">
        <h4 class="text-[10px] font-bold uppercase tracking-widest text-graphite ml-1">Histórico de Fechados (Arquivados)</h4>
        <div class="grid gap-2">
          <div 
            v-for="item in mesesTrancadosOpcoes" 
            :key="item.nome"
            @click="() => { setPeriodoSelecionado(item.mes, item.ano); emit('close') }"
            :aria-label="'Selecionar período arquivado ' + item.nome"
            role="button"
            tabindex="0"
            class="p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between"
            :class="periodoSelecionado.mes === item.mes && periodoSelecionado.ano === item.ano ? 'border-ember bg-ember/5 text-ember font-bold' : 'border-stone bg-canvas text-charcoal hover:bg-stone/30'"
          >
            <div class="flex items-center gap-3">
              <span class="w-2.5 h-2.5 rounded-full bg-graphite opacity-30" />
              <span class="text-sm font-bold">{{ item.nome }}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-[10px] uppercase font-bold text-graphite opacity-60">Arquivado</span>
              <Lock class="w-3.5 h-3.5 text-graphite opacity-40 shrink-0" />
            </div>
          </div>
          
          <div v-if="mesesTrancadosOpcoes.length === 0" class="text-center py-8 border border-dashed border-stone rounded-2xl">
            <p class="text-xs text-graphite font-semibold opacity-60 italic">Nenhum período arquivado ainda.</p>
          </div>
        </div>
      </div>
    </div>
    
    <template #footer>
      <Button variant="secondary" class="w-full font-bold uppercase tracking-widest text-[10px] h-12" @click="emit('close')">Fechar</Button>
    </template>
  </BottomSheet>
</template>
