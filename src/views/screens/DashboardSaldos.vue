<!-- src/views/screens/DashboardSaldos.vue -->
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Tab } from '../components/ui/BottomTabBar.vue'
import { useDashboardViewModel } from '../../viewmodels/useDashboardViewModel'
import { useCasasMultitenant } from '../../viewmodels/useCasasMultitenant'
import type { Fatura } from '../../models/entities/Fatura'
import type { Cartao } from '../../models/entities/Cartao'
import ContasFixasPanel from '../components/ledger/ContasFixasPanel.vue'
import ActivityFeed from '../components/ledger/ActivityFeed.vue'
import DetalhamentoSaldosCard from '../components/ledger/dashboard/DetalhamentoSaldosCard.vue'
import DashboardHeader from '../components/ledger/dashboard/DashboardHeader.vue'
import UnifiedBalancePanel from '../components/ledger/dashboard/UnifiedBalancePanel.vue'
import NettingPanel from '../components/ledger/dashboard/NettingPanel.vue'
import Card from '../components/ui/Card.vue'
import Button from '../components/ui/Button.vue'
import DashboardModalsManager from './DashboardModalsManager.vue'
import IllustrationMascot from '../components/ui/IllustrationMascot.vue'
import SkeletonMimic from '../components/ui/SkeletonMimic.vue'
import { CheckCircle2 } from 'lucide-vue-next'

interface Props {
  membros: { id: string; nome: string; ativo?: boolean }[]
  faturasAbertas: Fatura[]
  faturasFechadas: Fatura[]
  cartoes: Cartao[]
  activeTab?: Tab
  isLoading?: boolean
}

const props = defineProps<Props>()
const emit = defineEmits(['periodoStatusChanged'])

const vm = useDashboardViewModel(props, emit)

const {
  faturaSelecionadaFechada,
  saldosUnificadosAtivos,
  nettingTransferencias,
  membrosVisiveis,
  contasFixas,
  gastosFaturaSelecionada,
  getMembroNome,
  currentMonthName,
  currentYear,
  abrirLancarBill,
  abrirConfigurarBill,
  abrirNovoBill,
  abrirAjustarGasto,
  abrirConfirmacaoEstornoGasto,
  abrirNovoPeriodoBottomSheet,
  estornarContaFixa,
  totalLancamentosPeriodoSelecionado,
  reabrirPeriodoSelecionado,
  listarAuditLogs
} = vm

const mostrarAuditLogs = ref(false)
const logsAuditoria = ref<any[]>([])
const carregandoLogs = ref(false)

const abrirAuditLogs = async () => {
  mostrarAuditLogs.value = true
  carregandoLogs.value = true
  try {
    logsAuditoria.value = await listarAuditLogs()
  } finally {
    carregandoLogs.value = false
  }
}

const isHoje = computed(() => !props.activeTab || props.activeTab === 'hoje')
const isFaturas = computed(() => !props.activeTab || props.activeTab === 'faturas')
const membrosAtivos = computed(() => props.membros.filter(m => m.ativo !== false))

const {
  isAuthed,
  activeTenantId,
  casas,
  isCreating,
  isEntering,
  form,
  copiedCode,
  activeTenantObj,
  selecionarCasa,
  criarNovaCasa,
  entrarPorCodigo,
  copyInviteCode,
  handleLogoutClick
} = useCasasMultitenant()

const transitionName = ref('tab-slide-right')
const tabOrder: Tab[] = ['hoje', 'faturas']

watch(() => props.activeTab, (newTab, oldTab) => {
  const newIndex = tabOrder.indexOf(newTab || 'hoje')
  const oldIndex = tabOrder.indexOf(oldTab || 'hoje')

  if (newIndex > oldIndex) {
    transitionName.value = 'tab-slide-right'
  } else if (newIndex < oldIndex) {
    transitionName.value = 'tab-slide-left'
  }
})

defineExpose({
  isDropdownAbertosOpen: vm.isDropdownAbertosOpen,
  periodoSelecionado: vm.periodoSelecionado
})
</script>

<template>
  <div class="space-y-12">
    <SkeletonMimic
      v-if="props.isLoading"
      :variant="props.activeTab === 'faturas' ? 'faturas' : 'hoje'"
      key="skeleton"
      data-testid="skeleton-mimic"
    />
    <div v-else key="content" class="space-y-12">
      <DashboardHeader
        :current-year="currentYear"
        :current-month-name="currentMonthName"
        :fatura-selecionada-fechada="faturaSelecionadaFechada"
        :is-authed="isAuthed"
        :active-tenant-obj="activeTenantObj"
        @open-historico="vm.abrirModal('historico')"
        @open-casas="vm.abrirModal('casas')"
        @open-audit-logs="abrirAuditLogs"
      />

      <!-- Container Estabilizado -->
      <div class="relative overflow-x-hidden -mx-4 px-4 sm:-mx-6 sm:px-6">
        <Transition :name="transitionName" mode="out-in">
          <div v-if="isHoje" key="hoje" class="space-y-12 pb-2">
            <div v-if="totalLancamentosPeriodoSelecionado === 0" class="py-16 flex flex-col items-center justify-center text-center space-y-8 bg-parchment/30 rounded-3xl border-2 border-dashed border-stone/50 mx-1">
              <div class="animate-float">
                <IllustrationMascot variant="sky" :size="140" mood="chill" />
              </div>
              <div class="space-y-3 px-6">
                <h3 class="text-3xl font-display text-charcoal leading-tight">Comece pelas<br><span class="text-sky">Despesas</span></h3>
                <p class="text-sm text-graphite max-w-[280px] mx-auto leading-relaxed font-medium">
                  Registre a primeira despesa compartilhada para acompanhar os saldos e preparar o fechamento do mês.
                </p>
              </div>
            </div>

            <section class="space-y-4">
              <UnifiedBalancePanel
                :membros-visiveis="membrosVisiveis"
                :saldos-unificados-ativos="saldosUnificadosAtivos"
              />
            </section>

            <section v-if="nettingTransferencias.length > 0" class="space-y-4">
              <NettingPanel
                :netting-transferencias="nettingTransferencias"
                :fatura-selecionada-fechada="faturaSelecionadaFechada"
                :get-membro-nome="getMembroNome"
                @abrir-netting="vm.abrirBottomSheetNetting"
              />
            </section>

            <section class="space-y-4">
              <ContasFixasPanel
                :contasFixas="contasFixas"
                :gastos="gastosFaturaSelecionada"
                :membros="props.membros"
                :is-month-closed="faturaSelecionadaFechada"
                @lancar="abrirLancarBill"
                @configurar="abrirConfigurarBill"
                @novo="abrirNovoBill"
                @estornar="estornarContaFixa"
              />
            </section>

            <section class="space-y-4">
              <ActivityFeed
                :gastos="gastosFaturaSelecionada"
                :membros="props.membros"
                :is-month-closed="faturaSelecionadaFechada"
                @excluir="abrirConfirmacaoEstornoGasto"
                @ajustar="abrirAjustarGasto"
              />
            </section>
          </div>

          <div v-else-if="isFaturas" key="faturas" class="space-y-12 pb-2">
            <Card class="mt-6 p-8 flex flex-col md:flex-row justify-between items-center gap-6 bg-canvas border-2 border-stone shadow-subtle rounded-2xl transition-all duration-500">
              <div class="flex items-center gap-5">
                <div v-if="faturaSelecionadaFechada" class="w-12 h-12 rounded-xl bg-meadow/10 flex items-center justify-center shrink-0 border border-meadow/20">
                  <CheckCircle2 class="w-6 h-6 text-meadow" stroke-width="3" />
                </div>
                <div v-else class="w-12 h-12 rounded-xl bg-ember/10 flex items-center justify-center shrink-0 border border-ember/20">
                  <CheckCircle2 class="w-6 h-6 text-ember opacity-30" stroke-width="3" />
                </div>
                <div>
                  <h3 class="font-bold text-xl leading-tight text-charcoal tracking-tight">Status do Período</h3>
                  <p class="text-[13px] text-graphite mt-1.5 font-medium leading-relaxed max-w-[400px]">
                    {{ faturaSelecionadaFechada ? 'Este mês está oficialmente arquivado. O histórico está protegido para auditoria.' : 'Finalize o mês atual para gerar os acertos finais e preparar o próximo ciclo da casa.' }}
                  </p>
                </div>
              </div>
              <div class="w-full md:w-auto">
                <Button
                  v-if="faturaSelecionadaFechada"
                  variant="secondary"
                  class="w-full md:w-auto bg-white border-stone text-charcoal font-bold uppercase tracking-widest text-[10px] h-12 px-8 shadow-sm"
                  @click="reabrirPeriodoSelecionado"
                >
                  Reabrir Período
                </Button>
                <Button
                  v-else
                  variant="primary"
                  class="w-full md:w-auto !bg-midnight hover:!bg-charcoal text-white font-bold uppercase tracking-widest text-[10px] h-12 px-8 shadow-md"
                  @click="abrirNovoPeriodoBottomSheet"
                >
                  Encerrar Mês
                </Button>
              </div>
            </Card>

            <div class="space-y-4">
              <DetalhamentoSaldosCard
                :membros="membrosVisiveis"
                :gastos="gastosFaturaSelecionada"
                :saldosUnificados="saldosUnificadosAtivos"
              />
            </div>
          </div>
        </Transition>
      </div>
    </div>

    <DashboardModalsManager
      :vm="vm"
      :membrosAtivos="membrosAtivos"
      :cartoes="props.cartoes"
      :faturasAbertas="props.faturasAbertas"
      :faturasFechadas="props.faturasFechadas"
      :casasMultitenant="{ activeTenantId, casas, form, copiedCode, isCreating, isEntering, selecionarCasa, criarNovaCasa, entrarPorCodigo, copyInviteCode, handleLogoutClick }"
    />

    <!-- Modal de Logs de Auditoria (Atividades da Casa) -->
    <div
      v-if="mostrarAuditLogs"
      class="fixed inset-0 bg-midnight/35 backdrop-blur-sm z-50 flex items-end justify-center md:items-center animate-in fade-in duration-300"
      @click.self="mostrarAuditLogs = false"
    >
      <div
        class="bg-canvas border border-stone w-full md:max-w-lg rounded-t-3xl md:rounded-3xl shadow-xl flex flex-col max-h-[85vh] animate-in slide-in-from-bottom-5 duration-300 overflow-hidden"
      >
        <header class="p-6 border-b border-stone shrink-0 flex items-center justify-between">
          <div>
            <h3 class="text-heading text-charcoal font-display">Atividades <span class="text-ember">da Casa</span></h3>
            <p class="text-[10px] text-graphite font-bold uppercase tracking-widest mt-1">Histórico de auditoria contábil</p>
          </div>
          <button
            type="button"
            @click="mostrarAuditLogs = false"
            class="w-10 h-10 rounded-full bg-white border border-stone/60 text-ash flex items-center justify-center cursor-pointer transition-all hover:bg-stone hover:text-charcoal focus:outline-none"
          >
            ✕
          </button>
        </header>

        <div class="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          <div v-if="carregandoLogs" class="flex flex-col items-center justify-center py-12 space-y-4">
            <div class="w-8 h-8 border-4 border-ember border-t-transparent rounded-full animate-spin"></div>
            <p class="text-xs text-ash font-bold uppercase tracking-wider">Carregando...</p>
          </div>

          <div v-else-if="logsAuditoria.length === 0" class="flex flex-col items-center justify-center py-16 text-center space-y-4">
            <IllustrationMascot variant="sky" :size="80" mood="chill" class="opacity-45" />
            <p class="text-xs text-ash font-bold italic max-w-[240px]">Nenhuma atividade registrada na casa ainda.</p>
          </div>

          <div v-else class="space-y-6">
            <div
              v-for="log in logsAuditoria"
              :key="log.id"
              class="flex gap-4 items-start pb-4 border-b border-stone/30 last:border-b-0"
            >
              <div
                class="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0 shadow-subtle border"
                :class="{
                  'bg-meadow/10 border-meadow/20': log.acao === 'CRIAR_GASTO',
                  'bg-sky/10 border-sky/20': log.acao === 'EDITAR_GASTO',
                  'bg-coral/10 border-coral/20': log.acao === 'EXCLUIR_GASTO',
                  'bg-sunburst/10 border-sunburst/20': log.acao === 'ALTERAR_RENDA',
                }"
              >
                <span v-if="log.acao === 'CRIAR_GASTO'">💸</span>
                <span v-else-if="log.acao === 'EDITAR_GASTO'">✏️</span>
                <span v-else-if="log.acao === 'EXCLUIR_GASTO'">🗑️</span>
                <span v-else-if="log.acao === 'ALTERAR_RENDA'">💰</span>
              </div>
              <div class="space-y-1 min-w-0">
                <p class="text-xs text-charcoal font-medium leading-relaxed">
                  {{ log.detalhes }}
                </p>
                <div class="flex items-center gap-2 text-[9px] text-ash font-bold uppercase tracking-wide">
                  <span>{{ getMembroNome(log.membroId) }}</span>
                  <span>•</span>
                  <span>{{ new Date(log.createdAt).toLocaleString('pt-BR') }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
