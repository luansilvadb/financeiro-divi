<script setup lang="ts">
import BottomSheet from '../../ui/BottomSheet.vue'
import Button from '../../ui/Button.vue'
import { Home, Check, Copy, LogOut } from 'lucide-vue-next'

const props = defineProps<{
  visible: boolean
  casasMultitenant: any
}>()

const emit = defineEmits(['close'])

const {
  casas,
  activeTenantId,
  copiedCode,
  form,
  selecionarCasa,
  copyInviteCode,
  criarNovaCasa,
  entrarPorCodigo,
  handleLogoutClick
} = props.casasMultitenant
</script>

<template>
  <BottomSheet 
    :model-value="visible" 
    @update:model-value="val => { if (!val) emit('close') }" 
    width-class="md:w-[460px]"
    max-height="90dvh"
  >
    <div class="p-6 sm:p-8 space-y-6 flex-grow overflow-y-auto custom-scrollbar flex flex-col text-graphite">
      <div class="space-y-3">
        <h3 class="text-3xl font-display text-charcoal leading-tight">Minhas <span class="text-ember">Casas</span></h3>
        <p class="text-xs text-ash leading-relaxed">
          Selecione uma casa ativa ou gerencie seus grupos financeiros. Compartilhe o código de convite para trazer novos membros.
        </p>
      </div>

      <div class="space-y-3">
        <h4 class="text-[9px] font-bold uppercase tracking-widest text-ash">Alternar de Casa</h4>
        <div class="grid gap-2">
          <div 
            v-for="casa in casas" 
            :key="casa.id"
            @click="selecionarCasa(casa.id)"
            class="p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between"
            :class="activeTenantId === casa.id ? 'border-ember bg-ember/5 text-ember font-bold' : 'border-stone bg-canvas text-charcoal'"
          >
            <div class="flex items-center gap-3">
              <Home class="w-4 h-4 shrink-0" :class="activeTenantId === casa.id ? 'text-ember' : 'text-ash'" />
              <span class="text-sm font-semibold">{{ casa.name }}</span>
            </div>
            <div class="flex items-center gap-2" @click.stop>
              <code class="text-[10px] bg-stone/50 px-2 py-1 rounded text-ash font-mono select-all">
                {{ casa.inviteCode }}
              </code>
              <button 
                @click="copyInviteCode(casa.inviteCode)" 
                class="p-1 hover:bg-stone rounded transition-colors"
              >
                <Check v-if="copiedCode === casa.inviteCode" class="w-3.5 h-3.5 text-meadow" />
                <Copy v-else class="w-3.5 h-3.5 text-ash" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <hr class="border-stone/60 my-6" />

      <div class="space-y-3">
        <h4 class="text-[9px] font-bold uppercase tracking-widest text-ash">Criar Nova Casa</h4>
        <div class="flex gap-2">
          <input 
            v-model="form.nomeNovaCasa"
            placeholder="Ex: República Central"
            class="flex-1 bg-[#fbfaf9] border border-[#f2f0ed] rounded-xl px-4 py-2 text-sm text-[#343433] placeholder-[#a7a7a7] focus:outline-none focus:border-[#ff3e00]"
          />
          <Button size="sm" @click="criarNovaCasa">Criar</Button>
        </div>
      </div>

      <div class="space-y-3 pt-2">
        <h4 class="text-[9px] font-bold uppercase tracking-widest text-ash">Entrar com Código</h4>
        <div class="flex gap-2">
          <input 
            v-model="form.codigoConvite"
            placeholder="Ex: CASA-7F2A1"
            class="flex-1 bg-[#fbfaf9] border border-[#f2f0ed] rounded-xl px-4 py-2 text-sm text-[#343433] placeholder-[#a7a7a7] focus:outline-none focus:border-[#ff3e00]"
          />
          <Button size="sm" @click="entrarPorCodigo">Entrar</Button>
        </div>
      </div>

      <div v-if="form.errorCasa" class="text-xs text-coral font-semibold pt-2">
        {{ form.errorCasa }}
      </div>
    </div>
    
    <div class="p-6 sm:px-8 sm:pb-8 border-t border-stone bg-white shrink-0 flex justify-between items-center">
      <button 
        @click="handleLogoutClick" 
        class="flex items-center gap-2 text-xs font-bold text-coral hover:underline focus:outline-none"
      >
        <LogOut class="w-4 h-4" />
        Sair da Conta
      </button>
      <Button variant="secondary" @click="emit('close')">Fechar</Button>
    </div>
  </BottomSheet>
</template>
