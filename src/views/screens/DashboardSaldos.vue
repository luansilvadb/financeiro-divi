<script setup lang="ts">
import { computed } from 'vue'
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
import { CheckCircle2 } from 'lucide-vue-next'

interface Props {
  membros: { id: string; nome: string; ativo?: boolean }[]
  faturasAbertas: Fatura[]
  faturasFechadas: Fatura[]
  cartoes: Cartao[]
  activeTab?: Tab
}

const props = defineProps<Props>()
const emit = defineEmits(['openSettings', 'periodoStatusChanged'])

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
  abrirBottomSheetNetting,
  abrirNovoPeriodoBottomSheet,
  estornarContaFixa,
  totalLancamentosPeriodoSelecionado,
  reabrirPeriodoSelecionado
} = vm

const isHoje = computed(() => !props.activeTab || props.activeTab === 'hoje')
const isFaturas = computed(() => !props.activeTab || props.activeTab === 'faturas')
const membrosAtivos = computed(() => props.membros.filter(m => m.ativo !== false))

const {
  isAuthed,
  activeTenantId,
  casas,
  showBottomSheetCasas,
  form,
  copiedCode,
  activeTenantObj,
  selecionarCasa,
  criarNovaCasa,
  entrarPorCodigo,
  copyInviteCode,
  handleLogoutClick
} = useCasasMultitenant()

defineExpose({
  isDropdownAbertosOpen: vm.isDropdownAbertosOpen,
  periodoSelecionado: vm.periodoSelecionado
})
</script>

<template>
  <div class="space-y-12">
    <DashboardHeader 
      :current-year="currentYear"
      :current-month-name="currentMonthName"
      :fatura-selecionada-fechada="faturaSelecionadaFechada"
      :is-authed="isAuthed"
      :active-tenant-obj="activeTenantObj"
      @open-historico="vm.abrirModal('historico')"
      @open-casas="showBottomSheetCasas = true"
      @open-settings="$emit('openSettings')"
    />

    <div v-show="isHoje" class="space-y-12">
      <div v-if="totalLancamentosPeriodoSelecionado === 0" class="py-12 flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in duration-700">
        <div class="animate-float">
          <IllustrationMascot variant="sky" :size="120" mood="chill" />
        </div>
        <div class="space-y-2">
          <h3 class="text-2xl font-display text-charcoal">Tudo calmo por aqui...</h3>
          <p class="text-sm text-ash max-w-[280px] mx-auto leading-relaxed">
            Nenhum lançamento registrado neste período. Que tal começar adicionando um gasto ou conferindo as contas fixas?
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
        @abrir-netting="abrirBottomSheetNetting"
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

    <div v-show="isFaturas" class="space-y-12">
      <Card class="mt-6 p-6 flex flex-col md:flex-row justify-between items-center gap-4 bg-midnight text-white border-none shadow-lg rounded-card-lg transition-all duration-500">
        <div class="flex items-center gap-4">
          <div v-if="faturaSelecionadaFechada" class="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0 animate-in zoom-in duration-700">
            <CheckCircle2 class="w-5 h-5 text-white/80" />
          </div>
          <div>
            <h3 class="font-bold text-lg leading-tight">Mês de Referência: {{ currentMonthName }}</h3>
            <p class="text-xs text-stone-300 mt-1">
              {{ faturaSelecionadaFechada ? 'Este mês está fechado para controle. Lançamentos, ajustes e estornos continuam liberados.' : 'Encerre este mês para organizar o histórico e iniciar o próximo. Faturas abertas continuam como previsão.' }}
            </p>
          </div>
        </div>
        <Button 
          v-if="faturaSelecionadaFechada"
          variant="secondary" 
          class="w-full md:w-auto bg-stone text-charcoal hover:bg-stone/90 border-transparent animate-pulse"
          @click="reabrirPeriodoSelecionado"
        >
          Marcar Mês Aberto
        </Button>
        <Button 
          v-else
          variant="primary" 
          class="w-full md:w-auto !bg-ember hover:!bg-ember/90 border-transparent text-white" 
          @click="abrirNovoPeriodoBottomSheet"
        >
          Encerrar Mês
        </Button>
      </Card>

      <div class="mt-2">
        <DetalhamentoSaldosCard 
          :membros="membrosVisiveis"
          :gastos="gastosFaturaSelecionada"
          :saldosUnificados="saldosUnificadosAtivos"
        />
      </div>
    </div>

    <DashboardModalsManager 
      :vm="vm" 
      :membrosAtivos="membrosAtivos" 
      :cartoes="props.cartoes" 
      :faturasAbertas="props.faturasAbertas" 
      :faturasFechadas="props.faturasFechadas" 
      :casasMultitenant="{ isAuthed, activeTenantId, casas, showBottomSheetCasas, form, copiedCode, activeTenantObj, selecionarCasa, criarNovaCasa, entrarPorCodigo, copyInviteCode, handleLogoutClick }"
    />
  </div>
</template>
