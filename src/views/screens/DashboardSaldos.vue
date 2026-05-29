<script setup lang="ts">
import { computed, watch } from 'vue'
import type { Tab } from '../components/ui/BottomTabBar.vue'
import { useDashboardViewModel } from '../../viewmodels/useDashboardViewModel'
import type { Fatura } from '../../models/entities/Fatura'
import type { AcertoMembro } from '../../models/entities/AcertoMembro'
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
import { 
  TrendingUp, 
  ChevronDown, 
  ChevronUp, 
  History,
  Lock,
  CreditCard
} from 'lucide-vue-next'

interface Props {
  membros: { id: string; nome: string; ativo?: boolean }[]
  faturasAbertas: Fatura[]
  faturasFechadas: Fatura[]
  acertosPendentes: AcertoMembro[]
  cartoes: Cartao[]
  calcularConsumo: (faturaId: string, membroId: string) => number
  activeTab?: Tab
}

const props = defineProps<Props>()
const emit = defineEmits(['openSettings', 'periodoStatusChanged'])

// Instanciação da ViewModel
const vm = useDashboardViewModel(props, emit)

// Desestruturação reativa das propriedades e métodos para uso no template
const {
  faturaSelecionadaTrancada,
  faturaAtivaVisualizada,
  showParcelasFuturas,
  acertoPixId,
  valorPixInput,
  isSubmittingPix,
  saldosUnificadosAtivos,
  nettingTransferencias,
  membrosVisiveis,
  totalFuturasVencer,
  parcelasFuturasDetalhadas,
  contasFixas,
  gastosFaturaSelecionada,
  gastosComAcertosVirtuais,
  previaCartaoAbertoPorMembroCentavos,
  totalPreviaCartaoAbertoCentavos,
  getMembroNome,
  formatarDinheiro,
  acertosDaFatura,
  todosOsAcertosQuitados,
  currentMonthName,
  currentYear,
  abrirLancarBill,
  abrirConfigurarBill,
  abrirNovoBill,
  abrirAjustarGasto,
  abrirConfirmacaoEstornoGasto,
  abrirBottomSheetNetting,
  abrirNovoPeriodoBottomSheet,
  iniciarPix,
  enviarReembolsoPix,
  quitarComAjuste,
  estornarContaFixa,
  faturasPeriodoSelecionado,
  abrirFecharFatura,
  reabrirFaturaManualComTrava,
  showToast,
  totalLancamentosPeriodoSelecionado,
  reabrirPeriodoSelecionado
  } = vm

const reabrirFaturaComAviso = async (faturaId: string) => {
  await reabrirFaturaManualComTrava(faturaId)
}



// Helpers locais para a renderização das Tabs
watch(contasFixas, (newVal) => {
  console.log('[DEBUG] DashboardSaldos: contasFixas atualizado no watch. Total itens:', newVal?.length, 'Itens:', JSON.stringify(newVal))
}, { immediate: true, deep: true })

const isHoje = computed(() => !props.activeTab || props.activeTab === 'hoje')
const isFaturas = computed(() => !props.activeTab || props.activeTab === 'faturas')
const membrosAtivos = computed(() => props.membros.filter(m => m.ativo !== false))



// --- INTEGRAÇÃO SUPABASE MULTITENANT ---
import { useCasasMultitenant } from '../../viewmodels/useCasasMultitenant'

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

// Sincroniza o modal de casas (que vem de useCasasMultitenant) com a pilha de modais do dashboard
watch(showBottomSheetCasas, (isOpen) => {
  if (isOpen) {
    vm.abrirModal('casas')
  } else {
    vm.fecharModal('casas')
  }
})

watch(() => vm.modalStack.value, (newStack) => {
  const contemCasas = newStack.includes('casas')
  if (showBottomSheetCasas.value !== contemCasas) {
    showBottomSheetCasas.value = contemCasas
  }
}, { deep: true })

defineExpose({
  isDropdownAbertosOpen: vm.isDropdownAbertosOpen,
  periodoSelecionado: vm.periodoSelecionado,
  showBottomSheetHistorico: vm.showBottomSheetHistorico
})
</script>

<template>
  <div class="space-y-12">
    <!-- NOVO HEADER TRIPARTITE -->
    <DashboardHeader 
      :current-year="currentYear"
      :current-month-name="currentMonthName"
      :fatura-selecionada-trancada="faturaSelecionadaTrancada"
      :is-authed="isAuthed"
      :active-tenant-obj="activeTenantObj"
      @open-historico="vm.showBottomSheetHistorico.value = true"
      @open-casas="showBottomSheetCasas = true"
      @open-settings="$emit('openSettings')"
    />

    <!-- GROUP: HOJE -->
    <div v-show="isHoje" class="space-y-12">
      <!-- ESTADO VAZIO (Chill Mascot) -->
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

    <!-- Painel de Saldo Real Unificado (Design System Family) -->
    <section class="space-y-4">
      <UnifiedBalancePanel 
        :membros-visiveis="membrosVisiveis"
        :saldos-unificados-ativos="saldosUnificadosAtivos"
      />
    </section>

    <!-- Painel de Compensação Otimizada (Design System Family) -->
    <section v-if="nettingTransferencias.length > 0" class="space-y-4" :class="{ 'opacity-70 grayscale-[0.3] pointer-events-none transition-all duration-500': faturaSelecionadaTrancada }">
      <NettingPanel 
        :netting-transferencias="nettingTransferencias"
        :fatura-selecionada-trancada="faturaSelecionadaTrancada"
        :get-membro-nome="getMembroNome"
        @abrir-netting="abrirBottomSheetNetting"
      />
    </section>

    <!-- Checklist de Contas Fixas (Design System Family) -->
    <section class="space-y-4" :class="{ 'opacity-70 grayscale-[0.3] pointer-events-none transition-all duration-500': faturaSelecionadaTrancada }">
      <ContasFixasPanel 
        :contasFixas="contasFixas"
        :gastos="gastosFaturaSelecionada"
        :membros="props.membros"
        :isMonthLocked="faturaSelecionadaTrancada"
        @lancar="abrirLancarBill"
        @configurar="abrirConfigurarBill"
        @novo="abrirNovoBill"
        @estornar="estornarContaFixa"
      />
    </section>

    <!-- Feed de Lançamentos Recentes (Design System Family) -->
    <section class="space-y-4" :class="{ 'opacity-70 grayscale-[0.3] transition-all duration-500': faturaSelecionadaTrancada }">
      <ActivityFeed 
        :gastos="gastosComAcertosVirtuais"
        :membros="props.membros"
        :is-month-locked="faturaSelecionadaTrancada"
        @excluir="abrirConfirmacaoEstornoGasto"
        @ajustar="abrirAjustarGasto"
      />
    </section>
    </div><!-- /isHoje -->

    <!-- GROUP: FATURAS -->
    <div v-show="isFaturas" class="space-y-12">
      <!-- Banner de Gerenciamento do Período Dinâmico -->
      <Card class="mt-6 p-6 flex flex-col md:flex-row justify-between items-center gap-4 bg-midnight text-white border-none shadow-lg rounded-card-lg transition-all duration-500">
        <div class="flex items-center gap-4">
          <div v-if="faturaSelecionadaTrancada" class="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0 animate-in zoom-in duration-700">
            <Lock class="w-5 h-5 text-white/80" />
          </div>
          <div>
            <h3 class="font-bold text-lg leading-tight">Mês de Referência: {{ currentMonthName }}</h3>
            <p class="text-xs text-stone-300 mt-1">
              {{ faturaSelecionadaTrancada ? 'Este mês está arquivado. Para fazer novos lançamentos, reabra o período.' : 'Encerre este mês para arquivar o período e iniciar o próximo. Faturas abertas continuam como previsão.' }}
            </p>
          </div>
        </div>
        <Button 
          v-if="faturaSelecionadaTrancada"
          variant="secondary" 
          class="w-full md:w-auto bg-stone text-charcoal hover:bg-stone/90 border-transparent animate-pulse"
          @click="reabrirPeriodoSelecionado"
          :disabled="isSubmittingPix"
        >
          Reabrir Mês
        </Button>
        <Button 
          v-else
          variant="primary" 
          class="w-full md:w-auto bg-ember hover:bg-ember/90 border-transparent text-white" 
          @click="abrirNovoPeriodoBottomSheet"
        >
          Encerrar Mês
        </Button>
      </Card>

      <!-- Banners de Fechamento de Faturas de Cartão -->
      <template v-for="fatura in faturasPeriodoSelecionado" :key="fatura.id">
        <Card v-if="fatura.cartaoId !== 'PIX_DEFAULT_ID'" 
          class="mt-6 p-6 flex flex-col md:flex-row justify-between items-center gap-4 bg-midnight text-white border-none shadow-lg rounded-card-lg transition-all duration-500 animate-in fade-in slide-in-from-top-4"
        >
          <div class="flex items-center gap-4">
            <div class="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
              <CreditCard class="w-5 h-5 text-white/80" />
            </div>
            <div class="flex-1">
              <h3 class="font-bold text-lg leading-tight">Cartão: {{ props.cartoes.find(c => c.id === fatura.cartaoId)?.nome || 'Cartão' }}</h3>
              <p class="text-xs text-stone-300 mt-1">
                {{ fatura.status === 'ABERTA' 
                  ? 'A fatura deste cartão ainda está aberta. Feche-a para consolidar os gastos e gerar os acertos individuais.' 
                  : 'Esta fatura está fechada e arquivada no histórico. Para editá-la, é necessário reabrir primeiro.' 
                }}
              </p>
            </div>
          </div>
          
          <Button
            v-if="fatura.status === 'ABERTA'"
            variant="primary"
            class="w-full md:w-auto bg-meadow hover:bg-meadow/90 border-transparent text-white font-bold"
            @click="abrirFecharFatura(fatura)"
            :disabled="isSubmittingPix"
          >
            Fechar Fatura
          </Button>
          <Button
            v-else
            variant="secondary"
            class="w-full md:w-auto bg-stone text-charcoal hover:bg-stone/90 border-transparent font-bold"
            @click="reabrirFaturaComAviso(fatura.id)"
            :disabled="isSubmittingPix"
          >
            Reabrir Fatura
          </Button>
        </Card>
      </template>

      <!-- Prévia de Faturas Abertas -->
      <Card v-if="totalPreviaCartaoAbertoCentavos > 0" class="p-6 space-y-4">
        <div>
          <h3 class="font-bold text-lg leading-tight text-charcoal">Previa de faturas abertas</h3>
          <p class="text-xs text-ash mt-1">Nao e cobranca final. Estes valores viram acerto quando a fatura for fechada.</p>
        </div>

        <div class="grid gap-2">
          <div
            v-for="m in membrosAtivos"
            :key="m.id"
            class="flex items-center justify-between rounded-xl bg-parchment px-4 py-3"
          >
            <span class="text-sm font-semibold text-charcoal">{{ m.nome }}</span>
            <span class="text-sm font-bold text-ash">
              R$ {{ ((previaCartaoAbertoPorMembroCentavos[m.id] || 0) / 100).toFixed(2).replace('.', ',') }}
            </span>
          </div>
        </div>
      </Card>

      <!-- Detalhamento Granular de Saldos por Coluna (Senior v19) -->
      <div class="mt-2">
        <DetalhamentoSaldosCard 
          :membros="membrosVisiveis"
          :gastos="gastosFaturaSelecionada"
          :saldosUnificados="saldosUnificadosAtivos"
        />
      </div>

      <!-- Acertos e Reembolsos da Fatura Fechada (Exibido quando a fatura visualizada estiver fechada/acertada e tiver acertos) -->
      <section v-if="faturaAtivaVisualizada && faturaAtivaVisualizada.status !== 'ABERTA' && acertosDaFatura(faturaAtivaVisualizada.id).length > 0" class="space-y-4">
        <div class="grid gap-6">
          <Card class="p-0 overflow-hidden">
            <!-- Cabeçalho -->
            <div class="p-6 border-b border-stone bg-parchment flex justify-between items-center">
              <div class="flex items-center gap-4">
                <div class="w-10 h-10 rounded-xl bg-midnight text-white flex items-center justify-center">
                  <History class="w-5 h-5" />
                </div>
                <div>
                  <h3 class="font-bold text-lg leading-tight">Acertos do Período</h3>
                  <p class="text-[11px] text-ash uppercase tracking-wider mt-0.5">
                    Mês {{ faturaAtivaVisualizada.periodo.mes }}/{{ faturaAtivaVisualizada.periodo.ano }}
                  </p>
                </div>
              </div>
              <span v-if="todosOsAcertosQuitados(faturaAtivaVisualizada.id)" class="text-[9px] font-bold text-meadow bg-meadow/10 px-3 py-1 rounded-full border border-meadow/20">QUITADA</span>
            </div>

            <div class="p-6 space-y-6">
              <div class="space-y-8">
                <!-- Lista de Acertos -->
                <div class="space-y-4">
                  <div v-for="acerto in acertosDaFatura(faturaAtivaVisualizada.id)" :key="acerto.id" class="p-4 rounded-xl border border-stone bg-canvas space-y-4">
                    <div class="flex justify-between items-start">
                      <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-full bg-stone flex items-center justify-center font-display text-xs text-charcoal">
                          {{ getMembroNome(acerto.membroId)[0] }}
                        </div>
                        <div>
                          <p class="text-sm font-bold text-charcoal">
                            {{ getMembroNome(acerto.membroId) }} → {{ getMembroNome(faturaAtivaVisualizada.responsavelId) }}
                          </p>
                          <p class="text-[10px] text-ash">
                            Total: R$ {{ formatarDinheiro(acerto.valorAcerto.centavos).toFixed(2).replace('.', ',') }}
                          </p>
                        </div>
                      </div>
                      <div class="text-right">
                        <p :class="['text-sm font-bold', acerto.pago ? 'text-meadow' : 'text-coral']">
                          {{ acerto.pago ? '✓ Quitado' : 'R$ ' + formatarDinheiro(acerto.valorAcerto.centavos - (acerto.valorPago?.centavos || 0)).toFixed(2).replace('.', ',') }}
                        </p>
                        <button v-if="!acerto.pago" @click="acertoPixId === acerto.id ? acertoPixId = null : iniciarPix(acerto)" class="text-[10px] font-bold text-ember hover:underline mt-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-ember rounded px-1 -ml-1 transition-shadow" :aria-expanded="acertoPixId === acerto.id" :aria-controls="'pix-form-' + acerto.id">
                          {{ acertoPixId === acerto.id ? 'Cancelar' : 'Registrar Pix' }}
                        </button>
                      </div>
                    </div>

                    <!-- Barra de Progresso Minimalist -->
                    <div 
                      class="h-1.5 w-full bg-stone rounded-full overflow-hidden"
                      role="progressbar"
                      aria-label="Progresso do pagamento"
                      :aria-valuenow="Math.round(((acerto.valorPago?.centavos || 0) / acerto.valorAcerto.centavos) * 100)"
                      aria-valuemin="0"
                      aria-valuemax="100"
                    >
                      <div 
                        class="h-full bg-ember transition-all duration-500"
                        :style="{ width: `${((acerto.valorPago?.centavos || 0) / acerto.valorAcerto.centavos) * 100}%` }"
                      />
                    </div>

                    <!-- Input de Pix Parcial -->
                    <div v-if="acertoPixId === acerto.id" :id="'pix-form-' + acerto.id" class="pt-4 border-t border-stone space-y-4 animate-in fade-in slide-in-from-top-2">
                      <div class="flex items-center gap-3">
                        <div class="relative flex-1">
                          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-ash text-xs font-bold" aria-hidden="true">R$</span>
                          <input 
                            v-model.number="valorPixInput"
                            type="number"
                            step="0.01"
                            min="0.01"
                            placeholder="0.00"
                            :disabled="isSubmittingPix"
                            @keyup.enter="enviarReembolsoPix(acerto.id)"
                            aria-label="Valor do reembolso parcial"
                            class="w-full pl-9 pr-4 py-2 rounded-lg border border-stone bg-canvas focus:border-ember outline-none text-sm font-bold text-charcoal transition-all focus-visible:ring-2 focus-visible:ring-ember focus-visible:border-transparent disabled:opacity-50"
                          />
                        </div>
                        <Button size="sm" @click="enviarReembolsoPix(acerto.id)" :disabled="isSubmittingPix || valorPixInput <= 0">
                          <span v-if="isSubmittingPix" class="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin mr-1.5" aria-hidden="true" />
                          {{ isSubmittingPix ? 'Salvando...' : 'Registrar' }}
                        </Button>
                      </div>
                      <p class="text-[10px] text-ash">
                        Ou <button @click="quitarComAjuste(acerto.id)" :disabled="isSubmittingPix" class="text-ember font-bold underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ember rounded px-1 -mx-1 transition-shadow disabled:opacity-50 disabled:cursor-not-allowed">Quitar Valor Total</button>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

    <!-- Painel de Parcelas Futuras (Minimalist Modern) -->
    <section v-if="totalFuturasVencer > 0" class="space-y-4">
      <Card class="overflow-hidden">
        <div 
          class="p-6 flex justify-between items-center cursor-pointer hover:bg-muted/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember focus-visible:ring-inset"
          role="button"
          tabindex="0"
          :aria-expanded="showParcelasFuturas"
          aria-controls="parcelas-futuras-content"
          @click="showParcelasFuturas = !showParcelasFuturas"
          @keydown.enter.prevent="showParcelasFuturas = !showParcelasFuturas"
          @keydown.space.prevent="showParcelasFuturas = !showParcelasFuturas"
        >
          <div class="flex items-center gap-4">
            <div class="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
              <TrendingUp class="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p class="text-sm font-bold text-foreground">Total a Vencer</p>
              <p class="text-[11px] text-muted-foreground uppercase tracking-wider">Próximos meses</p>
            </div>
          </div>
          <div class="flex items-center gap-4">
            <span class="font-display text-2xl text-amber-600">
              R$ {{ totalFuturasVencer.toFixed(2).replace('.', ',') }}
            </span>
            <ChevronDown v-if="!showParcelasFuturas" class="w-5 h-5 text-muted-foreground" />
            <ChevronUp v-else class="w-5 h-5 text-muted-foreground" />
          </div>
        </div>

        <div v-if="showParcelasFuturas" id="parcelas-futuras-content" class="border-t border-border p-6 space-y-3 bg-muted/20">
          <div 
            v-for="p in parcelasFuturasDetalhadas" 
            :key="p.id"
            class="flex justify-between items-center p-4 rounded-xl bg-background border border-border text-sm"
          >
            <div>
              <span class="font-bold text-foreground block leading-tight">{{ p.descricao }}</span>
              <span class="text-[10px] text-muted-foreground mt-1 block">Faltam {{ p.restantes }}x de R$ {{ p.valorParcela.toFixed(2).replace('.', ',') }} ({{ p.responsavel }})</span>
            </div>
            <span class="font-bold text-amber-600 shrink-0">R$ {{ p.totalFuturo.toFixed(2).replace('.', ',') }}</span>
          </div>
        </div>
      </Card>
    </section>
    </div><!-- /isFaturas -->

    <!-- Modals Manager Delegado -->
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
