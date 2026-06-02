<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useMembros } from '../../viewmodels/useMembros'
import { UserMinus, UserCheck, Users, CreditCard, Share2 } from 'lucide-vue-next'
import MembroAvatar from '../components/ui/MembroAvatar.vue'
import ConfiguracoesCartoes from '../components/ledger/ConfiguracoesCartoes.vue'
import Card from '../components/ui/Card.vue'
import Button from '../components/ui/Button.vue'
import { useCasasMultitenant } from '../../viewmodels/useCasasMultitenant'
import { useToast } from '../../composables/useToast'

const { membros, adicionarMembro, desativarMembro, ativarMembro, carregar } = useMembros()
const { activeTenantId, activeTenantObj, copyInviteCode, copiedCode } = useCasasMultitenant()
const toast = useToast()

const copied = computed(() => {
  if (!copiedCode) return false
  return copiedCode.value === getInviteLink()
})

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

let ultimoClique = 0
const toggleCredenciais = () => {
  const agora = Date.now()
  if (agora - ultimoClique < 250) return
  ultimoClique = agora
  mostrarCredenciais.value = !mostrarCredenciais.value
  if (!mostrarCredenciais.value) {
    novoUsername.value = ''
    novoPassword.value = ''
  }
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

const variants: ('ember' | 'meadow' | 'sky' | 'sunburst' | 'flamingo')[] = ['ember', 'sky', 'meadow', 'sunburst', 'flamingo']

const handleAdicionar = async () => {
  const nomeValido = !!novoNome.value.trim()
  const credenciaisValidas = !mostrarCredenciais.value || (!!novoUsername.value.trim() && !!novoPassword.value.trim())

  if (nomeValido && activeTenantId.value && credenciaisValidas) {
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
    <div class="shrink-0 space-y-6 px-4 pt-6 pb-4 sm:px-8 border-b border-stone/50 bg-white">
      <div class="flex items-center justify-between">
        <div class="space-y-2">
          <h2 class="text-3xl font-display text-charcoal">Ajustes <span class="text-ember">Gerais</span></h2>
        </div>
      </div>

      <div class="flex p-1.5 bg-parchment rounded-full w-full border border-stone">
        <button 
          @click="activeTab = 'membros'"
          class="flex-1 relative px-3 sm:px-6 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-[0.15em] transition-all duration-300 flex items-center justify-center gap-2.5 outline-none group border-none bg-transparent cursor-pointer"
          :class="activeTab === 'membros' ? 'text-charcoal' : 'text-ash hover:text-graphite'"
        >
          <div 
            class="absolute inset-0 bg-white shadow-subtle rounded-full transition-all duration-500 ease-spring"
            :class="activeTab === 'membros' ? 'opacity-100 scale-100' : 'opacity-0 scale-90'"
          />
          <Users 
            class="w-4 h-4 relative z-10 transition-colors duration-500 ease-spring" 
            :class="activeTab === 'membros' ? 'text-ember scale-110' : 'scale-100 group-hover:text-ember/50'" 
          />
          <span class="relative z-10">Moradores</span>
        </button>

        <button 
          @click="activeTab = 'cartoes'"
          class="flex-1 relative px-3 sm:px-6 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-[0.15em] transition-all duration-300 flex items-center justify-center gap-2.5 outline-none group border-none bg-transparent cursor-pointer"
          :class="activeTab === 'cartoes' ? 'text-charcoal' : 'text-ash hover:text-graphite'"
        >
          <div 
            class="absolute inset-0 bg-white shadow-subtle rounded-full transition-all duration-500 ease-spring"
            :class="activeTab === 'cartoes' ? 'opacity-100 scale-100' : 'opacity-0 scale-90'"
          />
          <CreditCard 
            class="w-4 h-4 relative z-10 transition-colors duration-500 ease-spring" 
            :class="activeTab === 'cartoes' ? 'text-ember scale-110' : 'scale-100 group-hover:text-ember/50'" 
          />
          <span class="relative z-10">Cartões</span>
        </button>
      </div>
    </div>

    <div class="flex-grow overflow-y-auto custom-scrollbar px-4 py-6 sm:px-8 space-y-6 min-w-0">
      <div class="grid relative items-start w-full min-w-0">
        <div 
          class="col-start-1 row-start-1 transition-all duration-500 ease-spring space-y-4 w-full min-w-0"
          :class="activeTab === 'membros' ? 'opacity-100 translate-y-0 z-10 delay-100 visible' : 'opacity-0 translate-y-4 pointer-events-none z-0 invisible max-h-0 overflow-hidden'"
        >
          <Card v-if="activeTenantObj" class="p-4 sm:p-5 bg-white border border-stone shadow-subtle rounded-2xl flex items-center gap-4 w-full min-w-0">
            <div class="w-12 h-12 shrink-0 rounded-xl bg-canvas shadow-subtle flex items-center justify-center text-ember">
              <Share2 class="w-5 h-5" />
            </div>
            <div class="flex-grow min-w-0">
              <p class="text-[10px] font-bold text-graphite uppercase tracking-widest leading-none mb-1.5">Link de Convite</p>
              <p class="text-xs font-bold text-charcoal truncate">{{ getInviteLink() }}</p>
            </div>
            <button 
              @click="handleCopyLink"
              class="shrink-0 h-10 px-5 rounded-pill font-bold uppercase tracking-widest text-[10px] transition-all border-none cursor-pointer active:scale-95"
              :class="copied ? 'bg-[#00a83d] text-white shadow-sm' : 'bg-charcoal text-white hover:bg-midnight'"
            >
              {{ copied ? 'Copiado!' : 'Copiar' }}
            </button>
          </Card>

          <Card class="p-6 bg-white border border-stone shadow-subtle rounded-2xl space-y-5">
            <div class="flex items-center justify-between">
              <h4 class="text-[10px] font-bold uppercase tracking-widest text-graphite ml-1">Novo Morador</h4>
              <button 
                @click="toggleCredenciais"
                class="text-[10px] font-bold uppercase tracking-widest hover:opacity-80 transition-opacity select-none border-none bg-transparent cursor-pointer"
                :class="mostrarCredenciais ? 'text-graphite' : 'text-ember'"
              >
                {{ mostrarCredenciais ? '− Ocultar Login' : '+ Gerar Acesso' }}
              </button>
            </div>

            <div class="flex gap-2 w-full min-w-0">
              <input 
                v-model="novoNome"
                type="text" 
                placeholder="Ex: Luana Oliveira"
                class="flex-grow min-w-0 w-full px-4 py-3 rounded-xl border border-stone bg-canvas outline-none font-bold text-charcoal focus:border-ember transition-all text-sm"
                @keyup.enter="handleAdicionar"
              />
              <Button 
                @click="handleAdicionar"
                :disabled="!novoNome.trim() || !activeTenantId || (mostrarCredenciais && (!novoUsername.trim() || !novoPassword.trim()))"
                class="shrink-0 h-11 px-6 bg-ember text-white rounded-xl font-bold uppercase tracking-widest text-[10px]"
              >
                Adicionar
              </Button>
            </div>

            <Transition name="fade-slide">
              <div v-show="mostrarCredenciais" class="grid grid-cols-2 gap-3 p-4 bg-parchment rounded-xl border border-stone/50 shadow-subtle">
                <div class="space-y-1">
                  <label class="text-[8px] font-bold uppercase text-graphite tracking-widest ml-1">Usuário</label>
                  <input 
                    v-model="novoUsername"
                    type="text" 
                    placeholder="luana.ol"
                    :disabled="!mostrarCredenciais"
                    class="w-full px-3 py-2.5 rounded-lg border border-stone bg-white outline-none font-bold text-charcoal focus:border-ember text-xs"
                  />
                </div>
                <div class="space-y-1">
                  <label class="text-[8px] font-bold uppercase text-graphite tracking-widest ml-1">Senha</label>
                  <input 
                    v-model="novoPassword"
                    type="password" 
                    placeholder="••••••••"
                    :disabled="!mostrarCredenciais"
                    class="w-full px-3 py-2.5 rounded-lg border border-stone bg-white outline-none font-bold text-charcoal focus:border-ember text-xs"
                  />
                </div>
              </div>
            </Transition>
          </Card>

          <div class="space-y-3">
            <div class="flex items-center justify-between px-1">
              <h4 class="text-[10px] font-bold uppercase tracking-widest text-graphite">Moradores ({{ membros.length }})</h4>
            </div>
            
            <div class="grid gap-3">
              <div 
                v-for="(membro, idx) in membros" 
                :key="membro.id"
                class="p-4 flex justify-between items-center bg-white border border-stone rounded-2xl hover:border-ember/30 transition-all duration-300 group"
                :class="{ 'opacity-60 bg-canvas/30 grayscale-[0.5]': !membro.ativo }"
              >
                <div class="flex items-center gap-4">
                  <MembroAvatar :nome="membro.nome" :variant="variants[idx % variants.length]" size="md" />
                  <div>
                    <span class="text-sm font-bold text-charcoal leading-none block">{{ membro.nome }}</span>
                    <p class="text-[9px] font-bold uppercase tracking-[0.2em] mt-1" :class="membro.ativo ? 'text-[#00a83d]' : 'text-ash'">
                      {{ membro.ativo ? 'Ativo na casa' : 'Desativado' }}
                    </p>
                  </div>
                </div>
                
                <button 
                  @click="membro.ativo ? handleDesativar(membro.id) : handleAtivar(membro.id)"
                  :title="membro.ativo ? 'Desativar morador' : 'Reativar morador'"
                  class="w-10 h-10 flex items-center justify-center rounded-full border border-stone bg-transparent text-ash hover:border-coral hover:text-coral hover:bg-coral/5 transition-all cursor-pointer active:scale-90"
                >
                  <UserMinus v-if="membro.ativo" class="w-4 h-4" />
                  <UserCheck v-else class="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div v-if="membros.length === 0" class="text-center py-12 border border-dashed border-stone rounded-2xl bg-canvas/30 animate-in fade-in">
              <p class="text-sm text-graphite font-bold italic opacity-40">Nenhum morador cadastrado ainda.</p>
            </div>
          </div>
        </div>

        <div 
          class="col-start-1 row-start-1 transition-all duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] w-full min-w-0"
          :class="activeTab === 'cartoes' ? 'opacity-100 translate-y-0 z-10 delay-100 visible' : 'opacity-0 translate-y-4 pointer-events-none z-0 invisible max-h-0 overflow-hidden'"
        >
          <ConfiguracoesCartoes />
        </div>
      </div>
    </div>

    <div class="shrink-0 p-4 sm:px-8 sm:pb-8 border-t border-stone bg-white flex justify-end">
      <Button variant="secondary" class="w-full sm:w-auto" @click="emit('voltar')">Fechar</Button>
    </div>
  </div>
</template>
