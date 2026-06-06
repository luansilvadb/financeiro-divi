<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useMembros } from '../../viewmodels/useMembros'
import { useCargos } from '../../viewmodels/useCargos'
import { User, LogOut, Users, ChevronRight, ChevronDown, Plus, Trash2, Shield, Key } from 'lucide-vue-next'
import MembroAvatar from '../components/ui/MembroAvatar.vue'
import ConfiguracoesCartoes from '../components/ledger/ConfiguracoesCartoes.vue'
import Card from '../components/ui/Card.vue'
import Button from '../components/ui/Button.vue'
import { useCasasMultitenant } from '../../viewmodels/useCasasMultitenant'
import { useToast } from '../../composables/useToast'
import { Membro, type MembroRole } from '../../models/entities/Membro'
import BottomSheet from '../components/ui/BottomSheet.vue'

const { 
  membros, 
  adicionarMembro, 
  desativarMembro, 
  ativarMembro, 
  atualizarCargoMembro,
  carregar, 
  currentMembro 
} = useMembros()

const {
  cargos,
  salvarCargo,
  excluirCargo,
  inicializar: inicializarCargos
} = useCargos()

const { activeTenantId } = useCasasMultitenant()
const toast = useToast()

const novoNome = ref('')
const novoUsername = ref('')
const novoPassword = ref('')
const formularioAberto = ref(false)
const novoMembroFormAberto = ref(false)

const toggleFormulario = () => {
  formularioAberto.value = !formularioAberto.value
  if (formularioAberto.value) {
    cargoFormAberto.value = false
  } else {
    novoNome.value = ''
    novoUsername.value = ''
    novoPassword.value = ''
    novoMembroFormAberto.value = false
  }
}

const toggleNovoMembroForm = () => {
  novoMembroFormAberto.value = !novoMembroFormAberto.value
  if (!novoMembroFormAberto.value) {
    novoNome.value = ''
    novoUsername.value = ''
    novoPassword.value = ''
  }
}

const abrirNovoMembroForm = () => {
  novoNome.value = ''
  novoUsername.value = ''
  novoPassword.value = ''
  novoMembroFormAberto.value = true
}

const fecharBottomSheetNovoMembro = () => {
  novoMembroFormAberto.value = false
  novoNome.value = ''
  novoUsername.value = ''
  novoPassword.value = ''
}

// Controle do formulário de Cargos
const cargoFormAberto = ref(false)
const novoCargoFormAberto = ref(false)
const cargoSendoEditadoId = ref<string | null>(null)
const novoCargoNome = ref('')
const novoCargoCor = ref('#ef4444')
const novasPermissoes = ref<string[]>([])
const coresPredefinidas = [
  { hex: '#ef4444', name: 'ember' },
  { hex: '#3b82f6', name: 'sky' },
  { hex: '#10b981', name: 'meadow' },
  { hex: '#f59e0b', name: 'sunburst' },
  { hex: '#ec4899', name: 'flamingo' },
  { hex: '#8b5cf6', name: 'amethyst' }
]

const toggleCargoForm = () => {
  cargoFormAberto.value = !cargoFormAberto.value
  if (cargoFormAberto.value) {
    formularioAberto.value = false
  } else {
    novoCargoNome.value = ''
    novoCargoCor.value = '#ef4444'
    novasPermissoes.value = []
    cargoSendoEditadoId.value = null
    novoCargoFormAberto.value = false
    mostrarBottomSheetPermissoesCargo.value = false
  }
}

const abrirNovoCargoForm = () => {
  cargoSendoEditadoId.value = null
  novoCargoNome.value = ''
  novoCargoCor.value = '#ef4444'
  novasPermissoes.value = []
  novoCargoFormAberto.value = true
}

const fecharBottomSheetCargo = () => {
  novoCargoFormAberto.value = false
  cargoSendoEditadoId.value = null
  novoCargoNome.value = ''
  novoCargoCor.value = '#ef4444'
  novasPermissoes.value = []
  mostrarBottomSheetPermissoesCargo.value = false
}

const mostrarBottomSheetPermissoesCargo = ref(false)
const confirmarExclusaoCargo = ref(false)

const abrirBottomSheetPermissoesCargo = () => {
  mostrarBottomSheetPermissoesCargo.value = true
}

const fecharBottomSheetPermissoesCargo = () => {
  mostrarBottomSheetPermissoesCargo.value = false
  confirmarExclusaoCargo.value = false
}


const iniciarEdicaoCargo = (cargo: any) => {
  cargoSendoEditadoId.value = cargo.id
  novoCargoNome.value = cargo.nome
  novoCargoCor.value = cargo.cor || '#ef4444'
  novasPermissoes.value = [...cargo.permissoes]
  novoCargoFormAberto.value = true
}


const toggleNovaPermissao = (permissao: string) => {
  const index = novasPermissoes.value.indexOf(permissao)
  if (index > -1) {
    novasPermissoes.value.splice(index, 1)
  } else {
    novasPermissoes.value.push(permissao)
  }
}

const handleCriarCargo = async () => {
  if (!novoCargoNome.value.trim() || !activeTenantId.value) return
  const isEdicao = !!cargoSendoEditadoId.value
  try {
    await salvarCargo(
      novoCargoNome.value.trim(), 
      novasPermissoes.value, 
      novoCargoCor.value,
      cargoSendoEditadoId.value || undefined
    )
    fecharBottomSheetCargo()
    toast.show(isEdicao ? 'Cargo atualizado com sucesso' : 'Cargo criado com sucesso', 'success')
  } catch (error: any) {
    toast.show(error.message || (isEdicao ? 'Erro ao atualizar cargo' : 'Erro ao criar cargo'), 'error')
  }
}

const cargoSendoEditado = computed(() => {
  if (!cargoSendoEditadoId.value) return null
  return cargos.value.find(c => c.id === cargoSendoEditadoId.value) || null
})

const handleExcluirCargoDoBottomSheet = () => {
  confirmarExclusaoCargo.value = true
}

const handleExcluirCargoConfirmado = async () => {
  if (!cargoSendoEditadoId.value) return
  const idExcluir = cargoSendoEditadoId.value
  try {
    await excluirCargo(idExcluir)
    toast.show('Cargo excluído com sucesso', 'success')
    fecharBottomSheetPermissoesCargo()
    fecharBottomSheetCargo()
  } catch (error: any) {
    toast.show(error.message || 'Erro ao excluir cargo', 'error')
  }
}

onMounted(async () => {
  if (activeTenantId.value) {
    try {
      await Promise.all([
        carregar(),
        inicializarCargos()
      ])
    } catch (e) {
      console.error('Erro ao carregar dados na tela de ajustes', e)
    }
  }
})

const activeTab = ref<'perfil' | 'casa'>('perfil')
const emit = defineEmits(['voltar', 'logout'])

const handleLogoutClick = () => {
  emit('logout')
}

const localStorageUsername = computed(() => {
  return localStorage.getItem('divi_username') || ''
})

const variants: ('ember' | 'meadow' | 'sky' | 'sunburst' | 'flamingo')[] = ['ember', 'sky', 'meadow', 'sunburst', 'flamingo']

// Gerenciamento do Bottom Sheet de Edição de Membro
const membroSelecionado = ref<Membro | null>(null)
const mostrarBottomSheet = ref(false)
const cargoSelecionadoId = ref<string | 'ADMIN'>('ADMIN')
const ativoSelecionado = ref(true)
const salvando = ref(false)

const abrirEdicaoMembro = (membro: Membro) => {
  membroSelecionado.value = membro
  ativoSelecionado.value = membro.ativo
  if (membro.role === 'ADMIN') {
    cargoSelecionadoId.value = 'ADMIN'
  } else {
    cargoSelecionadoId.value = membro.cargoId || ''
  }
  mostrarBottomSheet.value = true
}

const fecharBottomSheet = () => {
  membroSelecionado.value = null
  mostrarBottomSheet.value = false
}

watch(mostrarBottomSheet, (val) => {
  if (!val) {
    membroSelecionado.value = null
  }
})

const ehUnicoAdmin = computed(() => {
  if (!membroSelecionado.value || membroSelecionado.value.role !== 'ADMIN') return false
  const adminsAtivos = membros.value.filter(m => m.role === 'ADMIN' && m.ativo)
  return adminsAtivos.length <= 1
})

const ehUsuarioLogado = computed(() => {
  if (!membroSelecionado.value || !currentMembro.value) return false
  return membroSelecionado.value.id === currentMembro.value.id
})

const podeEditarRole = computed(() => {
  if (currentMembro.value?.role !== 'ADMIN') return false
  if (ehUsuarioLogado.value) return false
  return true
})

const podeEditarStatus = computed(() => {
  if (currentMembro.value?.role !== 'ADMIN') return false
  if (ehUsuarioLogado.value) return false
  if (ehUnicoAdmin.value) return false
  return true
})

const permissoesDisponiveis = [
  { chave: 'lancamentos', label: 'Lançar gastos e despesas', desc: 'Registrar compras e dividir custos' },
  { chave: 'cartoes_proprios', label: 'Gerenciar cartões próprios', desc: 'Criar e editar cartões vinculados' },
  { chave: 'cartoes_casa', label: 'Usar cartões da casa', desc: 'Compras com cartões de outros moradores' },
  { chave: 'gerenciar_membros', label: 'Gerenciar moradores e cargos', desc: 'Adicionar, remover e editar membros' },
  { chave: 'fechar_faturas', label: 'Fechar faturas e conciliar', desc: 'Encerrar ciclos e confirmar pagamentos' }
]

const handleSalvarEdicao = async () => {
  if (!membroSelecionado.value) return
  salvando.value = true
  try {
    const isSelectingAdmin = cargoSelecionadoId.value === 'ADMIN'
    const finalRole: MembroRole = isSelectingAdmin ? 'ADMIN' : 'MORADOR'
    const finalCargoId = isSelectingAdmin ? null : cargoSelecionadoId.value || null

    if (finalRole !== membroSelecionado.value.role || finalCargoId !== membroSelecionado.value.cargoId) {
      await atualizarCargoMembro(membroSelecionado.value.id, finalRole, finalCargoId || undefined)
    }

    if (ativoSelecionado.value !== membroSelecionado.value.ativo) {
      if (ativoSelecionado.value) {
        await ativarMembro(membroSelecionado.value.id)
      } else {
        await desativarMembro(membroSelecionado.value.id)
      }
    }
    toast.show('Membro atualizado com sucesso', 'success')
    fecharBottomSheet()
  } catch (error: any) {
    toast.show(error.message || 'Erro ao atualizar membro', 'error')
  } finally {
    salvando.value = false
  }
}

const handleAdicionar = async () => {
  const nomeValido = !!novoNome.value.trim()
  const usernameValido = !!novoUsername.value.trim()
  const passwordValido = !!novoPassword.value.trim()

  if (nomeValido && usernameValido && passwordValido && activeTenantId.value) {
  try {
    await adicionarMembro(
      novoNome.value.trim(), 
      novoUsername.value.trim(),
      novoPassword.value.trim()
    )
    fecharBottomSheetNovoMembro()
    toast.show('Morador adicionado com sucesso', 'success')
  } catch (error: any) {
    toast.show(error.message || 'Erro ao adicionar morador', 'error')
  }
  }
  }
</script>

<template>
  <div class="flex flex-col flex-grow h-full min-h-0 w-full overflow-hidden text-graphite bg-canvas">
    <div class="shrink-0 space-y-6 px-4 pt-8 pb-6 sm:px-8 border-b border-stone/30 bg-canvas/80 backdrop-blur-md sticky top-0 z-20">
      <div class="flex items-center justify-between">
        <div class="space-y-1">
          <h2 class="text-display text-4xl sm:text-5xl text-charcoal">
            Perfil do <span class="text-ember">Usuário</span>
          </h2>
          <p class="text-caption text-ash tracking-[0.2em]">Configurações e Segurança</p>
        </div>
      </div>

      <!-- Floating Island Navigation -->
      <div class="flex p-1.5 bg-white/60 backdrop-blur-xl rounded-pill w-full border border-stone shadow-sm relative overflow-hidden">
        <button 
          @click="activeTab = 'perfil'"
          class="flex-1 relative px-3 sm:px-6 py-3 rounded-pill text-[10px] font-bold uppercase tracking-[0.15em] transition-all duration-500 flex items-center justify-center gap-2.5 outline-none group border-none bg-transparent cursor-pointer z-10"
          :class="activeTab === 'perfil' ? 'text-charcoal' : 'text-ash hover:text-graphite'"
        >
          <User 
            class="w-4 h-4 transition-all duration-500 ease-spring" 
            :class="activeTab === 'perfil' ? 'text-ember scale-110' : 'scale-100 group-hover:text-ember/50'" 
          />
          <span>Meu Perfil</span>
        </button>

        <button 
          @click="activeTab = 'casa'"
          class="flex-1 relative px-3 sm:px-6 py-3 rounded-pill text-[10px] font-bold uppercase tracking-[0.15em] transition-all duration-500 flex items-center justify-center gap-2.5 outline-none group border-none bg-transparent cursor-pointer z-10"
          :class="activeTab === 'casa' ? 'text-charcoal' : 'text-ash hover:text-graphite'"
        >
          <Users 
            class="w-4 h-4 transition-all duration-500 ease-spring" 
            :class="activeTab === 'casa' ? 'text-ember scale-110' : 'scale-100 group-hover:text-ember/50'" 
          />
          <span>Moradores</span>
        </button>

        <!-- Active Tab Indicator (Glow Effect) -->
        <div 
          class="absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-white shadow-subtle rounded-pill transition-all duration-500 ease-spring border border-stone/50"
          :style="{ transform: `translateX(${activeTab === 'perfil' ? '0' : '100%'})` }"
        />
      </div>
    </div>

    <div class="flex-grow overflow-y-auto custom-scrollbar px-4 py-8 sm:px-8 space-y-8 min-w-0 bg-canvas">
      <Transition name="tab-fade" mode="out-in">
        <div v-if="activeTab === 'perfil'" class="space-y-6 w-full min-w-0">
          <Card class="p-6 bg-white border border-stone shadow-subtle rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-6 group/profile">
            <div class="flex items-center gap-5">
              <MembroAvatar 
                v-if="currentMembro" 
                :nome="currentMembro.nome" 
                variant="ember" 
                size="lg" 
                class="ring-4 ring-ember/5"
              />
              <div class="w-16 h-16 shrink-0 rounded-full bg-stone flex items-center justify-center text-ash font-bold" v-else>
                U
              </div>
              <div>
                <h3 class="text-xl font-bold text-charcoal leading-snug tracking-tight">{{ currentMembro?.nome || 'Usuário Divi' }}</h3>
                <p class="text-xs text-ash font-bold uppercase tracking-widest mt-0.5">@{{ localStorageUsername || 'usuario' }}</p>
              </div>
            </div>
            
            <button 
              @click="handleLogoutClick"
              class="shrink-0 h-11 px-6 rounded-pill font-bold uppercase tracking-widest text-[9px] transition-all duration-300 border border-stone bg-canvas text-ash hover:border-coral hover:text-coral hover:bg-coral/5 cursor-pointer active:scale-90 flex items-center gap-2.5 group/logout shadow-sm"
            >
              <LogOut class="w-4 h-4 group-hover/logout:-translate-x-0.5 transition-transform" />
              <span>Sair da Conta</span>
            </button>
          </Card>

          <ConfiguracoesCartoes />
        </div>

        <div v-else-if="activeTab === 'casa'" class="space-y-6 w-full min-w-0 pb-12">
          <!-- Card de Moradores -->
          <div class="bg-white border border-stone/30 rounded-[32px] shadow-subtle overflow-hidden">
            <div class="px-6 pt-6 pb-2">
              <h3 class="text-heading-sm text-charcoal flex items-center gap-2">
                <Users class="w-5 h-5 text-ember" />
                Gestão de Moradores
              </h3>
              <p class="text-[11px] text-ash font-medium mt-1 uppercase tracking-wider">Membros com acesso à casa</p>
            </div>

            <div class="p-4 space-y-3">
              <div class="flex justify-center pb-2">
                <Button 
                  @click="abrirNovoMembroForm"
                  variant="primary"
                  class="w-full"
                >
                  <Plus class="w-5 h-5 mr-2" />
                  Adicionar Morador
                </Button>
              </div>

              <!-- Lista de Moradores -->
              <div class="space-y-2">
                <div 
                  v-for="(membro, idx) in membros" 
                  :key="membro.id"
                  @click="abrirEdicaoMembro(membro)"
                  class="p-4 flex justify-between items-center bg-canvas/50 border border-stone/50 rounded-2xl hover:border-ember/40 transition-all duration-500 group cursor-pointer active:scale-[0.98]"
                  :class="{ 'opacity-60 grayscale-[0.5]': !membro.ativo }"
                >
                  <div class="flex items-center gap-4 min-w-0">
                    <MembroAvatar :nome="membro.nome" :variant="variants[idx % variants.length]" size="sm" />
                    <div class="min-w-0">
                      <span class="text-sm font-bold text-charcoal leading-none block truncate">{{ membro.nome }}</span>
                      <p class="text-caption text-[9px] mt-1" :class="membro.ativo ? 'text-meadow' : 'text-ash'">
                        {{ membro.ativo ? 'Ativo na Casa' : 'Acesso Suspenso' }}
                      </p>
                    </div>
                  </div>
                  
                  <div class="flex items-center gap-3 shrink-0">
                    <span 
                      v-if="membro.role === 'ADMIN'"
                      class="px-2.5 py-1 rounded-pill text-[9px] font-bold bg-ember/10 text-ember uppercase tracking-widest border border-ember/20"
                    >
                      Admin
                    </span>
                    <span 
                      v-else-if="membro.cargo"
                      class="px-2.5 py-1 rounded-pill text-[9px] font-bold uppercase tracking-widest border"
                      :style="{ backgroundColor: (membro.cargo.cor || '#474645') + '10', color: membro.cargo.cor || '#474645', borderColor: (membro.cargo.cor || '#474645') + '20' }"
                    >
                      {{ membro.cargo.nome }}
                    </span>
                    <ChevronRight class="w-4 h-4 text-ash group-hover:text-charcoal group-hover:translate-x-1 transition-all" />
                  </div>
                </div>

                <div v-if="membros.length === 0" class="flex flex-col items-center justify-center py-12 px-6 text-center space-y-4 animate-in fade-in zoom-in-95 duration-700">
                  <IllustrationMascot variant="sky" :size="80" mood="chill" class="opacity-40" />
                  <p class="text-xs text-ash font-bold italic max-w-[200px] leading-relaxed">
                    Sua casa parece vazia... Que tal convidar alguém?
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Card de Cargos -->
          <div 
            v-if="currentMembro?.role === 'ADMIN'"
            class="bg-white border border-stone/30 rounded-[32px] shadow-subtle overflow-hidden"
          >
            <div class="px-6 pt-6 pb-2">
              <h3 class="text-heading-sm text-charcoal flex items-center gap-2">
                <Shield class="w-5 h-5 text-ember" />
                Cargos e Permissões
              </h3>
              <p class="text-[11px] text-ash font-medium mt-1 uppercase tracking-wider">Definição de níveis de acesso</p>
            </div>

            <div class="p-4 space-y-4">
              <div class="flex justify-center pb-2">
                <Button 
                  @click="abrirNovoCargoForm"
                  variant="secondary"
                  class="w-full"
                >
                  <Plus class="w-5 h-5 mr-2" />
                  Novo Cargo
                </Button>
              </div>

              <div class="space-y-2">
                <div 
                  v-for="cargo in cargos" 
                  :key="cargo.id"
                  @click="iniciarEdicaoCargo(cargo)"
                  class="flex items-center justify-between p-4 rounded-2xl bg-canvas/50 border border-stone/50 transition-all duration-500 hover:border-ember/40 cursor-pointer active:scale-[0.98] group"
                >
                  <div class="flex items-center gap-4 min-w-0">
                    <div 
                      class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-transform duration-500 group-hover:scale-110"
                      :style="{ backgroundColor: (cargo.cor || '#474645') + '15', borderColor: (cargo.cor || '#474645') + '30' }"
                    >
                      <Shield class="w-5 h-5" :style="{ color: cargo.cor || '#474645' }" />
                    </div>
                    <div class="min-w-0">
                      <div class="flex items-center gap-2">
                        <span class="text-sm font-bold text-charcoal truncate">{{ cargo.nome }}</span>
                        <span class="text-[9px] font-bold text-ash uppercase tracking-tighter">
                          {{ cargo.totalMembros || 0 }} {{ (cargo.totalMembros || 0) === 1 ? 'membro' : 'membros' }}
                        </span>
                      </div>
                      <p class="text-[10px] text-ash mt-1 truncate italic">
                        {{ cargo.permissoes.length === 0 
                          ? 'Sem permissões' 
                          : cargo.permissoes.map(p => permissoesDisponiveis.find(pd => pd.chave === p)?.label).filter(Boolean).join(' · ') 
                        }}
                      </p>
                    </div>
                  </div>
                  <ChevronRight class="w-4 h-4 text-ash group-hover:text-charcoal group-hover:translate-x-1 transition-all" />
                </div>

                <div v-if="cargos.length === 0" class="flex flex-col items-center justify-center py-12 px-6 text-center space-y-4 animate-in fade-in zoom-in-95 duration-700">
                  <IllustrationMascot variant="flamingo" :size="80" mood="surprised" class="opacity-40" />
                  <p class="text-xs text-ash font-bold italic max-w-[200px] leading-relaxed">
                    Nenhum cargo personalizado criado ainda.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </div>

    <div class="shrink-0 p-6 sm:px-8 sm:pb-8 border-t border-stone/30 bg-white">
      <Button variant="secondary" class="w-full" @click="emit('voltar')">Fechar</Button>
    </div>

    <!-- Bottom Sheet de Edição de Membros (Mobile-first) -->
    <BottomSheet 
      v-model="mostrarBottomSheet"
      :show-close="true"
      max-height="90dvh"
      min-height="75dvh"
      width-class="md:w-[560px]"
    >
      <template #header>
        <div class="flex items-center gap-3 w-full pr-8">
          <MembroAvatar 
            v-if="membroSelecionado"
            :nome="membroSelecionado.nome"
            :variant="variants[membros.findIndex(m => m.id === membroSelecionado?.id) % variants.length]"
            size="md"
          />
          <div class="flex-1 min-w-0">
            <h3 class="text-base font-bold text-charcoal leading-tight truncate">{{ membroSelecionado?.nome }}</h3>
            <div class="flex items-center gap-1.5 mt-0.5">
              <span 
                v-if="membroSelecionado?.role === 'ADMIN'"
                class="px-2 py-0.5 rounded-full text-[8px] font-bold bg-ember/10 text-ember uppercase tracking-widest"
              >
                Admin
              </span>
              <span 
                v-else-if="membroSelecionado?.cargo"
                class="px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest"
                :style="{ backgroundColor: (membroSelecionado.cargo.cor || '#292524') + '15', color: membroSelecionado.cargo.cor || '#292524' }"
              >
                {{ membroSelecionado.cargo.nome }}
              </span>
              <span 
                v-else
                class="px-2 py-0.5 rounded-full text-[8px] font-bold bg-stone text-ash uppercase tracking-widest"
              >
                Sem Cargo
              </span>
              <span class="text-[9px] text-ash font-medium" v-if="membroSelecionado?.userId">· Conectado</span>
              <span class="text-[9px] text-ash font-medium italic" v-else>· Sem conta</span>
            </div>
          </div>
        </div>
      </template>

      <!-- Conteúdo Rolável -->
      <div class="px-6 pt-5 pb-4 space-y-5 overflow-y-auto flex-grow custom-scrollbar min-h-0">
        <!-- Seleção de Cargo -->
        <div class="space-y-2">
          <label class="text-[10px] font-bold uppercase tracking-widest text-graphite block ml-1">Cargo e Nível de Acesso</label>
          <div class="space-y-2">
            <!-- Opção Especial: Administrador -->
            <label 
              class="flex items-start gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer bg-white"
              :class="cargoSelecionadoId === 'ADMIN' ? 'border-ember bg-ember/5' : 'border-stone hover:bg-parchment/30'"
            >
              <input 
                type="radio" 
                v-model="cargoSelecionadoId" 
                value="ADMIN"
                :disabled="!podeEditarRole"
                class="mt-1 accent-ember cursor-pointer"
              />
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <span class="text-xs font-bold text-charcoal">Administrador</span>
                  <span class="px-2 py-0.5 rounded-full text-[8px] font-bold bg-ember/10 text-ember uppercase tracking-widest">Admin</span>
                </div>
                <p class="text-[10px] text-ash mt-0.5 leading-snug">Acesso total irrestrito a todas as configurações, cartões, faturas e membros.</p>
              </div>
            </label>

            <!-- Cargos Dinâmicos -->
            <label 
              v-for="cargo in cargos"
              :key="cargo.id"
              class="flex items-start gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer bg-white"
              :class="cargoSelecionadoId === cargo.id ? 'border-charcoal bg-parchment/10' : 'border-stone hover:bg-parchment/30'"
              :style="cargoSelecionadoId === cargo.id ? { borderColor: cargo.cor || '#292524', backgroundColor: (cargo.cor || '#292524') + '08' } : {}"
            >
              <input 
                type="radio" 
                v-model="cargoSelecionadoId" 
                :value="cargo.id"
                :disabled="!podeEditarRole"
                class="mt-1 cursor-pointer"
                :style="{ accentColor: cargo.cor || '#292524' }"
              />
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <span class="text-xs font-bold text-charcoal">{{ cargo.nome }}</span>
                  <span 
                    class="px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest animate-in fade-in"
                    :style="{ backgroundColor: (cargo.cor || '#292524') + '15', color: cargo.cor || '#292524' }"
                  >
                    {{ cargo.nome }}
                  </span>
                </div>
                <p class="text-[10px] text-ash mt-0.5 leading-snug">
                  Permissões: {{ cargo.permissoes.map(p => permissoesDisponiveis.find(pd => pd.chave === p)?.label).join(', ') || 'Nenhuma permissão' }}
                </p>
              </div>
            </label>

            <!-- Opção Fallback se Sem Cargo -->
            <label 
              v-if="cargos.length === 0"
              class="flex items-start gap-3 p-3.5 rounded-2xl border transition-all border-dashed border-stone bg-white"
            >
              <div class="flex-1 text-center py-2">
                <p class="text-xs text-ash font-bold italic">Nenhum cargo dinâmico disponível. Crie um cargo em "Gerenciar Cargos".</p>
              </div>
            </label>
          </div>
          
          <p class="text-[9px] text-ash font-medium ml-1 leading-snug" v-if="ehUsuarioLogado">
            Você não pode alterar seu próprio cargo para evitar a perda do seu acesso administrativo.
          </p>
          <p class="text-[9px] text-ash font-medium ml-1 leading-snug" v-else-if="currentMembro?.role !== 'ADMIN'">
            Apenas membros com papel de Administrador podem alterar as permissões.
          </p>
        </div>

        <!-- As permissões agora são gerenciadas e editadas exclusivamente a partir da aba Gerenciar Cargos -->

        <!-- Alterar Ativação do Membro (Switch Clicável se Autorizado) -->
        <div class="flex items-center justify-between p-4 bg-parchment border border-stone rounded-2xl gap-4">
          <div class="space-y-1">
            <span class="text-xs font-bold text-charcoal leading-none block">Morador Ativo na Casa</span>
            <p class="text-[9px] text-ash font-medium leading-snug" v-if="ehUsuarioLogado">
              Você não pode desativar o seu próprio perfil logado.
            </p>
            <p class="text-[9px] text-ash font-medium leading-snug" v-else-if="ehUnicoAdmin">
              Você não pode desativar o único administrador ativo desta casa.
            </p>
            <p class="text-[9px] text-ash font-medium leading-snug" v-else-if="currentMembro?.role !== 'ADMIN'">
              Apenas administradores podem ativar ou desativar membros.
            </p>
          </div>
          <button 
            id="toggle-membro-ativo"
            type="button"
            @click="ativoSelecionado = !ativoSelecionado"
            :disabled="!podeEditarStatus"
            class="w-11 h-6 flex items-center rounded-full p-0.5 transition-colors duration-300 cursor-pointer border-none disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            :class="ativoSelecionado ? 'bg-[#00a83d]' : 'bg-stone'"
          >
            <div 
              class="bg-white w-5 h-5 rounded-full shadow-subtle transform transition-transform duration-300"
              :class="ativoSelecionado ? 'translate-x-5' : 'translate-x-0'"
            />
          </button>
        </div>
      </div>

      <!-- Botões de Ação Fixos no Rodapé -->
      <div class="shrink-0 flex gap-2.5 px-6 py-4 border-t border-stone/60 bg-card">
        <button 
          type="button"
          @click="fecharBottomSheet"
          class="flex-1 h-12 bg-white border border-stone rounded-xl text-ash font-bold uppercase tracking-widest text-[10px] cursor-pointer hover:border-graphite active:scale-95 transition-all"
        >
          Cancelar
        </button>
        <button 
          type="button"
          @click="handleSalvarEdicao"
          :disabled="salvando || (!podeEditarRole && !podeEditarStatus) || (cargoSelecionadoId === (membroSelecionado?.role === 'ADMIN' ? 'ADMIN' : membroSelecionado?.cargoId) && ativoSelecionado === membroSelecionado?.ativo)"
          class="flex-1 h-12 bg-ember text-white border-none rounded-xl font-bold uppercase tracking-widest text-[10px] cursor-pointer hover:bg-coral active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {{ salvando ? 'Salvando...' : 'Salvar Alterações' }}
        </button>
      </div>
    </BottomSheet>

    <!-- Bottom Sheet de Cadastro/Edição de Cargo -->
    <BottomSheet 
      v-model="novoCargoFormAberto"
      :show-close="true"
      max-height="90dvh"
      min-height="75dvh"
      width-class="md:w-[560px]"
    >
      <template #header>
        <div class="flex items-center gap-3 w-full pr-8">
          <div 
            class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-300"
            :style="{ backgroundColor: novoCargoCor + '20' }"
          >
            <Shield class="w-5 h-5" :style="{ color: novoCargoCor }" />
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="text-base font-bold text-charcoal leading-tight">
              {{ cargoSendoEditadoId ? 'Editar Cargo' : 'Novo Cargo Personalizado' }}
            </h3>
            <p class="text-[10px] text-ash font-medium mt-0.5 truncate">
              Configure as permissões e a cor do cargo
            </p>
          </div>
        </div>
      </template>

      <!-- Conteúdo do Formulário de Cargo -->
      <div class="px-6 pt-5 pb-4 space-y-6 overflow-y-auto flex-grow custom-scrollbar min-h-0">
        <!-- Nome do Cargo -->
        <div class="space-y-2">
          <label class="block text-[10px] font-bold uppercase text-graphite tracking-widest ml-1">Nome do Cargo</label>
          <input
            v-model="novoCargoNome"
            type="text"
            placeholder="Ex: Financeiro, Consultor, etc."
            class="w-full px-4 py-3.5 rounded-xl border border-stone bg-canvas outline-none font-bold text-charcoal focus:border-ember transition-all text-sm"
          />
        </div>

        <!-- Seletor de Cor -->
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
              :title="cor.name"
            >
              <span 
                v-if="novoCargoCor === cor.hex"
                class="text-white text-xs font-bold leading-none"
              >✓</span>
            </button>
          </div>
        </div>

        <!-- Seleção de Permissões -->
        <div class="space-y-2">
          <label class="block text-[10px] font-bold uppercase text-graphite tracking-widest ml-1">Permissões do Cargo</label>
          <button
            type="button"
            data-testid="configurar-permissoes-cargo"
            @click="abrirBottomSheetPermissoesCargo"
            class="w-full flex items-center justify-between p-4 bg-parchment/30 border border-stone rounded-2xl hover:border-ember transition-colors cursor-pointer text-left group"
          >
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-ember/10 text-ember flex items-center justify-center shrink-0 group-hover:bg-ember group-hover:text-white transition-colors duration-200">
                <Key class="w-5 h-5" />
              </div>
              <div>
                <p class="text-xs font-bold text-charcoal leading-none">Configurar Permissões</p>
                <p class="text-[10px] mt-1">
                  <span v-if="novasPermissoes.length > 0" class="text-[#00a83d] font-bold">
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

      <!-- Rodapé com Botões -->
      <div class="shrink-0 flex gap-2.5 px-6 py-4 border-t border-stone/60 bg-card">
        <button 
          type="button"
          @click="fecharBottomSheetCargo"
          class="flex-1 h-12 bg-white border border-stone rounded-xl text-ash font-bold uppercase tracking-widest text-[10px] cursor-pointer hover:border-graphite active:scale-95 transition-all"
        >
          Cancelar
        </button>
        <button 
          type="button"
          @click="handleCriarCargo"
          :disabled="!novoCargoNome.trim() || novasPermissoes.length === 0"
          class="flex-1 h-12 bg-ember text-white border-none rounded-xl font-bold uppercase tracking-widest text-[10px] cursor-pointer hover:bg-coral active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {{ cargoSendoEditadoId ? 'Salvar Alterações' : 'Criar Cargo' }}
        </button>
      </div>
    </BottomSheet>

    <!-- Bottom Sheet de Permissões do Cargo -->
    <BottomSheet 
      v-model="mostrarBottomSheetPermissoesCargo"
      :show-close="true"
      max-height="90dvh"
      min-height="65dvh"
      width-class="md:w-[560px]"
    >
      <template #header>
        <div class="flex items-center gap-3 w-full pr-8">
          <div 
            class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-300"
            :style="{ backgroundColor: novoCargoCor + '20' }"
          >
            <Key class="w-5 h-5" :style="{ color: novoCargoCor }" />
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="text-base font-bold text-charcoal leading-tight">
              Permissões do Cargo
            </h3>
            <p class="text-[10px] font-medium mt-0.5 truncate" :style="{ color: novoCargoCor }" v-if="novoCargoNome.trim()">
              {{ novoCargoNome }}
            </p>
            <p class="text-[10px] text-ash font-medium mt-0.5 truncate" v-else>
              Novo cargo
            </p>
          </div>
          <!-- Contador de selecionadas -->
          <div 
            class="shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold"
            :style="{ backgroundColor: novoCargoCor + '15', color: novoCargoCor }"
          >
            {{ novasPermissoes.length }}/{{ permissoesDisponiveis.length }}
          </div>
        </div>
      </template>

      <!-- Conteúdo Rolável -->
      <div class="px-5 pt-4 pb-3 space-y-3 overflow-y-auto flex-grow custom-scrollbar min-h-0">
        <!-- Cards de permissão clicáveis -->
        <button
          v-for="p in permissoesDisponiveis"
          :key="p.chave"
          type="button"
          data-testid="toggle-permissao-cargo"
          @click="toggleNovaPermissao(p.chave)"
          class="w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left cursor-pointer transition-all duration-200 active:scale-[0.99]"
          :class="novasPermissoes.includes(p.chave) 
            ? 'bg-white shadow-subtle' 
            : 'bg-canvas border-stone hover:border-stone/80'"
          :style="novasPermissoes.includes(p.chave) 
            ? { borderColor: novoCargoCor, boxShadow: `0 0 0 1px ${novoCargoCor}20` } 
            : {}"
        >
          <!-- Ícone de estado -->
          <div 
            class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200"
            :style="novasPermissoes.includes(p.chave) 
              ? { backgroundColor: novoCargoCor + '18', color: novoCargoCor } 
              : {}"
            :class="!novasPermissoes.includes(p.chave) ? 'bg-stone/50 text-ash' : ''"
          >
            <span class="text-base font-bold leading-none" v-if="novasPermissoes.includes(p.chave)">✓</span>
            <span class="w-4 h-4 rounded-full border-2 border-ash/30 block" v-else />
          </div>

          <!-- Texto -->
          <div class="flex-1 min-w-0">
            <p 
              class="text-xs font-bold leading-none transition-colors duration-200"
              :class="novasPermissoes.includes(p.chave) ? 'text-charcoal' : 'text-ash'"
            >{{ p.label }}</p>
            <p class="text-[9px] text-ash mt-1 leading-snug">{{ p.desc }}</p>
          </div>

          <!-- Toggle visual -->
          <div 
            class="w-10 h-5.5 rounded-full p-0.5 transition-all duration-300 shrink-0 flex items-center"
            :class="novasPermissoes.includes(p.chave) ? 'justify-end' : 'justify-start bg-stone/40'"
            :style="novasPermissoes.includes(p.chave) ? { backgroundColor: novoCargoCor } : {}"
          >
            <div class="w-4 h-4 rounded-full bg-white shadow-subtle" />
          </div>
        </button>
      </div>

      <!-- Botões de Ação Normais ou de Confirmação de Exclusão no Rodapé -->
      <div class="shrink-0 px-5 py-4 border-t border-stone/60 bg-card flex flex-col gap-2.5">
        <Transition name="tab-fade" mode="out-in">
          <!-- Painel de Confirmação de Exclusão -->
          <div v-if="confirmarExclusaoCargo" class="space-y-3 w-full animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div class="p-3 bg-coral/5 border border-coral/20 rounded-xl">
              <p class="text-[11px] font-bold text-coral leading-snug">
                {{ (cargoSendoEditado?.totalMembros || 0) > 0 
                  ? `Atenção: Este cargo possui ${(cargoSendoEditado?.totalMembros)} morador(es) vinculado(s). Ao excluí-lo, eles ficarão sem cargo.`
                  : `Tem certeza que deseja excluir o cargo "${cargoSendoEditado?.nome}"?` 
                }}
              </p>
            </div>
            <div class="flex gap-2.5 w-full">
              <button 
                type="button"
                @click="confirmarExclusaoCargo = false"
                class="flex-1 h-11 bg-white border border-stone rounded-xl text-ash font-bold uppercase tracking-widest text-[9px] cursor-pointer hover:border-graphite active:scale-95 transition-all"
              >
                Cancelar
              </button>
              <button 
                type="button"
                data-testid="confirmar-excluir-cargo-bottomsheet"
                @click="handleExcluirCargoConfirmado"
                class="flex-1 h-11 bg-coral text-white border-none rounded-xl font-bold uppercase tracking-widest text-[9px] cursor-pointer hover:bg-red-600 active:scale-95 transition-all shadow-subtle"
              >
                Sim, Excluir
              </button>
            </div>
          </div>

          <!-- Botões Normais (Excluir e Confirmar) -->
          <div v-else class="flex gap-2.5 w-full">
            <button 
              v-if="cargoSendoEditadoId"
              type="button"
              data-testid="excluir-cargo-bottomsheet"
              @click="handleExcluirCargoDoBottomSheet"
              class="w-12 h-12 rounded-xl border border-stone bg-white text-ash hover:text-coral hover:border-coral/40 hover:bg-coral/5 transition-all cursor-pointer flex items-center justify-center shrink-0 active:scale-95"
              title="Excluir cargo"
            >
              <Trash2 class="w-4.5 h-4.5" />
            </button>
            <button 
              type="button"
              @click="fecharBottomSheetPermissoesCargo"
              class="flex-1 h-12 rounded-xl font-bold uppercase tracking-widest text-[10px] cursor-pointer active:scale-95 transition-all flex items-center justify-center gap-2 text-white border-none shadow-subtle"
              :style="{ backgroundColor: novoCargoCor }"
            >
              <span>Confirmar</span>
              <span 
                class="px-2 py-0.5 rounded-full text-[9px] font-bold"
                style="background: rgba(255,255,255,0.25)"
              >{{ novasPermissoes.length }} selecionada{{ novasPermissoes.length !== 1 ? 's' : '' }}</span>
            </button>
          </div>
        </Transition>
      </div>
    </BottomSheet>

    <!-- Bottom Sheet de Cadastro de Novo Morador -->
    <BottomSheet 
      v-model="novoMembroFormAberto"
      :show-close="true"
      max-height="90dvh"
      min-height="75dvh"
      width-class="md:w-[560px]"
    >
      <template #header>
        <div class="flex items-center gap-3 w-full pr-8">
          <div class="w-10 h-10 rounded-xl bg-ember/15 text-ember flex items-center justify-center shrink-0">
            <User class="w-5 h-5" />
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="text-base font-bold text-charcoal leading-tight">Novo Morador</h3>
            <p class="text-[10px] text-ash font-medium mt-0.5">Adicione um novo membro à casa</p>
          </div>
        </div>
      </template>

      <!-- Conteúdo do Formulário -->
      <div class="px-6 pt-5 pb-4 space-y-6 flex-grow overflow-y-auto custom-scrollbar min-h-0">
        <!-- Preview do Membro em tempo real -->
        <div class="flex items-center gap-3 p-4 rounded-2xl border border-stone bg-parchment/30">
          <MembroAvatar 
            :nome="novoNome.trim() || '?'" 
            variant="ember" 
            size="md" 
          />
          <div class="flex-1 min-w-0">
            <span class="text-sm font-bold text-charcoal leading-none block truncate">
              {{ novoNome.trim() || 'Nome do morador...' }}
            </span>
            <p class="text-[10px] text-ash mt-0.5">
              @{{ novoUsername.trim() || 'usuario' }}
            </p>
          </div>
          <span class="px-2 py-0.5 rounded-full text-[8px] font-bold bg-stone text-ash uppercase tracking-widest shrink-0">
            Preview
          </span>
        </div>

        <!-- Nome do Morador -->
        <div class="space-y-2">
          <label class="block text-[10px] font-bold uppercase text-graphite tracking-widest ml-1">Nome Completo</label>
          <div class="relative w-full">
            <input
              v-model="novoNome"
              maxlength="50"
              type="text"
              placeholder="Ex: Luana Oliveira"
              class="w-full px-4 py-3.5 pr-12 rounded-xl border border-stone bg-canvas outline-none font-bold text-charcoal focus:border-ember transition-all text-sm"
              @keyup.enter="handleAdicionar"
            />
            <span
              v-if="novoNome.length > 0"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-ash/60"
            >
              {{ novoNome.length }}/50
            </span>
          </div>
        </div>

        <!-- Campos de Usuário e Senha -->
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <label class="text-[10px] font-bold uppercase text-graphite tracking-widest ml-1 block">Usuário</label>
            <input 
              v-model="novoUsername"
              type="text" 
              placeholder="luana.ol"
              class="w-full px-4 py-3.5 rounded-xl border border-stone bg-canvas outline-none font-bold text-charcoal focus:border-ember text-sm transition-all"
            />
          </div>
          <div class="space-y-2">
            <label class="text-[10px] font-bold uppercase text-graphite tracking-widest ml-1 block">Senha</label>
            <input 
              v-model="novoPassword"
              type="password" 
              placeholder="••••••"
              class="w-full px-4 py-3.5 rounded-xl border border-stone bg-canvas outline-none font-bold text-charcoal focus:border-ember text-sm transition-all"
            />
          </div>
        </div>
      </div>

      <!-- Rodapé com Botões -->
      <div class="shrink-0 flex gap-2.5 px-6 py-4 border-t border-stone/60 bg-card">
        <button 
          type="button"
          @click="fecharBottomSheetNovoMembro"
          class="flex-1 h-12 bg-white border border-stone rounded-xl text-ash font-bold uppercase tracking-widest text-[10px] cursor-pointer hover:border-graphite active:scale-95 transition-all"
        >
          Cancelar
        </button>
        <Button 
          @click="handleAdicionar"
          :disabled="!novoNome.trim() || !novoUsername.trim() || !novoPassword.trim() || !activeTenantId"
          class="flex-1 h-12 bg-ember text-white border-none rounded-xl font-bold uppercase tracking-widest text-[10px] cursor-pointer hover:bg-coral active:scale-95 transition-all"
        >
          Cadastrar
        </Button>
      </div>
    </BottomSheet>
  </div>
</template>

<style scoped>
.tab-fade-enter-active,
.tab-fade-leave-active {
  transition: opacity 0.3s ease-spring, transform 0.4s var(--ease-spring);
}
.tab-fade-enter-from,
.tab-fade-leave-to {
  opacity: 0;
  transform: translateY(12px);
}
</style>
