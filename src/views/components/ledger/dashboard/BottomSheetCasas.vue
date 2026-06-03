<script setup lang="ts">
import BottomSheet from '../../ui/BottomSheet.vue'
import Button from '../../ui/Button.vue'
import { Home, Check, Copy, LogOut } from 'lucide-vue-next'

const props = defineProps<{
  visible: boolean
  casasMultitenant: any
}>()

const emit = defineEmits(['close'])
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
        <h4 class="text-[9px] font-semibold uppercase tracking-widest text-ash">Alternar de Casa</h4>
        <div class="grid gap-2">
          <div 
            v-for="casa in casasMultitenant.casas" 
            :key="casa.id"
            @click="casasMultitenant.selecionarCasa(casa.id); emit('close')"
            class="p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between"
            :class="casasMultitenant.activeTenantId === casa.id ? 'border-ember bg-ember/5 text-ember font-semibold' : 'border-stone bg-canvas text-charcoal'"
          >
            <div class="flex items-center gap-3">
              <Home class="w-4 h-4 shrink-0" :class="casasMultitenant.activeTenantId === casa.id ? 'text-ember' : 'text-ash'" />
              <span class="text-sm font-medium">{{ casa.name }}</span>
            </div>
            <div class="flex items-center gap-2" @click.stop>
              <code class="text-[10px] bg-stone/50 px-2 py-1 rounded text-ash font-mono select-all">
                {{ casa.inviteCode }}
              </code>
              <button 
                @click="casasMultitenant.copyInviteCode(casa.inviteCode)" 
                class="p-1 hover:bg-stone rounded transition-colors"
              >
                <Check v-if="casasMultitenant.copiedCode === casa.inviteCode" class="w-3.5 h-3.5 text-meadow" />
                <Copy v-else class="w-3.5 h-3.5 text-ash" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <hr class="border-stone/60 my-6" />

      <div class="space-y-3">
        <h4 class="text-[9px] font-bold uppercase tracking-widest text-graphite">Criar Nova Casa</h4>
        <div class="flex gap-2">
          <input 
            v-model="casasMultitenant.form.nomeNovaCasa"
            placeholder="Ex: República Central"
            @keyup.enter="casasMultitenant.criarNovaCasa"
            class="flex-1 bg-canvas border border-stone rounded-xl px-4 py-2 text-sm text-charcoal placeholder-stone focus:outline-none focus:border-ember transition-all"
          />
          <Button size="sm" @click="casasMultitenant.criarNovaCasa" :loading="casasMultitenant.isCreating">Criar</Button>
        </div>
      </div>

      <div class="space-y-3 pt-2">
        <h4 class="text-[9px] font-bold uppercase tracking-widest text-graphite">Entrar com Código</h4>
        <div class="flex gap-2">
          <input 
            v-model="casasMultitenant.form.codigoConvite"
            placeholder="Ex: CASA-7F2A1"
            @keyup.enter="casasMultitenant.entrarPorCodigo"
            class="flex-1 bg-canvas border border-stone rounded-xl px-4 py-2 text-sm text-charcoal placeholder-stone focus:outline-none focus:border-ember transition-all"
          />
          <Button size="sm" @click="casasMultitenant.entrarPorCodigo" :loading="casasMultitenant.isEntering">Entrar</Button>
        </div>
      </div>

      <div v-if="casasMultitenant.form.errorCasa" class="text-xs text-coral font-medium pt-2">
        {{ casasMultitenant.form.errorCasa }}
      </div>
    </div>
    
    <div class="p-6 sm:px-8 sm:pb-8 border-t border-stone bg-white shrink-0 flex justify-between items-center">
      <button 
        @click="casasMultitenant.handleLogoutClick" 
        class="flex items-center gap-2 text-xs font-semibold text-coral hover:underline focus:outline-none"
      >
        <LogOut class="w-4 h-4" />
        Sair da Conta
      </button>
      <Button variant="secondary" @click="emit('close')">Fechar</Button>
    </div>
  </BottomSheet>
</template>
