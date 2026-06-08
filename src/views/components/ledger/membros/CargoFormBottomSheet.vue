<script setup lang="ts">
import { ref, watch } from 'vue'
import { Key, ChevronRight, Trash2, ArrowLeft } from 'lucide-vue-next'
import BottomSheet from '../../ui/BottomSheet.vue'
import Button from '../../ui/Button.vue'

interface Props {
  modelValue: boolean
  cargoSendoEditadoId: string | null
  cargoSendoEditado: any
  permissoesDisponiveis: { chave: string; label: string; desc: string }[]
}

const props = defineProps<Props>()
const emit = defineEmits(['update:modelValue', 'salvar', 'excluir', 'cancelar'])

const novoCargoNome = ref('')
const novoCargoCor = ref('#ef4444')
const novasPermissoes = ref<string[]>([])
const mostrarBottomSheetPermissoesCargo = ref(false)
const confirmarExclusaoCargo = ref(false)

const coresPredefinidas = [
  { hex: '#ef4444', name: 'ember' },
  { hex: '#3b82f6', name: 'sky' },
  { hex: '#10b981', name: 'meadow' },
  { hex: '#f59e0b', name: 'sunburst' },
  { hex: '#ec4899', name: 'flamingo' },
  { hex: '#8b5cf6', name: 'amethyst' }
]

const resetForm = () => {
  if (props.cargoSendoEditadoId && props.cargoSendoEditado) {
    novoCargoNome.value = props.cargoSendoEditado.nome
    novoCargoCor.value = props.cargoSendoEditado.cor || '#ef4444'
    novasPermissoes.value = [...props.cargoSendoEditado.permissoes]
  } else {
    novoCargoNome.value = ''
    novoCargoCor.value = '#ef4444'
    novasPermissoes.value = []
  }
  confirmarExclusaoCargo.value = false
  mostrarBottomSheetPermissoesCargo.value = false
}

const handleSalvar = () => {
  emit('salvar', {
    id: props.cargoSendoEditadoId,
    nome: novoCargoNome.value,
    cor: novoCargoCor.value,
    permissoes: novasPermissoes.value
  })
}

const toggleNovaPermissao = (chave: string) => {
  const index = novasPermissoes.value.indexOf(chave)
  if (index === -1) novasPermissoes.value.push(chave)
  else novasPermissoes.value.splice(index, 1)
}

watch(() => props.modelValue, (isOpen) => {
  if (!isOpen) {
    mostrarBottomSheetPermissoesCargo.value = false
    confirmarExclusaoCargo.value = false
  }
})

defineExpose({ resetForm })
</script>

<script lang="ts">
export default {
  name: 'CargoFormBottomSheet'
}
</script>

<template>
  <BottomSheet 
    :modelValue="modelValue"
    @update:modelValue="emit('update:modelValue', $event)"
    subtitle="Configure as permissões e a cor do cargo"
    max-height="90dvh"
  >
    <template #title>
      <h2 v-if="!mostrarBottomSheetPermissoesCargo" class="text-3xl font-display text-charcoal leading-tight">
        {{ cargoSendoEditadoId ? 'Editar' : 'Novo' }} <span class="text-ember">Cargo</span>
      </h2>
      <div v-else class="flex items-center gap-3 w-full">
        <button 
          type="button"
          @click="mostrarBottomSheetPermissoesCargo = false" 
          class="w-10 h-10 rounded-full bg-stone hover:bg-stone/80 text-charcoal flex items-center justify-center cursor-pointer transition-all border-none focus:outline-none"
        >
          <ArrowLeft class="w-5 h-5" />
        </button>
        <div class="flex-grow">
          <h2 class="text-2xl font-display text-charcoal leading-tight">
            Permissões do <span class="text-ember">Cargo</span>
          </h2>
        </div>
        <div class="shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold" :style="{ backgroundColor: novoCargoCor + '15', color: novoCargoCor }">
          {{ novasPermissoes.length }}/{{ permissoesDisponiveis.length }}
        </div>
      </div>
    </template>

    <!-- Tela 1: Formulário do Cargo -->
    <div v-if="!mostrarBottomSheetPermissoesCargo" class="space-y-6 pt-2 animate-in fade-in duration-300">
      <div class="space-y-2">
        <label class="block text-[10px] font-bold uppercase text-graphite tracking-widest ml-1">Nome do Cargo</label>
        <input
          v-model="novoCargoNome"
          type="text"
          placeholder="Ex: Financeiro, Consultor, etc."
          class="w-full px-4 py-3.5 rounded-xl border border-stone bg-canvas outline-none font-bold text-charcoal focus:border-ember transition-all text-sm"
        />
      </div>

      <div class="space-y-3">
        <label class="block text-[10px] font-bold uppercase text-graphite tracking-widest ml-1">Cor do Cargo</label>
        <div class="flex items-center gap-3 flex-wrap">
          <button
            v-for="cor in coresPredefinidas"
            :key="cor.hex"
            type="button"
            @click="novoCargoCor = cor.hex"
            class="w-10 h-10 rounded-full border-none cursor-pointer transition-all hover:scale-110 active:scale-95 shrink-0 relative flex items-center justify-center"
            :style="{ backgroundColor: cor.hex }"
            :class="novoCargoCor === cor.hex ? 'ring-2 ring-offset-2 ring-charcoal scale-110' : ''"
          >
            <span v-if="novoCargoCor === cor.hex" class="text-white text-xs font-bold leading-none">✓</span>
          </button>
        </div>
      </div>

      <div class="space-y-2">
        <label class="block text-[10px] font-bold uppercase text-graphite tracking-widest ml-1">Permissões do Cargo</label>
        <button
          type="button"
          @click="mostrarBottomSheetPermissoesCargo = true"
          class="w-full flex items-center justify-between p-3.5 bg-parchment/30 border border-stone rounded-2xl hover:border-ember transition-colors cursor-pointer text-left group"
        >
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-ember/10 text-ember flex items-center justify-center shrink-0 group-hover:bg-ember group-hover:text-white transition-colors duration-200">
              <Key class="w-5 h-5" />
            </div>
            <div>
              <p class="text-xs font-bold text-charcoal leading-none">Configurar Permissões</p>
              <p class="text-[10px] mt-1">
                <span v-if="novasPermissoes.length > 0" class="text-meadow font-bold">
                  {{ novasPermissoes.length }} selecionada{{ novasPermissoes.length !== 1 ? 's' : '' }}
                </span>
                <span v-else class="text-ash">Nenhuma selecionada ainda</span>
              </p>
            </div>
          </div>
          <ChevronRight class="w-5 h-5 text-ash group-hover:text-ember transition-colors" />
        </button>
      </div>
    </div>

    <!-- Tela 2: Permissões do Cargo -->
    <div v-else class="space-y-3 pt-2 animate-in fade-in slide-in-from-right-3 duration-350">
      <button
        v-for="p in permissoesDisponiveis"
        :key="p.chave"
        type="button"
        @click="toggleNovaPermissao(p.chave)"
        class="w-full flex items-center gap-4 p-3.5 rounded-2xl border-none bg-transparent text-left cursor-pointer transition-all duration-200 active:scale-[0.99]"
      >
        <div 
          class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200"
          :style="novasPermissoes.includes(p.chave) ? { backgroundColor: novoCargoCor + '18', color: novoCargoCor } : {}"
          :class="!novasPermissoes.includes(p.chave) ? 'bg-stone/50 text-ash' : ''"
        >
          <span class="text-base font-bold leading-none" v-if="novasPermissoes.includes(p.chave)">✓</span>
          <span class="w-4 h-4 rounded-full border-2 border-ash/30 block" v-else />
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-xs font-bold leading-none transition-colors duration-200" :class="novasPermissoes.includes(p.chave) ? 'text-charcoal' : 'text-ash'">{{ p.label }}</p>
          <p class="text-[9px] text-ash mt-1 leading-snug">{{ p.desc }}</p>
        </div>
        <div 
          class="w-10 h-5.5 rounded-full p-0.5 transition-all duration-300 shrink-0 flex items-center"
          :class="novasPermissoes.includes(p.chave) ? 'justify-end' : 'justify-start bg-stone/40'"
          :style="novasPermissoes.includes(p.chave) ? { backgroundColor: novoCargoCor } : {}"
        >
          <div class="w-4 h-4 rounded-full bg-white shadow-subtle" />
        </div>
      </button>
    </div>

    <!-- Rodapés -->
    <template #footer>
      <!-- Footer Tela 1 -->
      <div v-if="!mostrarBottomSheetPermissoesCargo" class="flex gap-2.5">
        <Button variant="secondary" @click="emit('cancelar')" class="flex-1 font-bold uppercase tracking-widest text-[10px] h-12">Cancelar</Button>
        <Button 
          variant="primary" 
          @click="handleSalvar" 
          :disabled="!novoCargoNome.trim() || novasPermissoes.length === 0"
          class="flex-1 font-bold uppercase tracking-widest text-[10px] h-12"
        >
          {{ cargoSendoEditadoId ? 'Salvar Alterações' : 'Criar Cargo' }}
        </Button>
      </div>

      <!-- Footer Tela 2 -->
      <div v-else class="flex flex-col gap-2.5">
        <div v-if="confirmarExclusaoCargo" class="space-y-3 w-full animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div class="p-3 bg-coral/5 border border-coral/20 rounded-xl">
            <p class="text-[11px] font-bold text-coral leading-snug">
              {{ (cargoSendoEditado?.totalMembros || 0) > 0 
                ? `Atenção: Este cargo possui ${(cargoSendoEditado?.totalMembros)} morador(es) vinculado(s). Ao excluí-lo, eles ficarão sem cargo.`
                : `Tem certeza que deseja excluir o cargo "${novoCargoNome}"?` 
              }}
            </p>
          </div>
          <div class="flex gap-2.5 w-full">
            <Button variant="secondary" @click="confirmarExclusaoCargo = false" class="flex-1 font-bold uppercase tracking-widest text-[10px] h-12">Cancelar</Button>
            <button @click="emit('excluir', cargoSendoEditadoId)" class="flex-1 h-12 bg-coral text-white border-none rounded-pill font-bold uppercase tracking-widest text-[10px] cursor-pointer shadow-subtle">Sim, Excluir</button>
          </div>
        </div>
        <div v-else class="flex gap-2.5 w-full">
          <button v-if="cargoSendoEditadoId" @click="confirmarExclusaoCargo = true" class="w-12 h-12 rounded-xl border border-stone bg-white text-ash hover:text-coral transition-all cursor-pointer flex items-center justify-center shrink-0"><Trash2 class="w-4.5 h-4.5" /></button>
          <button @click="mostrarBottomSheetPermissoesCargo = false" class="flex-1 h-12 rounded-pill font-bold uppercase tracking-widest text-[10px] cursor-pointer text-white border-none shadow-subtle" :style="{ backgroundColor: novoCargoCor }">Confirmar ({{ novasPermissoes.length }})</button>
        </div>
      </div>
    </template>
  </BottomSheet>
</template>

<style scoped>
</style>

