<script setup lang="ts">
import { ref, computed, toRef, nextTick, watch } from 'vue'
import type { Tab } from '../ui/BottomTabBar.vue'
import { Dinheiro } from '../../shared/primitives/Dinheiro'
import { useCartoesEFaturas } from '../../modules/ledger/composables/useCartoesEFaturas'
import { Gasto } from '../../modules/ledger/core/domain/Gasto'
import { Fatura } from '../../modules/ledger/core/domain/Fatura'
import { useContasFixas } from '../../modules/ledger/composables/useContasFixas'
import { useFaturaRollover } from '../../modules/ledger/composables/useFaturaRollover'
import { useSaldosUnificados } from '../../modules/ledger/composables/useSaldosUnificados'
import { useDashboardCalculations } from '../../modules/ledger/composables/useDashboardCalculations'
import { DivisaoDeGasto } from '../../modules/ledger/core/domain/DivisaoDeGasto'
import { LocalStorageGastoRepository } from '../../modules/ledger/adapters/LocalStorageGastoRepository'
import ContasFixasPanel from './ContasFixasPanel.vue'
import PopupLancarContaFixa from './PopupLancarContaFixa.vue'
import BottomSheetConfigurarContaFixa from './BottomSheetConfigurarContaFixa.vue'
import BottomSheetFecharFatura from './dashboard/BottomSheetFecharFatura.vue'
import BottomSheetAcertoCompensacao from './dashboard/BottomSheetAcertoCompensacao.vue'
import ActivityFeed from './ActivityFeed.vue'
import BottomSheetAjustarGasto from './BottomSheetAjustarGasto.vue'
import DetalhamentoSaldosCard from './dashboard/DetalhamentoSaldosCard.vue'
import Card from '../ui/Card.vue'
import Button from '../ui/Button.vue'
import BottomSheet from '../ui/BottomSheet.vue'
import { 
  ArrowUpRight, 
  TrendingUp, 
  ChevronDown, 
  ChevronUp, 
  History,
  Settings,
  Sparkles,
  AlertTriangle,
  Lock
} from 'lucide-vue-next'

interface Props {
  membros: { id: string; nome: string; ativo?: boolean }[]
  faturasAbertas: any[]
  faturasFechadas: any[]
  acertosPendentes: any[]
  cartoes: any[]
  calcularConsumo: (faturaId: string, membroId: string) => number
  gastos?: any[]
  activeTab?: Tab
}

const props = defineProps<Props>()
const emit = defineEmits(['quitarAcerto', 'fecharFatura', 'novoGasto', 'reabrirFatura', 'openSettings', 'periodoStatusChanged'])

const {
  registrarReembolsoParcialManual,
  fecharFaturaManual,
  quitarAcertoMembro,
  atualizarGastoCompletoManual,
  gastos: globalGastos,
  acertos: globalAcertos
} = useCartoesEFaturas()

// Lógica de navegação de períodos por calendário / seletor de meses
const showBottomSheetHistorico = ref(false)

const obterPeriodoInicial = () => {
  const salvo = localStorage.getItem('divi_periodo_selecionado')
  if (salvo) {
    try {
      const parsed = JSON.parse(salvo)
      if (parsed.mes && parsed.ano) return parsed
    } catch (e) {}
  }
  const faturaReferencia = props.faturasAbertas?.[0] || props.faturasFechadas?.[0]
  if (faturaReferencia?.periodo) {
    return { mes: faturaReferencia.periodo.mes, ano: faturaReferencia.periodo.ano }
  }
  return { mes: new Date().getMonth() + 1, ano: new Date().getFullYear() }
}

const periodoSelecionado = ref<{ mes: number, ano: number }>(obterPeriodoInicial())

watch(periodoSelecionado, (novos) => {
  localStorage.setItem('divi_periodo_selecionado', JSON.stringify(novos))
}, { deep: true, immediate: true })

const faturaAtivaVisualizada = computed(() => {
  const p = periodoSelecionado.value
  const faturaEncontrada = props.faturasAbertas.find(f => f.periodo.mes === p.mes && f.periodo.ano === p.ano) ||
                           props.faturasFechadas.find(f => f.periodo.mes === p.mes && f.periodo.ano === p.ano)
  if (faturaEncontrada) return faturaEncontrada

  return new Fatura({
    id: `virtual-${p.mes}-${p.ano}`,
    cartaoId: props.cartoes[0]?.id || 'virtual-card',
    periodo: { mes: p.mes, ano: p.ano },
    responsavelId: props.membros[0]?.id || 'virtual-member',
    status: 'ABERTA'
  })
})

const faturaSelecionadaTrancada = computed(() => {
  const p = periodoSelecionado.value
  return props.faturasFechadas.some(f => f.periodo.mes === p.mes && f.periodo.ano === p.ano)
})

watch(faturaSelecionadaTrancada, (isLocked) => {
  emit('periodoStatusChanged', isLocked)
}, { immediate: true })

const faturasFiltradasCalculations = computed(() => {
  const ativa = faturaAtivaVisualizada.value
  if (!ativa) return []
  return [ativa]
})

const formatarMesAno = (mes: number, ano: number) => {
  const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
  return `${meses[mes - 1]} ${ano}`
}

const gastosFaturaSelecionada = computed(() => {
  const fatId = faturaAtivaVisualizada.value?.id
  if (!fatId) return []
  return globalGastos.value.filter(g => g.faturaId === fatId)
})

const listaMesesSeletor = computed(() => {
  const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
  const hoje = new Date()
  const list = []

  for (let i = -12; i <= 12; i++) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() + i, 1)
    const mesIdx = d.getMonth() + 1
    const anoIdx = d.getFullYear()
    
    const estaFechada = props.faturasFechadas.some(
      f => f.periodo.mes === mesIdx && f.periodo.ano === anoIdx
    )

    list.push({
      mes: mesIdx,
      ano: anoIdx,
      nome: `${meses[mesIdx - 1]} ${anoIdx}`,
      status: estaFechada ? 'FECHADA' : 'ABERTA'
    })
  }

  return list
})

const mesesAbertosOpcoes = computed(() => {
  return listaMesesSeletor.value.filter(item => item.status === 'ABERTA')
})

const mesesTrancadosOpcoes = computed(() => {
  return listaMesesSeletor.value.filter(item => item.status === 'FECHADA')
})

const isDropdownAbertosOpen = ref(false)
const itemSelecionadoRef = ref<any>(null)
const setItemSelecionadoRef = (el: any, op: { mes: number; ano: number }) => {
  if (el && periodoSelecionado.value.mes === op.mes && periodoSelecionado.value.ano === op.ano) {
    itemSelecionadoRef.value = el
  }
}

watch(isDropdownAbertosOpen, async (aberto) => {
  if (aberto) {
    await nextTick()
    if (itemSelecionadoRef.value) {
      itemSelecionadoRef.value.scrollIntoView({ block: 'nearest' })
    }
  }
})

// Extract calculation logic to dedicated composable
const calculations = useDashboardCalculations(
  toRef(props, 'membros'),
  faturasFiltradasCalculations, // pass computed wrapper instead of static prop array
  props.faturasFechadas,
  props.acertosPendentes,
  globalGastos.value,
  globalAcertos.value,
  props.calcularConsumo
)

// Destructure for template access
const {
  getMembroNome,
  formatarDinheiro,
  calcularTotalFatura,
  acertosDaFatura,
  gastosDaFatura,
  todosOsAcertosQuitados,
  currentMonthName,
  currentYear,
  parcelasFuturasDetalhadas
} = calculations

const isHoje = computed(() => !props.activeTab || props.activeTab === 'hoje')
const isFaturas = computed(() => !props.activeTab || props.activeTab === 'faturas')

// Estado do BottomSheet de fechamento (Gap 6)
const showBottomSheetFechar = ref(false)
const faturaParaFechar = ref<any | null>(null)


const confirmarFechamentoFatura = async (faturaId: string, responsavelId: string) => {
  await fecharFaturaManual(faturaId, responsavelId)
  showBottomSheetFechar.value = false
  faturaParaFechar.value = null
  await useCartoesEFaturas().inicializar()
}

// Estado do BottomSheet de Ajuste (✏️ Ajustar)
const showBottomSheetAjustar = ref(false)
const gastoParaAjustar = ref<any | null>(null)

const abrirAjustarGasto = (gastoId: string) => {
  const gasto = globalGastos.value.find(g => g.id === gastoId)
  if (gasto) {
    gastoParaAjustar.value = gasto
    showBottomSheetAjustar.value = true
  }
}

const confirmarAjusteGasto = async (dados: {
  descricao: string
  valorTotal: any
  compradorId: string
  method: 'pix' | 'card'
  cardOwner: string | null
  divisoes: any[]
  installments: number
}) => {
  if (!gastoParaAjustar.value) return
  await atualizarGastoCompletoManual(gastoParaAjustar.value.id, dados)
  showBottomSheetAjustar.value = false
  gastoParaAjustar.value = null
  await useCartoesEFaturas().inicializar()
}

// Estado de Pix Parcial por acerto
const acertoPixId = ref<string | null>(null)
const valorPixInput = ref<number>(0)
const isSubmittingPix = ref(false)

// Inicia Pix
const iniciarPix = (acerto: any) => {
  acertoPixId.value = acerto.id
  valorPixInput.value = formatarDinheiro(acerto.valorAcerto.centavos - (acerto.valorPago?.centavos || 0))
}

// Envia reembolso Pix parcial/total
const enviarReembolsoPix = async (acertoId: string) => {
  if (valorPixInput.value <= 0) return
  isSubmittingPix.value = true
  try {
    await registrarReembolsoParcialManual(acertoId, Dinheiro.deReais(valorPixInput.value))
    acertoPixId.value = null
    await useCartoesEFaturas().inicializar()
  } finally {
    isSubmittingPix.value = false
  }
}

const quitarComAjuste = async (acertoId: string) => {
  isSubmittingPix.value = true
  try {
    await quitarAcertoMembro(acertoId)
    acertoPixId.value = null
    await useCartoesEFaturas().inicializar()
  } finally {
    isSubmittingPix.value = false
  }
}

// --- INTEGRAÇÃO SENIOR V18 (FASES 2-5) ---
const { contasFixas, salvarContaFixa, excluirContaFixa, lancarGastoContaFixa } = useContasFixas()

// BottomSheets Contas Fixas
const showPopupLancar = ref(false)
const showBottomSheetConfigCF = ref(false)
const billSelecionada = ref<any | null>(null)

const abrirLancarBill = (bill: any) => {
  billSelecionada.value = bill
  showPopupLancar.value = true
}

const abrirConfigurarBill = (bill: any) => {
  billSelecionada.value = bill
  showBottomSheetConfigCF.value = true
}

const abrirNovoBill = () => {
  billSelecionada.value = null
  showBottomSheetConfigCF.value = true
}

const confirmarLancarBill = async (dados: { valorReal: number, compradorId: string, splitIds: string[] }) => {
  const activeFaturaId = faturaAtivaVisualizada.value?.id
  if (!activeFaturaId) return
  await lancarGastoContaFixa(activeFaturaId, billSelecionada.value, dados.valorReal, dados.compradorId, dados.splitIds)
  showPopupLancar.value = false
  await useCartoesEFaturas().inicializar()
}

const confirmarSalvarTemplate = (template: any) => {
  salvarContaFixa(template)
  showBottomSheetConfigCF.value = false
}

const confirmarDeletarTemplate = (id: string) => {
  excluirContaFixa(id)
  showBottomSheetConfigCF.value = false
}

// Lógica de Rollover
const showBottomSheetNovoPeriodo = ref(false)
const nomeNovoPeriodo = ref('')

const sugerirProximoPeriodoLocal = (fat: any) => {
  if (!fat) return ''
  const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
  const mIdx = fat.periodo.mes - 1 // 0-indexed
  const proximoMIdx = (mIdx + 1) % 12
  const proximoAno = proximoMIdx === 0 ? fat.periodo.ano + 1 : fat.periodo.ano
  return `${meses[proximoMIdx]} ${proximoAno}`
}

const abrirNovoPeriodoBottomSheet = () => {
  nomeNovoPeriodo.value = sugerirProximoPeriodoLocal(faturaAtivaVisualizada.value)
  showBottomSheetNovoPeriodo.value = true
}

const confirmarNovoPeriodo = async () => {
  if (!nomeNovoPeriodo.value.trim()) return
  
  await executarNovoPeriodo(nomeNovoPeriodo.value)
  showBottomSheetNovoPeriodo.value = false
}

// --- INTEGRAÇÃO SENIOR V19: LIVE BALANCES & NETTING ---
const { calcularSaldosUnificados, calcularTransacoesNetting } = useSaldosUnificados()

const saldosUnificadosAtivos = computed(() => {
  const activeFaturaId = faturaAtivaVisualizada.value?.id
  if (!activeFaturaId) return {}
  const gastosPeriodo = globalGastos.value.filter(g => g.faturaId === activeFaturaId)
  return calcularSaldosUnificados(props.membros, gastosPeriodo)
})

const nettingTransferencias = computed(() => {
  return calcularTransacoesNetting(saldosUnificadosAtivos.value)
})

const membrosVisiveis = computed(() => {
  return props.membros.filter(m => {
    if (m.ativo !== false) return true // Moradores ativos aparecem sempre
    const saldo = saldosUnificadosAtivos.value[m.id] || 0
    return Math.abs(saldo) > 0.005 // Moradores desativados só aparecem se tiverem saldo residual
  })
})

const showBottomSheetNetting = ref(false)
const nettingTarget = ref<any | null>(null)

const abrirBottomSheetNetting = (transferencia: any) => {
  nettingTarget.value = transferencia
  showBottomSheetNetting.value = true
}

const confirmarBaixaNetting = async (dados: { from: string; to: string; valor: number; method: string; descricao: string }) => {
  const activeFaturaId = faturaAtivaVisualizada.value?.id
  if (!activeFaturaId) return

  const gRepo = new LocalStorageGastoRepository()

  const acertoGasto = new Gasto({
    id: crypto.randomUUID(),
    faturaId: activeFaturaId,
    descricao: dados.descricao,
    valorTotal: Dinheiro.deReais(dados.valor),
    compradorId: dados.from, // Devedor paga (quem faz o Pix)
    divisoes: [new DivisaoDeGasto(dados.to, Dinheiro.deReais(dados.valor))], // Credor recebe (quem recebe o Pix, abatendo seu saldo positivo)
    isSettlement: true,
    settlementDetails: {
      fromMemberId: dados.from,
      toMemberId: dados.to,
      method: dados.method as any
    },
    installments: 1,
    isLoan: false
  })

  await gRepo.salvar(acertoGasto)
  showBottomSheetNetting.value = false
  nettingTarget.value = null
  await useCartoesEFaturas().inicializar()
}

// --- INTEGRAÇÃO SENIOR V19: ACCORDIONS DE FATURAS E PARCELAS FUTURAS ---

const totalFuturasVencer = computed(() => {
  return parcelasFuturasDetalhadas.value.reduce((acc, p) => acc + p.totalFuturo, 0)
})

const showParcelasFuturas = ref(false)

const executarNovoPeriodo = async (nomeNovoPeriodo: string) => {
  const { executarRolloverPeriodo } = useFaturaRollover()
  
  const faturasAbertasVisualizadas = props.faturasAbertas.filter(f => 
    f.periodo.mes === faturaAtivaVisualizada.value.periodo.mes && 
    f.periodo.ano === faturaAtivaVisualizada.value.periodo.ano
  )

  await executarRolloverPeriodo(
    nomeNovoPeriodo,
    faturasAbertasVisualizadas,
    props.cartoes,
    saldosUnificadosAtivos.value,
    currentMonthName.value
  )

  await useCartoesEFaturas().inicializar()
}

// --- DESFAZER LANÇAMENTOS DO FEED ---
const excluirGasto = async (id: string) => {
  const gRepo = new LocalStorageGastoRepository()
  await gRepo.excluir(id)
  await useCartoesEFaturas().inicializar()
}
</script>

<template>
  <div class="space-y-12">
    <!-- NOVO HEADER TRIPARTITE (Aesthetic v2026) -->
    <header class="flex items-center justify-between pb-6 pt-3 mb-8 border-b border-stone/50">
      <!-- Coluna Esquerda: Mês Selector -->
      <div class="flex-1">
        <div 
          class="flex flex-col cursor-pointer group inline-block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember focus-visible:ring-offset-2 rounded-md p-1 -ml-1 transition-all"
          role="button"
          tabindex="0"
          aria-haspopup="dialog"
          aria-label="Selecionar período"
          @click="showBottomSheetHistorico = true"
          @keydown.enter.prevent="showBottomSheetHistorico = true"
          @keydown.space.prevent="showBottomSheetHistorico = true"
        >
          <span class="text-[8px] font-black text-ash uppercase tracking-[0.2em] mb-1 flex items-center gap-1 group-hover:text-ember transition-colors">
            {{ currentYear }}
            <ChevronDown class="w-3 h-3 text-ash group-hover:text-ember transition-colors" />
          </span>
          <div class="flex items-center gap-2">
            <span class="text-2xl font-black text-charcoal tracking-tighter group-hover:text-ember transition-colors">{{ currentMonthName }}</span>
          </div>
        </div>
      </div>

      <!-- Coluna Central: Brand -->
      <div class="flex-1 flex flex-col items-center justify-center text-center">
        <span class="text-[7px] font-bold text-ash/60 uppercase tracking-[0.3em] block leading-none mb-1.5">Finanças Residenciais</span>
        <h1 class="text-3xl font-black text-charcoal tracking-[-0.05em] leading-none">
          DIVI<span class="text-ember">.</span>
        </h1>
      </div>

      <!-- Coluna Direita: Ações (Settings) -->
      <div class="flex-1 flex justify-end">
        <button 
          @click="$emit('openSettings')" 
          class="w-11 h-11 bg-stone/30 hover:bg-stone/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ember focus-visible:ring-offset-2 rounded-2xl flex items-center justify-center transition-colors border border-stone/20"
          aria-label="Configurações"
          title="Configurações"
        >
          <Settings class="w-5 h-5 text-graphite" />
        </button>
      </div>
    </header>

    <!-- GROUP: HOJE -->
    <div v-show="isHoje" class="space-y-12">
    <!-- Painel de Saldo Real Unificado (Design System Family) -->
    <section class="space-y-4">
      <Card class="p-0 overflow-hidden shadow-subtle bg-white text-graphite">
        <!-- Cabeçalho Padronizado -->
        <div class="py-7 px-6 border-b border-stone bg-parchment flex items-center">
          <div class="flex items-center gap-5">
            <div class="w-11 h-11 rounded-xl bg-midnight text-white flex items-center justify-center shadow-sm">
              <TrendingUp class="w-5 h-5" />
            </div>
            <div>
              <h3 class="font-bold text-lg leading-tight text-charcoal tracking-tight">Saldos Unificados</h3>
              <p class="text-[11px] text-ash uppercase tracking-wider mt-0.5 font-medium">
                Créditos e débitos da casa
              </p>
            </div>
          </div>
        </div>

        <div class="p-6 space-y-4 relative z-10">
          <div 
            v-for="m in membrosVisiveis" 
            :key="m.id" 
            class="group flex justify-between items-center p-4 rounded-xl border border-stone bg-canvas hover:border-ember/30 hover:bg-white transition-all duration-300"
          >
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-full bg-ember/10 flex items-center justify-center font-display text-lg text-ember">
                {{ m.nome[0] }}
              </div>
              <div>
                <span class="font-bold text-base block text-charcoal">{{ m.nome }}</span>
                <span class="text-[11px] text-ash block mt-0.5">
                  {{ saldosUnificadosAtivos[m.id] > 0.005 ? 'Crédito acumulado' : saldosUnificadosAtivos[m.id] < -0.005 ? 'Débito pendente' : 'Tudo em dia' }}
                </span>
              </div>
            </div>
            <div class="text-right">
              <span :class="['font-display text-xl block', saldosUnificadosAtivos[m.id] > 0.005 ? 'text-meadow' : saldosUnificadosAtivos[m.id] < -0.005 ? 'text-coral' : 'text-ash']">
                {{ saldosUnificadosAtivos[m.id] > 0.005 ? '+' : '' }}R$ {{ saldosUnificadosAtivos[m.id]?.toFixed(2).replace('.', ',') }}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </section>

    <!-- Painel de Compensação Otimizada (Design System Family) -->
    <section v-if="nettingTransferencias.length > 0" class="space-y-4">
      <Card class="p-0 overflow-hidden shadow-subtle bg-white text-graphite border-l-4 border-l-ember">
        <!-- Cabeçalho Padronizado -->
        <div class="p-6 border-b border-stone bg-parchment flex justify-between items-center">
          <div class="flex items-center gap-4">
            <div class="w-10 h-10 rounded-xl bg-midnight text-white flex items-center justify-center">
              <Sparkles class="w-5 h-5" />
            </div>
            <div>
              <h3 class="font-bold text-lg leading-tight text-charcoal">Acertos Otimizados</h3>
              <p class="text-[11px] text-ash uppercase tracking-wider mt-0.5">
                Compensação inteligente de dívidas
              </p>
            </div>
          </div>
        </div>

        <div class="p-6 grid gap-4">
          <div 
            v-for="t in nettingTransferencias" 
            :key="t.from + '-' + t.to" 
            class="p-5 border border-stone bg-canvas shadow-none rounded-xl"
          >
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div class="flex items-start gap-4">
                <div class="w-10 h-10 rounded-full bg-ember/10 flex items-center justify-center shrink-0">
                  <ArrowUpRight class="w-5 h-5 text-ember" />
                </div>
                <div>
                  <p class="text-sm leading-relaxed">
                    <span class="font-bold text-charcoal">{{ getMembroNome(t.from) }}</span> 
                    deve enviar para 
                    <span class="font-bold text-charcoal">{{ getMembroNome(t.to) }}</span>
                  </p>
                  <p class="font-display text-2xl text-ember mt-1">
                    R$ {{ t.val.toFixed(2).replace('.', ',') }}
                  </p>
                </div>
              </div>
              <div class="w-full md:w-auto flex flex-col items-center">
                <Button 
                  @click="abrirBottomSheetNetting(t)"
                  :disabled="faturaSelecionadaTrancada"
                  :aria-disabled="faturaSelecionadaTrancada"
                  :aria-describedby="faturaSelecionadaTrancada ? 'netting-disabled-reason-' + t.from + '-' + t.to : undefined"
                  variant="primary"
                  class="w-full"
                >
                  Confirmar Pix
                </Button>
                <p v-if="faturaSelecionadaTrancada" :id="'netting-disabled-reason-' + t.from + '-' + t.to" class="text-[10px] text-ash mt-1.5 text-center max-w-[150px] leading-tight animate-in fade-in">
                  Reabra o mês para confirmar
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </section>

    <!-- Checklist de Contas Fixas (Design System Family) -->
    <section class="space-y-4">
      <ContasFixasPanel 
        :contasFixas="contasFixas"
        :gastos="gastosFaturaSelecionada"
        :membros="props.membros"
        :isMonthLocked="faturaSelecionadaTrancada"
        @lancar="abrirLancarBill"
        @configurar="abrirConfigurarBill"
        @novo="abrirNovoBill"
      />
    </section>

    <!-- Feed de Lançamentos Recentes (Design System Family) -->
    <section class="space-y-4">
      <ActivityFeed 
        :gastos="gastosFaturaSelecionada"
        :membros="props.membros"
        :is-month-locked="faturaSelecionadaTrancada"
        @desfazerGasto="excluirGasto"
        @ajustarGasto="abrirAjustarGasto"
      />
    </section>
    </div><!-- /isHoje -->

    <!-- GROUP: FATURAS -->
    <div v-show="isFaturas" class="space-y-12">
      <!-- Banner de Gerenciamento do Período Dinâmico -->
      <Card class="mt-6 p-6 flex flex-col md:flex-row justify-between items-center gap-4 bg-midnight text-white border-none shadow-lg">
        <div>
          <h3 class="font-bold text-lg leading-tight">Mês de Referência: {{ currentMonthName }}</h3>
          <p class="text-xs text-stone-300 mt-1">
            {{ faturaSelecionadaTrancada ? 'Este mês está arquivado. Para fazer novos lançamentos, reabra o período.' : 'Encerre este mês para gerar as faturas e iniciar o próximo período.' }}
          </p>
        </div>
        <Button 
          v-if="faturaSelecionadaTrancada"
          variant="secondary" 
          class="w-full md:w-auto bg-stone text-charcoal hover:bg-stone/90 border-transparent"
          @click="$emit('reabrirFatura', faturaAtivaVisualizada.id)"
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

      <!-- Detalhamento Granular de Saldos por Coluna (Senior v19) -->
      <div class="mt-2">
        <DetalhamentoSaldosCard 
          :membros="membrosVisiveis"
          :gastos="gastosFaturaSelecionada"
          :saldosUnificados="saldosUnificadosAtivos"
        />
      </div>

      <!-- Acertos e Reembolsos do Mês Selecionado (Exibido apenas se o mês visualizado estiver arquivado e contiver acertos) -->
      <section v-if="faturaSelecionadaTrancada && faturaAtivaVisualizada && acertosDaFatura(faturaAtivaVisualizada.id).length > 0" class="space-y-4">
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

    <!-- BottomSheet de Fechamento de Fatura com Dono Variável (Gap 6) -->
    <BottomSheetFecharFatura 
      :show="showBottomSheetFechar"
      :fatura="faturaParaFechar"
      :membros="props.membros"
      @close="showBottomSheetFechar = false"
      @confirmar="confirmarFechamentoFatura"
    />

    <!-- Modais do Checklist (Fase 2) -->
    <PopupLancarContaFixa 
      :visible="showPopupLancar"
      :bill="billSelecionada"
      :membros="props.membros"
      @confirm="confirmarLancarBill"
      @cancel="showPopupLancar = false"
    />

    <BottomSheetConfigurarContaFixa 
      :visible="showBottomSheetConfigCF"
      :bill="billSelecionada"
      :membros="props.membros"
      @save="confirmarSalvarTemplate"
      @delete="confirmarDeletarTemplate"
      @cancel="showBottomSheetConfigCF = false"
    />

    <!-- BottomSheet Novo Período (Dossiê Estratégico) -->
    <BottomSheet :model-value="showBottomSheetNovoPeriodo" @update:model-value="val => { if (!val) showBottomSheetNovoPeriodo = false }" width-class="md:w-[460px]" max-height="95dvh">
      
      <!-- Corpo com Scroll -->
      <div class="p-6 sm:p-8 space-y-8 flex-grow overflow-y-auto custom-scrollbar">
        <div class="space-y-3">
          <h3 class="text-3xl font-display text-charcoal leading-tight">Fechamento<br>de <span class="text-ember">Período</span></h3>
          <p class="text-sm text-ash leading-relaxed">
            Revise os números antes de arquivar o mês de <strong class="text-charcoal">{{ faturaAtivaVisualizada ? formatarMesAno(faturaAtivaVisualizada.periodo.mes, faturaAtivaVisualizada.periodo.ano) : '' }}</strong>. O saldo será consolidado e os acertos serão gerados automaticamente.
          </p>
        </div>

        <div v-if="faturaAtivaVisualizada" class="grid grid-cols-2 gap-3">
          <div class="bg-parchment p-4 rounded-xl border border-stone">
            <p class="text-[10px] font-bold uppercase text-ash tracking-widest mb-1">Total do Mês</p>
            <p class="text-2xl font-display text-charcoal break-words">R$ {{ formatarDinheiro(calcularTotalFatura(faturaAtivaVisualizada.id)).toFixed(2).replace('.', ',') }}</p>
            <p class="text-[10px] text-ash font-medium mt-1">{{ gastosDaFatura(faturaAtivaVisualizada.id).length }} lançamentos registrados</p>
          </div>
          
          <div class="bg-parchment p-4 rounded-xl border border-stone">
            <p class="text-[10px] font-bold uppercase text-ash tracking-widest mb-1">Impacto (Pix)</p>
            <p class="text-2xl font-display text-ember">{{ nettingTransferencias.length }} Acertos</p>
            <p class="text-[10px] text-ash font-medium mt-1">serão cobrados dos moradores</p>
          </div>
        </div>

        <div v-if="faturaAtivaVisualizada && contasFixas.some(c => !gastosDaFatura(faturaAtivaVisualizada.id).some(g => g.recurringBillId === c.id))" class="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex gap-3 items-start">
          <div class="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
            <AlertTriangle class="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div>
            <p class="text-xs font-bold text-amber-700">Contas fixas pendentes!</p>
            <p class="text-[11px] text-amber-700/80 mt-0.5">Ainda existem contas fixas deste mês que não foram lançadas. Deseja fechar mesmo assim?</p>
          </div>
        </div>
      </div>

      <!-- Footer Fixo (Botões) -->
      <div class="p-6 sm:px-8 sm:pb-8 border-t border-stone bg-white shrink-0">
        <div class="grid grid-cols-2 gap-3">
          <Button variant="secondary" @click="showBottomSheetNovoPeriodo = false">Cancelar</Button>
          <Button variant="primary" class="bg-charcoal text-white hover:bg-midnight border-none" @click="confirmarNovoPeriodo" :disabled="!nomeNovoPeriodo.trim()">
            Arquivar Mês
          </Button>
        </div>
      </div>
    </BottomSheet>

    <!-- BottomSheet de Netting Otimizado (Senior v19) -->
    <BottomSheetAcertoCompensacao 
      :visible="showBottomSheetNetting"
      :from-id="nettingTarget?.from"
      :to-id="nettingTarget?.to"
      :from-name="getMembroNome(nettingTarget?.from)"
      :to-name="getMembroNome(nettingTarget?.to)"
      :suggested-value="nettingTarget?.val || 0"
      @cancel="showBottomSheetNetting = false"
      @confirm="confirmarBaixaNetting"
    />

    <!-- BottomSheet de Ajuste de Lançamento (✏️ Ajustar) -->
    <BottomSheetAjustarGasto 
      :visible="showBottomSheetAjustar"
      :gasto="gastoParaAjustar"
      :membros="props.membros"
      :cartoes="props.cartoes"
      @cancel="showBottomSheetAjustar = false"
      @save="confirmarAjusteGasto"
    />

    <!-- BottomSheet de Navegação de Histórico (Mobile Premium) -->
    <BottomSheet 
      :model-value="showBottomSheetHistorico" 
      @update:model-value="val => { if (!val) showBottomSheetHistorico = false }" 
      width-class="md:w-[460px]"
      max-height="85dvh"
    >
      <div 
        class="p-6 sm:p-8 space-y-6 flex-grow custom-scrollbar"
        :class="isDropdownAbertosOpen ? 'overflow-y-visible' : 'overflow-y-auto'"
      >
        <div class="space-y-3">
          <h3 class="text-3xl font-display text-charcoal leading-tight">Navegar<br>nos <span class="text-ember">Períodos</span></h3>
          <p class="text-xs text-ash leading-relaxed">
            Selecione o mês que você deseja gerenciar. Todos os meses estão abertos para lançamentos até serem fechados.
          </p>
        </div>

        <!-- Seção: Meses em Aberto (Seletor Premium) -->
        <div class="space-y-3">
          <h4 class="text-[9px] font-bold uppercase tracking-widest text-ash">Gerenciar Período Aberto</h4>
          <div class="relative" @blur="isDropdownAbertosOpen = false">
            <div 
              @click="isDropdownAbertosOpen = !isDropdownAbertosOpen"
              @keydown.enter.prevent="isDropdownAbertosOpen = !isDropdownAbertosOpen"
              @keydown.space.prevent="isDropdownAbertosOpen = !isDropdownAbertosOpen"
              role="button"
              tabindex="0"
              :aria-expanded="isDropdownAbertosOpen.toString()"
              aria-haspopup="listbox"
              aria-label="Gerenciar período aberto"
              class="w-full px-4 py-3.5 rounded-xl border border-stone bg-canvas outline-none font-bold text-charcoal focus:border-ember transition-all text-sm cursor-pointer select-none flex justify-between items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ember focus-visible:ring-offset-2"
              :class="isDropdownAbertosOpen ? 'border-ember ring-2 ring-ember/20' : ''"
            >
              <span class="flex items-center gap-2.5">
                <span class="w-2 h-2 rounded-full bg-meadow animate-pulse" />
                <span class="block truncate">
                  {{ (periodoSelecionado && props.faturasFechadas.every(f => f.periodo.mes !== periodoSelecionado.mes || f.periodo.ano !== periodoSelecionado.ano))
                    ? formatarMesAno(periodoSelecionado.mes, periodoSelecionado.ano)
                    : 'Selecionar mês aberto...'
                  }}
                </span>
              </span>
              <ChevronDown 
                class="w-4 h-4 text-ash pointer-events-none transition-transform duration-200" 
                :class="isDropdownAbertosOpen ? 'rotate-180' : ''"
              />
            </div>
            
            <!-- Listagem suspensa do Dropdown de Abertos -->
            <transition name="dropdown-slide">
              <div 
                v-if="isDropdownAbertosOpen" 
                class="absolute left-0 w-full mt-1.5 max-h-48 overflow-y-auto bg-canvas border border-stone rounded-xl shadow-xl z-50 py-2 custom-scrollbar"
              >
                <div 
                  v-for="op in mesesAbertosOpcoes" 
                  :key="op.nome" 
                  :ref="el => setItemSelecionadoRef(el, op)"
                  @mousedown.prevent="periodoSelecionado = { mes: op.mes, ano: op.ano }; isDropdownAbertosOpen = false; showBottomSheetHistorico = false" 
                  @keydown.enter.prevent="periodoSelecionado = { mes: op.mes, ano: op.ano }; isDropdownAbertosOpen = false; showBottomSheetHistorico = false"
                  @keydown.space.prevent="periodoSelecionado = { mes: op.mes, ano: op.ano }; isDropdownAbertosOpen = false; showBottomSheetHistorico = false"
                  role="button"
                  tabindex="0"
                  class="px-4 py-3 text-sm font-medium hover:bg-stone cursor-pointer transition-colors flex items-center gap-3 focus:outline-none focus:bg-stone"
                  :class="periodoSelecionado.mes === op.mes && periodoSelecionado.ano === op.ano ? 'text-ember bg-ember/5 is-selected' : 'text-charcoal'"
                >
                  <span class="w-2 h-2 rounded-full bg-meadow animate-pulse shrink-0" />
                  {{ op.nome }}
                </div>
              </div>
            </transition>
          </div>
        </div>

        <!-- Divider Elegante -->
        <hr class="border-stone/60 my-6" />

        <!-- Seção: Histórico de Trancados -->
        <div class="space-y-3">
          <h4 class="text-[9px] font-bold uppercase tracking-widest text-ash">Histórico de Fechados (Arquivados)</h4>
          <div class="grid gap-2">
            <div 
              v-for="item in mesesTrancadosOpcoes" 
              :key="item.nome"
              @click="periodoSelecionado = { mes: item.mes, ano: item.ano }; showBottomSheetHistorico = false"
              class="p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between"
              :class="periodoSelecionado.mes === item.mes && periodoSelecionado.ano === item.ano ? 'border-ember bg-ember/5 text-ember font-bold' : 'border-stone bg-canvas hover:border-ember/30 text-charcoal'"
            >
              <div class="flex items-center gap-3">
                <span class="w-2.5 h-2.5 rounded-full bg-ash" />
                <span class="text-sm font-semibold">{{ item.nome }}</span>
              </div>
              
              <div class="flex items-center gap-2">
                <span class="text-[10px] uppercase font-bold text-ash">Arquivado</span>
                <Lock class="w-3.5 h-3.5 text-ash shrink-0" />
              </div>
            </div>
            
            <div v-if="mesesTrancadosOpcoes.length === 0" class="text-center py-6 border border-dashed border-stone rounded-xl">
              <p class="text-xs text-ash italic">Nenhum período arquivado ainda.</p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Footer do BottomSheet -->
      <div class="p-6 sm:px-8 sm:pb-8 border-t border-stone bg-white shrink-0">
        <Button variant="secondary" class="w-full" @click="showBottomSheetHistorico = false">Fechar</Button>
      </div>
    </BottomSheet>
  </div>
</template>
