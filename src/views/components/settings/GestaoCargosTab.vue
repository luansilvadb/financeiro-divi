<script setup lang="ts">
import { ref } from 'vue'
import { Shield, Plus, ChevronRight } from 'lucide-vue-next'
import { useCargos } from '../../../viewmodels/useCargos'
import { useMembros } from '../../../viewmodels/useMembros'
import { useToast } from '../../../composables/useToast'
import { Cargo } from '../../../models/entities/Cargo'
import Button from '../ui/Button.vue'
import CargoFormBottomSheet from '../ledger/membros/CargoFormBottomSheet.vue'

const props = defineProps<{
  isModoFoco: boolean
}>()

const emit = defineEmits(['focus-change'])

const {
  cargos,
  salvarCargo,
  excluirCargo
} = useCargos()

const { currentMembro } = useMembros()
const toast = useToast()

type FormExpose = { resetForm: () => void }
interface SalvarCargoDados { id?: string; nome: string; permissoes: string[]; cor?: string }

const cargoFormRef = ref<FormExpose | null>(null)
const novoCargoFormAberto = ref(false)
const cargoSendoEditadoId = ref<string | null>(null)
const cargoSendoEditado = ref<Cargo | null>(null)

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
  emit('focus-change', true)
}

const iniciarEdicaoCargo = (cargo: Cargo) => {
  cargoSendoEditadoId.value = cargo.id
  cargoSendoEditado.value = cargo
  cargoFormRef.value?.resetForm()
  novoCargoFormAberto.value = true
  emit('focus-change', true)
}

const handleSalvarCargo = async (dados: SalvarCargoDados) => {
  try {
    await salvarCargo(dados.nome, dados.permissoes, dados.cor, dados.id)
    toast.show(dados.id ? 'Cargo atualizado' : 'Cargo criado', 'success')
    novoCargoFormAberto.value = false
    emit('focus-change', false)
  } catch {
    toast.show('Erro ao salvar cargo', 'error')
  }
}

const handleExcluirCargo = async (id: string) => {
  try {
    await excluirCargo(id)
    toast.show('Cargo excluído', 'success')
    novoCargoFormAberto.value = false
    emit('focus-change', false)
  } catch {
    toast.show('Erro ao excluir cargo', 'error')
  }
}

const cancelarCargoForm = () => {
  novoCargoFormAberto.value = false
  emit('focus-change', false)
}
</script>

<template>
  <div class="space-y-8 animate-in fade-in duration-300">
    <!-- Modo Foco para Novo/Editar Cargo -->
    <div v-if="novoCargoFormAberto" class="bg-white border border-stone/30 rounded-2xl shadow-subtle overflow-hidden animate-in fade-in slide-in-from-right-3 duration-300">
      <CargoFormBottomSheet 
        ref="cargoFormRef"
        :cargoSendoEditadoId="cargoSendoEditadoId"
        :cargoSendoEditado="cargoSendoEditado"
        :permissoesDisponiveis="permissoesDisponiveis"
        @salvar="handleSalvarCargo"
        @excluir="handleExcluirCargo"
        @cancelar="cancelarCargoForm"
      />
    </div>
    <div v-else class="space-y-8">
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
</template>
