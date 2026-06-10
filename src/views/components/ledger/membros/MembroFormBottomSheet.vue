<script setup lang="ts">
import { ref } from 'vue'
import { Eye, EyeOff } from 'lucide-vue-next'
import BottomSheet from '../../ui/BottomSheet.vue'
import Button from '../../ui/Button.vue'
import MembroAvatar from '../../ui/MembroAvatar.vue'

interface Props {
  modelValue: boolean
  activeTenantId: string | null
}

const props = defineProps<Props>()
const emit = defineEmits(['update:modelValue', 'salvar', 'cancelar'])

const novoNome = ref('')
const novoUsername = ref('')
const novoPassword = ref('')
const showPassword = ref(false)

const resetForm = () => {
  novoNome.value = ''
  novoUsername.value = ''
  novoPassword.value = ''
  showPassword.value = false
}

const handleAdicionar = () => {
  emit('salvar', {
    nome: novoNome.value,
    username: novoUsername.value,
    password: novoPassword.value
  })
}

defineExpose({ resetForm })
</script>

<script lang="ts">
export default {
  name: 'MembroFormBottomSheet'
}
</script>

<template>
  <BottomSheet 
    :modelValue="modelValue"
    @update:modelValue="emit('update:modelValue', $event)"
    subtitle="Adicione um novo membro à casa"
    max-height="90dvh"
  >
    <template #title>
      <h3 class="text-3xl font-display text-charcoal leading-tight">Novo <span class="text-ember">Morador</span></h3>
    </template>

    <div class="space-y-6 pt-2">
      <div class="flex items-center gap-3 p-3.5 rounded-2xl border border-stone bg-parchment/30">
        <MembroAvatar :nome="novoNome.trim() || '?'" variant="ember" size="md" />
        <div class="flex-1 min-w-0">
          <span class="text-sm font-bold text-charcoal leading-none block truncate">{{ novoNome.trim() || 'Nome do morador...' }}</span>
          <p class="text-[10px] text-ash mt-0.5">@{{ novoUsername.trim() || 'usuario' }}</p>
        </div>
        <span class="px-2 py-0.5 rounded-full text-[8px] font-bold bg-stone text-ash uppercase tracking-widest shrink-0">Preview</span>
      </div>

      <div class="space-y-2">
        <label for="nome" class="block text-[10px] font-bold uppercase text-graphite tracking-widest ml-1">Nome Completo</label>
        <div class="relative w-full">
          <input
            id="nome"
            v-model="novoNome"
            maxlength="50"
            type="text"
            placeholder="Ex: Luana Oliveira"
            class="w-full px-4 py-3.5 pr-12 rounded-xl border border-stone bg-canvas outline-none font-bold text-charcoal focus:border-ember transition-all text-sm"
          />
          <span v-if="novoNome.length > 0" class="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-ash/60">{{ novoNome.length }}/50</span>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="space-y-2">
          <label for="usuario" class="text-[10px] font-bold uppercase text-graphite tracking-widest ml-1 block">Usuário</label>
          <input id="usuario" v-model="novoUsername" type="text" placeholder="luana.ol" class="w-full px-4 py-3.5 rounded-xl border border-stone bg-canvas outline-none font-bold text-charcoal focus:border-ember text-sm transition-all" />
        </div>
        <div class="space-y-2">
          <label for="senha" class="text-[10px] font-bold uppercase text-graphite tracking-widest ml-1 block">Senha</label>
          <div class="relative">
            <input
              id="senha"
              v-model="novoPassword"
              :type="showPassword ? 'text' : 'password'"
              placeholder="••••••"
              class="w-full px-4 py-3.5 pr-12 rounded-xl border border-stone bg-canvas outline-none font-bold text-charcoal focus:border-ember text-sm transition-all"
            />
            <button
              type="button"
              @click="showPassword = !showPassword"
              class="absolute inset-y-0 right-0 pr-4 flex items-center text-graphite hover:text-charcoal focus-visible:ring-2 focus-visible:ring-ember/20 focus-visible:outline-none transition-all border-none bg-transparent cursor-pointer rounded-lg m-1"
              :aria-label="showPassword ? 'Ocultar senha' : 'Mostrar senha'"
            >
              <EyeOff v-if="showPassword" class="w-5 h-5" />
              <Eye v-else class="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex gap-2.5">
        <Button variant="secondary" @click="emit('cancelar')" class="flex-1 font-bold uppercase tracking-widest text-[10px] h-12">Cancelar</Button>
        <Button 
          variant="primary" 
          @click="handleAdicionar" 
          :disabled="!novoNome.trim() || !novoUsername.trim() || !novoPassword.trim() || !activeTenantId" 
          class="flex-1 font-bold uppercase tracking-widest text-[10px] h-12"
        >Cadastrar</Button>
      </div>
    </template>
  </BottomSheet>
</template>
