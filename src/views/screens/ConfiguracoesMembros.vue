<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useMembros } from '../../viewmodels/useMembros'
import { UserMinus, UserCheck, Users, CreditCard, Copy, Share2 } from 'lucide-vue-next'
import ConfiguracoesCartoes from '../components/ledger/ConfiguracoesCartoes.vue'
import Card from '../components/ui/Card.vue'
import Button from '../components/ui/Button.vue'
import { useCasasMultitenant } from '../../viewmodels/useCasasMultitenant'
import { useToast } from '../../composables/useToast'

const { membros, adicionarMembro, desativarMembro, ativarMembro, carregar } = useMembros()
const { activeTenantId, activeTenantObj, copyInviteCode, copied } = useCasasMultitenant()
const toast = useToast()

const getInviteLink = () => {
  if (!activeTenantObj.value) return ''
  const url = window.location.origin + window.location.pathname
  return `${url}?invite=${activeTenantObj.value.inviteCode}`
}

const handleCopyLink = () => {
  copyInviteCode(getInviteLink())
  toast.show('Link de convite copiado!', 'success')
}

const novoNome = ref('')
const novoUsername = ref('')
const novoPassword = ref('')
const mostrarCredenciais = ref(false)

let alternandoCredenciais = false
const toggleCredenciais = () => {
  if (alternandoCredenciais) return
  alternandoCredenciais = true
  mostrarCredenciais.value = !mostrarCredenciais.value
  requestAnimationFrame(() => {
    alternandoCredenciais = false
  })
}

onMounted(async () => {
  if (membros.value.length === 0 && activeTenantId.value) {
    try {
      await carregar()
    } catch (e) {
      console.error('Erro ao carregar moradores na tela de ajustes', e)
    }
  }
})
const activeTab = ref<'membros' | 'cartoes'>('membros')

const emit = defineEmits(['voltar'])

const handleAdicionar = async () => {
  if (novoNome.value.trim()) {
    try {
      await adicionarMembro(
        novoNome.value.trim(), 
        mostrarCredenciais.value ? novoUsername.value.trim() : undefined,
        mostrarCredenciais.value ? novoPassword.value.trim() : undefined
      )
      novoNome.value = ''
      novoUsername.value = ''
      novoPassword.value = ''
      mostrarCredenciais.value = false
    } catch (error: any) {
      toast.show(error.message || 'Erro ao adicionar morador', 'error')
    }
  }
}

const handleDesativar = async (id: string) => {
  try {
    await desativarMembro(id)
  } catch (error: any) {
    toast.show(error.message || 'Erro ao desativar morador', 'error')
  }
}

const handleAtivar = async (id: string) => {
  try {
    await ativarMembro(id)
  } catch (error: any) {
    toast.show(error.message || 'Erro ao reativar morador', 'error')
  }
}
</script>

<template>
  <div class="flex flex-col flex-grow h-full min-h-0 w-full overflow-hidden text-graphite">
    <!-- Header e Abas fixas no topo do fluxo (não rolam) -->
    <div class="shrink-0 space-y-6 px-4 pt-6 pb-4 sm:px-8 border-b border-stone/50 bg-white">
      <div class="flex items-center justify-between">
        <div class="space-y-2">
          <h2 class="text-3xl font-display text-charcoal">Ajustes <span class="text-ember">Gerais</span></h2>
        </div>
      </div>

      <!-- Abas Estilo Pílula -->
      <div class="flex p-1.5 bg-parchment rounded-full w-full border border-stone">
        <button 
          @click="activeTab = 'membros'"
          class="flex-1 relative px-3 sm:px-6 py-2.5 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2.5 outline-none group"
          :class="activeTab === 'membros' ? 'text-charcoal' : 'text-ash hover:text-graphite'"
        >
          <div 
            class="absolute inset-0 bg-white shadow-subtle rounded-full transition-all duration-500 ease-[cubic-bezier(0.19,1,0.22,1)]"
            :class="activeTab === 'membros' ? 'opacity-100 scale-100' : 'opacity-0 scale-90'"
          />
          <Users 
            class="w-4 h-4 relative z-10 transition-colors duration-500 ease-[cubic-bezier(0.19,1,0.22,1)]" 
            :class="activeTab === 'membros' ? 'text-ember scale-110' : 'scale-100 group-hover:text-ember/50'" 
          />
          <span class="relative z-10">Moradores</span>
        </button>

        <button 
          @click="activeTab = 'cartoes'"
          class="flex-1 relative px-3 sm:px-6 py-2.5 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2.5 outline-none group"
          :class="activeTab === 'cartoes' ? 'text-charcoal' : 'text-ash hover:text-graphite'"
        >
          <div 
            class="absolute inset-0 bg-white shadow-subtle rounded-full transition-all duration-500 ease-[cubic-bezier(0.19,1,0.22,1)]"
            :class="activeTab === 'cartoes' ? 'opacity-100 scale-100' : 'opacity-0 scale-90'"
          />
          <CreditCard 
            class="w-4 h-4 relative z-10 transition-colors duration-500 ease-[cubic-bezier(0.19,1,0.22,1)]" 
            :class="activeTab === 'cartoes' ? 'text-ember scale-110' : 'scale-100 group-hover:text-ember/50'" 
          />
          <span class="relative z-10">Cartões</span>
        </button>
      </div>
    </div>

    <!-- Conteúdo das Abas: Área com Scroll -->
    <div class="flex-grow overflow-y-auto custom-scrollbar px-4 py-6 sm:px-8 space-y-6 min-w-0">
      <div class="grid relative items-start w-full min-w-0">
        <!-- Conteúdo Aba 1: Moradores -->
        <div 
          class="col-start-1 row-start-1 transition-all duration-500 ease-spring space-y-4 w-full min-w-0"
          :class="activeTab === 'membros' ? 'opacity-100 translate-y-0 z-10 delay-100' : 'opacity-0 translate-y-4 pointer-events-none z-0'"
        >
          <!-- Quick Invite Bar -->
          <Card v-if="activeTenantObj" class="p-3 sm:p-4 bg-white border border-stone shadow-subtle rounded-card flex items-center gap-3 w-full min-w-0">
            <div class="w-10 h-10 shrink-0 rounded-full bg-ember/10 flex items-center justify-center text-ember">
              <Share2 class="w-4 h-4" />
            </div>
            <div class="flex-grow min-w-0">
              <p class="text-[10px] font-bold text-ash uppercase tracking-widest leading-none mb-1">Convite</p>
              <p class="text-xs font-bold text-charcoal truncate">{{ getInviteLink() }}</p>
            </div>
            <button 
              @click="handleCopyLink"
              class="shrink-0 h-10 px-4 rounded-pill font-bold uppercase tracking-widest text-[10px] transition-all"
              :class="copied ? 'bg-meadow text-white' : 'bg-charcoal text-white hover:bg-midnight'"
            >
              {{ copied ? 'Copiado!' : 'Copiar' }}
            </button>
          </Card>

          <!-- Compact Add Section -->
          <Card class="p-5 bg-white border border-stone shadow-subtle rounded-card">
            <div class="flex flex-col gap-4">
              <div class="flex items-center justify-between">
                <h4 class="text-[10px] font-bold uppercase tracking-widest text-ash">Novo Morador</h4>
                <button 
                  @click="toggleCredenciais"
                  class="text-[10px] font-bold uppercase tracking-widest hover:underline transition-colors duration-150 select-none [touch-action:manipulation] [-webkit-tap-highlight-color:transparent]"
                  :class="mostrarCredenciais ? 'text-ash' : 'text-ember'"
                >
                  {{ mostrarCredenciais ? 'Remover Login' : '+ Criar Login' }}
                </button>
              </div>

              <div class="flex gap-2 w-full min-w-0">
                <input 
                  v-model="novoNome"
                  type="text" 
                  placeholder="Nome do morador"
                  class="flex-grow min-w-0 w-full px-4 py-2.5 rounded-lg border border-stone bg-canvas outline-none font-bold text-charcoal focus:border-ember transition-all text-sm"
                  @keyup.enter="handleAdicionar"
                />
                <Button 
                  @click="handleAdicionar"
                  :disabled="!novoNome.trim() || !activeTenantId || (mostrarCredenciais && (!novoUsername.trim() || !novoPassword.trim()))"
                  class="shrink-0 h-11 px-4 sm:px-6 bg-ember text-white rounded-lg font-bold uppercase tracking-widest text-[10px]"
                >
                  Adicionar
                </Button>
              </div>

              <div v-show="mostrarCredenciais" class="grid grid-cols-2 gap-2 p-3 bg-parchment rounded-lg border border-stone/50">
                <input 
                  v-model="novoUsername"
                  type="text" 
                  placeholder="Usuário"
                  :disabled="!mostrarCredenciais"
                  class="px-3 py-2 rounded-md border border-stone bg-white outline-none font-bold text-charcoal focus:border-ember text-xs"
                />
                <input 
                  v-model="novoPassword"
                  type="password" 
                  placeholder="Senha"
                  :disabled="!mostrarCredenciais"
                  class="px-3 py-2 rounded-md border border-stone bg-white outline-none font-bold text-charcoal focus:border-ember text-xs"
                />
              </div>
            </div>
          </Card>

          <!-- Member List -->
          <div class="space-y-2">
            <div class="flex items-center justify-between px-1">
              <h4 class="text-[10px] font-bold uppercase tracking-widest text-ash">Moradores ({{ membros.length }})</h4>
            </div>
            
            <div class="grid gap-2">
              <div 
                v-for="membro in membros" 
                :key="membro.id"
                class="p-3 flex justify-between items-center bg-white border border-stone rounded-xl hover:border-ember/30 transition-all"
                :class="{ 'opacity-60 bg-canvas/50': !membro.ativo }"
              >
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full bg-parchment flex items-center justify-center font-display text-sm text-charcoal border border-stone">
                    {{ membro.nome[0] }}
                  </div>
                  <div>
                    <span class="text-sm font-bold text-charcoal leading-none">{{ membro.nome }}</span>
                    <p class="text-[9px] font-bold uppercase tracking-widest" :class="membro.ativo ? 'text-meadow' : 'text-ash'">
                      {{ membro.ativo ? 'Ativo' : 'Inativo' }}
                    </p>
                  </div>
                </div>
                
                <button 
                  @click="membro.ativo ? handleDesativar(membro.id) : handleAtivar(membro.id)"
                  :title="membro.ativo ? 'Desativar morador' : 'Reativar morador'"
                  class="w-8 h-8 flex items-center justify-center rounded-full border border-stone text-ash hover:border-coral hover:text-coral transition-all"
                >
                  <UserMinus v-if="membro.ativo" class="w-3.5 h-3.5" />
                  <UserCheck v-else class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            
            <div v-if="membros.length === 0" class="text-center py-10 bg-parchment border-2 border-dashed border-stone rounded-card">
              <p class="text-xs text-ash italic">Nenhum morador cadastrado.</p>
            </div>
          </div>
        </div> <!-- Fecha Aba 1 -->

        <!-- Conteúdo Aba 2: Cartões -->
        <div 
          class="col-start-1 row-start-1 transition-all duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] w-full min-w-0"
          :class="activeTab === 'cartoes' ? 'opacity-100 translate-y-0 z-10 delay-100' : 'opacity-0 translate-y-4 pointer-events-none z-0'"
        >
          <ConfiguracoesCartoes />
        </div>
      </div>
    </div>

    <!-- Footer Fixo (não rola) -->
    <div class="shrink-0 p-4 sm:px-8 sm:pb-8 border-t border-stone bg-white flex justify-end">
      <Button variant="secondary" class="w-full sm:w-auto" @click="emit('voltar')">Fechar</Button>
    </div>
  </div>
</template>
