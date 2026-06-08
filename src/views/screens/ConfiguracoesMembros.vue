<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useMembros } from '../../viewmodels/useMembros'
import { useCargos } from '../../viewmodels/useCargos'
import { User, Shield, Plus, ChevronRight } from 'lucide-vue-next'
import { useCasasMultitenant } from '../../viewmodels/useCasasMultitenant'
import { useToast } from '../../composables/useToast'
import { Membro, type MembroRole } from '../../models/entities/Membro'
import Button from '../components/ui/Button.vue'
import BottomSheet from '../components/ui/BottomSheet.vue'
import MembroListItem from '../components/ledger/membros/MembroListItem.vue'
import MembroFormBottomSheet from '../components/ledger/membros/MembroFormBottomSheet.vue'
import CargoFormBottomSheet from '../components/ledger/membros/CargoFormBottomSheet.vue'
import MembroAvatar from '../components/ui/MembroAvatar.vue'
import ConfiguracoesCartoes from '../components/ledger/ConfiguracoesCartoes.vue'

const emit = defineEmits(['voltar', 'logout'])

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

const variants: ('ember' | 'sky' | 'sunburst' | 'flamingo' | 'meadow')[] = ['ember', 'sky', 'sunburst', 'flamingo', 'meadow']

// Subcomponent Refs
const membroFormRef = ref<any>(null)
const cargoFormRef = ref<any>(null)

// Membro selecionado para edição
const mostrarBottomSheet = ref(false)
const membroSelecionado = ref<Membro | null>(null)
const cargoSelecionadoId = ref<string | null>(null)
const ativoSelecionado = ref(true)
const salvando = ref(false)

// Estado da aba ativa
const activeTab = ref<'perfil' | 'acesso'>('perfil')

const podeGerenciarMoradores = computed(() => {
  if (currentMembro.value?.role === 'ADMIN') return true
  return currentMembro.value?.cargo?.permissoes.includes('GERENCIAR_MORADORES') ?? false
})

const podeEditarRole = computed(() => {
  if (!membroSelecionado.value) return false
  if (currentMembro.value?.role !== 'ADMIN') return false
  if (membroSelecionado.value.userId === currentMembro.value?.userId) return false
  return true
})

const podeEditarStatus = computed(() => {
  if (!membroSelecionado.value) return false
  if (currentMembro.value?.role !== 'ADMIN') return false
  if (membroSelecionado.value.userId === currentMembro.value?.userId) return false
  const outrosAdminsAtivos = membros.value.filter(m => m.role === 'ADMIN' && m.ativo && m.id !== membroSelecionado.value?.id)
  if (membroSelecionado.value.role === 'ADMIN' && outrosAdminsAtivos.length === 0) return false
  return true
})

const abrirEdicaoMembro = (membro: Membro) => {
  membroSelecionado.value = membro
  cargoSelecionadoId.value = membro.role === 'ADMIN' ? 'ADMIN' : (membro.cargoId || null)
  ativoSelecionado.value = membro.ativo
  mostrarBottomSheet.value = true
}

const handleSalvarEdicao = async () => {
  if (!membroSelecionado.value) return
  salvando.value = true
  try {
    const novaRole: MembroRole = cargoSelecionadoId.value === 'ADMIN' ? 'ADMIN' : 'MORADOR'
    const novoCargoId = novaRole === 'ADMIN' ? undefined : (cargoSelecionadoId.value || undefined)
    
    if (cargoSelecionadoId.value !== (membroSelecionado.value.role === 'ADMIN' ? 'ADMIN' : membroSelecionado.value.cargoId)) {
      await atualizarCargoMembro(membroSelecionado.value.id, novaRole, novoCargoId)
    }
    
    if (ativoSelecionado.value !== membroSelecionado.value.ativo) {
      if (ativoSelecionado.value) await ativarMembro(membroSelecionado.value.id)
      else await desativarMembro(membroSelecionado.value.id)
    }
    
    toast.show('Alterações salvas com sucesso', 'success')
    mostrarBottomSheet.value = false
  } catch (error: any) {
    toast.show(error.message || 'Erro ao salvar alterações', 'error')
  } finally {
    salvando.value = false
  }
}

const handleLogout = () => {
  emit('logout')
}

// Novo Membro
const novoMembroFormAberto = ref(false)
const abrirNovoMembroForm = () => {
  membroFormRef.value?.resetForm()
  novoMembroFormAberto.value = true
}

const handleAdicionarMembro = async (dados: any) => {
  try {
    await adicionarMembro(dados.nome, dados.username, dados.password)
    toast.show('Membro adicionado com sucesso', 'success')
    novoMembroFormAberto.value = false
  } catch (error: any) {
    toast.show(error.message || 'Erro ao adicionar membro', 'error')
  }
}

// Cargos
const novoCargoFormAberto = ref(false)
const cargoSendoEditadoId = ref<string | null>(null)
const cargoSendoEditado = ref<any>(null)

const permissoesDisponiveis = [
  { chave: 'GERENCIAR_MORADORES', label: 'Gerenciar Moradores', desc: 'Permite adicionar, editar e desativar outros moradores da casa.' },
  { chave: 'GERENCIAR_CARTOES', label: 'Gerenciar Cartões', desc: 'Permite cadastrar novos cartões de crédito e faturas.' },
  { chave: 'VER_DETALHES_MORADORES', label: 'Ver Detalhamento', desc: 'Permite ver o detalhamento individual de gastos de cada morador.' },
  { chave: 'LANCAR_CONTAS_FIXAS', label: 'Lançar Contas Fixas', desc: 'Permite efetivar o lançamento de templates de contas fixas.' },
  { chave: 'GERENCIAR_TEMPLATES', label: 'Gerenciar Templates', desc: 'Permite criar e editar modelos de contas fixas da casa.' },
  { chave: 'FECHAR_FATURAS', label: 'Encerrar Período', desc: 'Permite fechar faturas e abrir novos meses de faturamento.' }
]

const abrirNovoCargoForm = () => {
  cargoSendoEditadoId.value = null
  cargoSendoEditado.value = null
  cargoFormRef.value?.resetForm()
  novoCargoFormAberto.value = true
}

const iniciarEdicaoCargo = (cargo: any) => {
  cargoSendoEditadoId.value = cargo.id
  cargoSendoEditado.value = cargo
  cargoFormRef.value?.resetForm()
  novoCargoFormAberto.value = true
}

const handleSalvarCargo = async (dados: any) => {
  try {
    await salvarCargo(dados.nome, dados.permissoes, dados.cor, dados.id)
    toast.show(dados.id ? 'Cargo atualizado' : 'Cargo criado', 'success')
    novoCargoFormAberto.value = false
  } catch (error: any) {
    toast.show('Erro ao salvar cargo', 'error')
  }
}

const handleExcluirCargo = async (id: string) => {
  try {
    await excluirCargo(id)
    toast.show('Cargo excluído', 'success')
    novoCargoFormAberto.value = false
  } catch (error: any) {
    toast.show('Erro ao excluir cargo', 'error')
  }
}

onMounted(async () => {
  await Promise.all([carregar(), inicializarCargos()])
})
</script>

<template>
  <div class="h-full flex flex-col bg-canvas overflow-hidden">
    <!-- Header -->
    <div class="shrink-0 p-6 sm:px-8 sm:pt-10">
      <h2 class="text-display text-4xl sm:text-5xl text-charcoal">Moradores <span class="text-ember">&</span> Cargos</h2>
      <p class="text-xs sm:text-sm text-ash font-bold mt-2 uppercase tracking-[0.2em]">Gestão de acessos da casa</p>
    </div>

    <!-- Navegação Floating Island -->
    <div class="shrink-0 flex justify-center px-6 mb-6">
      <div class="inline-flex p-1 bg-stone/10 backdrop-blur-md rounded-2xl border border-stone/30 relative">
        <button
          @click="activeTab = 'perfil'"
          class="px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest cursor-pointer border-none transition-all duration-300 relative z-10 select-none"
          :class="activeTab === 'perfil' ? 'bg-white text-charcoal shadow-subtle' : 'bg-transparent text-ash hover:text-charcoal'"
        >
          Meu Perfil
        </button>
        <button
          @click="activeTab = 'acesso'"
          class="px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest cursor-pointer border-none transition-all duration-300 relative z-10 select-none"
          :class="activeTab === 'acesso' ? 'bg-white text-charcoal shadow-subtle' : 'bg-transparent text-ash hover:text-charcoal'"
        >
          Controle de Acesso
        </button>
      </div>
    </div>

    <!-- Conteúdo das Abas -->
    <div class="flex-1 overflow-y-auto px-6 sm:px-8 pb-8 custom-scrollbar">
      <div class="max-w-2xl mx-auto py-4">
        
        <!-- ABA: MEU PERFIL -->
        <div v-if="activeTab === 'perfil'" class="space-y-8 animate-in fade-in duration-300">
          <!-- Card de Perfil Pessoal -->
          <div class="bg-white border border-stone/30 rounded-2xl shadow-subtle p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div class="flex items-center gap-4">
              <MembroAvatar 
                v-if="currentMembro" 
                :nome="currentMembro.nome" 
                variant="ember" 
                size="lg" 
              />
              <div>
                <h3 class="text-xl font-bold text-charcoal font-sans tracking-tight">{{ currentMembro?.nome }}</h3>
                <p class="text-xs text-ash font-medium mt-0.5">@{{ currentMembro?.username || currentMembro?.nome?.toLowerCase() }}</p>
              </div>
            </div>
            <Button 
              @click="handleLogout" 
              variant="secondary" 
              class="w-full sm:w-auto text-[10px] font-bold uppercase tracking-widest h-10 px-5 transition-all duration-300 active:scale-95"
            >
              Sair da Conta
            </Button>
          </div>

          <!-- Componente de Cartões do Usuário -->
          <ConfiguracoesCartoes />
        </div>

        <!-- ABA: CONTROLE DE ACESSO -->
        <div v-else-if="activeTab === 'acesso'" class="space-y-8 animate-in fade-in duration-300">
          <!-- Quem mora aqui -->
          <div class="bg-white border border-stone/30 rounded-2xl shadow-subtle overflow-hidden">
            <div class="px-6 pt-6 pb-2">
              <h3 class="text-heading-sm text-charcoal flex items-center gap-2">
                <User class="w-5 h-5 text-ember" />
                Quem mora aqui
              </h3>
              <p class="text-[11px] text-ash font-medium mt-1 uppercase tracking-wider">Lista de membros ativos e suspensos</p>
            </div>

            <div class="p-4 space-y-4">
              <div v-if="podeGerenciarMoradores" class="flex justify-center pb-2">
                <Button @click="abrirNovoMembroForm" variant="secondary" class="w-full">
                  <Plus class="w-5 h-5 mr-2" />
                  Novo Morador
                </Button>
              </div>

              <div class="space-y-2">
                <MembroListItem 
                  v-for="(membro, idx) in membros" 
                  :key="membro.id"
                  :membro="membro"
                  :variant="variants[idx % variants.length]"
                  @click="abrirEdicaoMembro(membro)"
                />
              </div>
            </div>
          </div>

          <!-- Cargos e Permissões -->
          <div v-if="currentMembro?.role === 'ADMIN'" class="bg-white border border-stone/30 rounded-2xl shadow-subtle overflow-hidden">
            <div class="px-6 pt-6 pb-2">
              <h3 class="text-heading-sm text-charcoal flex items-center gap-2">
                <Shield class="w-5 h-5 text-ember" />
                Cargos e Permissões
              </h3>
              <p class="text-[11px] text-ash font-medium mt-1 uppercase tracking-wider">Definição de níveis de acesso</p>
            </div>

            <div class="p-4 space-y-4">
              <div class="flex justify-center pb-2">
                <Button @click="abrirNovoCargoForm" variant="secondary" class="w-full">
                  <Plus class="w-5 h-5 mr-2" />
                  Novo Cargo
                </Button>
              </div>

              <div class="space-y-2">
                <div 
                  v-for="cargo in cargos" 
                  :key="cargo.id"
                  @click="iniciarEdicaoCargo(cargo)"
                  class="flex items-center justify-between p-4 rounded-2xl bg-canvas/50 border border-stone/50 transition-all duration-500 hover:border-ember/40 cursor-pointer group"
                >
                  <div class="flex items-center gap-4 min-w-0">
                    <div class="w-10 h-10 rounded-xl flex items-center justify-center border" :style="{ backgroundColor: (cargo.cor || '#474645') + '15', borderColor: (cargo.cor || '#474645') + '30' }">
                      <Shield class="w-5 h-5" :style="{ color: cargo.cor || '#474645' }" />
                    </div>
                    <div class="min-w-0">
                      <div class="flex items-center gap-2">
                        <span class="text-sm font-bold text-charcoal truncate">{{ cargo.nome }}</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight class="w-4 h-4 text-ash group-hover:text-charcoal transition-all" />
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- Footer -->
    <div class="shrink-0 p-6 sm:px-8 sm:pb-8 border-t border-stone/30 bg-white">
      <Button variant="secondary" class="w-full" @click="emit('voltar')">Fechar</Button>
    </div>

    <!-- Dialogs / BottomSheets -->
    <MembroFormBottomSheet 
      ref="membroFormRef"
      v-model="novoMembroFormAberto"
      :activeTenantId="activeTenantId"
      @salvar="handleAdicionarMembro"
      @cancelar="novoMembroFormAberto = false"
    />

    <CargoFormBottomSheet 
      ref="cargoFormRef"
      v-model="novoCargoFormAberto"
      :cargoSendoEditadoId="cargoSendoEditadoId"
      :cargoSendoEditado="cargoSendoEditado"
      :permissoesDisponiveis="permissoesDisponiveis"
      @salvar="handleSalvarCargo"
      @excluir="handleExcluirCargo"
      @cancelar="novoCargoFormAberto = false"
    />

    <BottomSheet v-model="mostrarBottomSheet" :subtitle="`Gerencie ${membroSelecionado?.nome}`">
      <template #title>
        <h3 class="text-3xl font-display text-charcoal">Editar <span class="text-ember">Membro</span></h3>
      </template>
      <div class="space-y-5 pt-2">
        <div class="space-y-2">
          <label class="text-[10px] font-bold uppercase tracking-widest text-graphite block ml-1">Cargo</label>
          <select v-model="cargoSelecionadoId" :disabled="!podeEditarRole" class="w-full p-3.5 rounded-2xl border border-stone bg-white outline-none font-bold text-charcoal">
            <option value="ADMIN">Administrador</option>
            <option v-for="c in cargos" :key="c.id" :value="c.id">{{ c.nome }}</option>
          </select>
        </div>
        <div class="flex items-center justify-between p-3.5 bg-parchment border border-stone rounded-2xl">
          <span class="text-xs font-bold text-charcoal">Morador Ativo</span>
          <button @click="ativoSelecionado = !ativoSelecionado" :disabled="!podeEditarStatus" class="w-11 h-6 rounded-full p-0.5 border-none cursor-pointer transition-colors" :class="ativoSelecionado ? 'bg-meadow' : 'bg-stone'">
            <div class="bg-white w-5 h-5 rounded-full shadow-subtle transform transition-transform" :class="ativoSelecionado ? 'translate-x-5' : 'translate-x-0'" />
          </button>
        </div>
      </div>
      <template #footer>
        <div class="flex gap-2.5">
          <Button variant="secondary" @click="mostrarBottomSheet = false" class="flex-1">Cancelar</Button>
          <Button variant="primary" @click="handleSalvarEdicao" :disabled="salvando" class="flex-1">{{ salvando ? 'Salvando...' : 'Salvar' }}</Button>
        </div>
      </template>
    </BottomSheet>
  </div>
</template>
