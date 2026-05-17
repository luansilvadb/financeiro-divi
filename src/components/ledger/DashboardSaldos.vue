<script setup lang="ts">
import { ref, computed } from 'vue'
import { Dinheiro } from '../../shared/primitives/Dinheiro'
import { useCartoesEFaturas } from '../../modules/ledger/composables/useCartoesEFaturas'
import { Gasto } from '../../modules/ledger/core/domain/Gasto'
import { Fatura } from '../../modules/ledger/core/domain/Fatura'
import { useContasFixas } from '../../modules/ledger/composables/useContasFixas'
import { useFaturaRollover } from '../../modules/ledger/composables/useFaturaRollover'
import { useSaldosUnificados } from '../../modules/ledger/composables/useSaldosUnificados'
import { DivisaoDeGasto } from '../../modules/ledger/core/domain/DivisaoDeGasto'
import ContasFixasPanel from './ContasFixasPanel.vue'
import PopupLancarContaFixa from './PopupLancarContaFixa.vue'
import ModalConfigurarContaFixa from './ModalConfigurarContaFixa.vue'
import RevisaoFatura from './dashboard/RevisaoFatura.vue'
import HistoricoFaturas from './dashboard/HistoricoFaturas.vue'
import ModalFecharFatura from './dashboard/ModalFecharFatura.vue'
import ModalAcertoCompensacao from './dashboard/ModalAcertoCompensacao.vue'
import ActivityFeed from './ActivityFeed.vue'
import ModalAjustarGasto from './ModalAjustarGasto.vue'
import DetalhamentoSaldosCard from './dashboard/DetalhamentoSaldosCard.vue'
import { 
  ArrowUpRight, 
  TrendingUp, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  Lock, 
  Unlock
} from 'lucide-vue-next'

interface Props {
  membros: { id: string; nome: string }[]
  faturasAbertas: any[]
  faturasFechadas: any[]
  acertosPendentes: any[]
  cartoes: any[]
  calcularConsumo: (faturaId: string, membroId: string) => number
  calcularAdiantamento?: (faturaId: string, membroId: string) => number
  gastos?: any[]
}

const props = defineProps<Props>()
const emit = defineEmits(['quitarAcerto', 'fecharFatura', 'novoGasto', 'reabrirFatura'])

const {
  registrarReembolsoParcialManual,
  registrarPagamentoBancoManual,
  removerPagamentoBancoManual,
  fecharFaturaManual,
  quitarAcertoMembro,
  atualizarGastoCompletoManual,
  gastos: globalGastos,
  acertos: globalAcertos
} = useCartoesEFaturas()

// Estado de revisão imersiva (Gap 2)
const faturaSobRevisao = ref<any | null>(null)

// Estado do modal de fechamento (Gap 6)
const showModalFechar = ref(false)
const faturaParaFechar = ref<any | null>(null)

const abrirFecharFatura = (faturaId: string) => {
  const fatura = props.faturasAbertas.find(f => f.id === faturaId)
  if (fatura) {
    faturaParaFechar.value = fatura
    showModalFechar.value = true
  }
}

const confirmarFechamentoFatura = async (faturaId: string, responsavelId: string) => {
  await fecharFaturaManual(faturaId, responsavelId)
  showModalFechar.value = false
  faturaParaFechar.value = null
  await useCartoesEFaturas().inicializar()
}

// Estado do modal de Ajuste (✏️ Ajustar)
const showModalAjustar = ref(false)
const gastoParaAjustar = ref<any | null>(null)

const abrirAjustarGasto = (gastoId: string) => {
  const gasto = globalGastos.value.find(g => g.id === gastoId)
  if (gasto) {
    gastoParaAjustar.value = gasto
    showModalAjustar.value = true
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
  showModalAjustar.value = false
  gastoParaAjustar.value = null
  await useCartoesEFaturas().inicializar()
}

// Estado de Pix Parcial por acerto
const acertoPixId = ref<string | null>(null)
const valorPixInput = ref<number>(0)

const getMembroNome = (id: string) => {
  return props.membros.find(m => m.id === id)?.nome || id
}

const getCartaoNome = (cartaoId: string) => {
  return props.cartoes.find(c => c.id === cartaoId)?.nome || 'Cartão'
}

const formatarDinheiro = (centavos: number) => {
  return Dinheiro.deCentavos(centavos).centavos / 100
}

const getConsumo = (faturaId: string, membroId: string) => {
  return props.calcularConsumo(faturaId, membroId)
}

const getAdiantamento = (faturaId: string, membroId: string) => {
  return props.calcularAdiantamento ? props.calcularAdiantamento(faturaId, membroId) : 0
}

const calcularTotalFatura = (faturaId: string) => {
  return props.membros.reduce((sum, m) => sum + getConsumo(faturaId, m.id), 0)
}

// Filtra acertos pertencentes a uma fatura fechada específica
const acertosDaFatura = (faturaId: string) => {
  const list = props.acertosPendentes && props.acertosPendentes.length > 0
    ? props.acertosPendentes
    : globalAcertos.value
  return list.filter(a => a.faturaId === faturaId)
}

// Verifica se a fatura fechada já possui acertos gerados (está no estado de acerto ativo)
const faturaTemAcertosAtivos = (faturaId: string) => {
  return acertosDaFatura(faturaId).length > 0
}

// Gastos associados à fatura
const gastosDaFatura = (faturaId: string) => {
  const list = props.gastos && props.gastos.length > 0
    ? props.gastos
    : globalGastos.value
  return list.filter((g: Gasto) => g.faturaId === faturaId)
}

// Inicia Pix
const iniciarPix = (acerto: any) => {
  acertoPixId.value = acerto.id
  valorPixInput.value = formatarDinheiro(acerto.valorAcerto.centavos - (acerto.valorPago?.centavos || 0))
}

// Envia reembolso Pix parcial/total
const metodoAcerto = ref<'pix' | 'cash' | 'mutual'>('pix')
const enviarReembolsoPix = async (acertoId: string) => {
  if (valorPixInput.value <= 0) return
  await registrarReembolsoParcialManual(acertoId, Dinheiro.deReais(valorPixInput.value))
  acertoPixId.value = null
  await useCartoesEFaturas().inicializar()
}

const quitarComAjuste = async (acertoId: string) => {
  await quitarAcertoMembro(acertoId)
  acertoPixId.value = null
  await useCartoesEFaturas().inicializar()
}

const todosOsAcertosQuitados = (faturaId: string) => {
  const acertos = acertosDaFatura(faturaId)
  return acertos.length > 0 && acertos.every(a => a.pago)
}

// --- INTEGRAÇÃO SENIOR V18 (FASES 2-5) ---
const { contasFixas, salvarContaFixa, excluirContaFixa, lancarGastoContaFixa } = useContasFixas()
const { isMonthLocked, setMonthLocked, processarRolloverParcelas, gerarTransacoesNettingSaldoInicial } = useFaturaRollover()

// Modais Contas Fixas
const showPopupLancar = ref(false)
const showModalConfigCF = ref(false)
const billSelecionada = ref<any | null>(null)

const abrirLancarBill = (bill: any) => {
  billSelecionada.value = bill
  showPopupLancar.value = true
}

const abrirConfigurarBill = (bill: any) => {
  billSelecionada.value = bill
  showModalConfigCF.value = true
}

const abrirNovoBill = () => {
  billSelecionada.value = null
  showModalConfigCF.value = true
}

const confirmarLancarBill = async (dados: { valorReal: number, compradorId: string, splitIds: string[] }) => {
  const activeFaturaId = props.faturasAbertas[0]?.id
  if (!activeFaturaId) return
  await lancarGastoContaFixa(activeFaturaId, billSelecionada.value, dados.valorReal, dados.compradorId, dados.splitIds)
  showPopupLancar.value = false
  await useCartoesEFaturas().inicializar()
}

const confirmarSalvarTemplate = (template: any) => {
  salvarContaFixa(template)
  showModalConfigCF.value = false
}

const confirmarDeletarTemplate = (id: string) => {
  excluirContaFixa(id)
  showModalConfigCF.value = false
}

// Lógica de Rollover
const showModalNovoPeriodo = ref(false)
const nomeNovoPeriodo = ref('')

const sugerirProximoPeriodo = () => {
  const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
  const fat = props.faturasAbertas[0]
  if (!fat) return ''
  const mIdx = fat.periodo.mes - 1 // 0-indexed
  const proximoMIdx = (mIdx + 1) % 12
  const proximoAno = proximoMIdx === 0 ? fat.periodo.ano + 1 : fat.periodo.ano
  return `${meses[proximoMIdx]} ${proximoAno}`
}

const abrirNovoPeriodoModal = () => {
  nomeNovoPeriodo.value = sugerirProximoPeriodo()
  showModalNovoPeriodo.value = true
}

const confirmarNovoPeriodo = async () => {
  if (!nomeNovoPeriodo.value.trim()) return
  
  await executarNovoPeriodo(nomeNovoPeriodo.value)
  showModalNovoPeriodo.value = false
}

// --- INTEGRAÇÃO SENIOR V19: LIVE BALANCES & NETTING ---
const { calcularSaldosUnificados, calcularTransacoesNetting } = useSaldosUnificados()

const currentMonthName = computed(() => {
  const fat = props.faturasAbertas[0]
  if (!fat) return 'Período Atual'
  const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
  return `${meses[fat.periodo.mes - 1]} ${fat.periodo.ano}`
})

const saldosUnificadosAtivos = computed(() => {
  const activeFaturaId = props.faturasAbertas[0]?.id
  if (!activeFaturaId) return {}
  const gastosPeriodo = globalGastos.value.filter(g => g.faturaId === activeFaturaId)
  return calcularSaldosUnificados(props.membros, gastosPeriodo)
})

const nettingTransferencias = computed(() => {
  return calcularTransacoesNetting(saldosUnificadosAtivos.value)
})

const showModalNetting = ref(false)
const nettingTarget = ref<any | null>(null)

const abrirModalNetting = (transferencia: any) => {
  nettingTarget.value = transferencia
  showModalNetting.value = true
}

const confirmarBaixaNetting = async (dados: { from: string; to: string; valor: number; method: string; descricao: string }) => {
  const activeFaturaId = props.faturasAbertas[0]?.id
  if (!activeFaturaId) return

  const { LocalStorageGastoRepository } = await import('../../modules/ledger/adapters/LocalStorageGastoRepository')
  const gRepo = new LocalStorageGastoRepository()

  const acertoGasto = new Gasto({
    id: crypto.randomUUID(),
    faturaId: activeFaturaId,
    descricao: dados.descricao,
    valorTotal: Dinheiro.deReais(dados.valor),
    compradorId: dados.to, // Credor recebe
    divisoes: [new DivisaoDeGasto(dados.from, Dinheiro.deReais(dados.valor))], // Devedor assume 100%
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
  showModalNetting.value = false
  nettingTarget.value = null
  await useCartoesEFaturas().inicializar()
}

// --- INTEGRAÇÃO SENIOR V19: ACCORDIONS DE FATURAS E PARCELAS FUTURAS ---
const faturasExpandidas = ref<Record<string, boolean>>({})
const toggleFaturaExpandida = (faturaId: string) => {
  faturasExpandidas.value[faturaId] = !faturasExpandidas.value[faturaId]
}

const parcelasFuturasDetalhadas = computed(() => {
  const list: any[] = []
  globalGastos.value.forEach((g: Gasto) => {
    if (g.installments > 1) {
      const valorParcela = g.valorTotal.centavos / g.installments
      const parcelasRestantes = g.installments - 1
      const totalRestante = valorParcela * parcelasRestantes
      list.push({
        id: g.id,
        descricao: g.descricao,
        responsavel: g.cardOwner ? getCartaoNome(g.faturaId) : 'Pix',
        restantes: parcelasRestantes,
        valorParcela: valorParcela / 100,
        totalFuturo: totalRestante / 100
      })
    }
  })
  return list
})

const totalFuturasVencer = computed(() => {
  return parcelasFuturasDetalhadas.value.reduce((acc, p) => acc + p.totalFuturo, 0)
})

const showParcelasFuturas = ref(false)

// --- EXECUÇÃO DE ROLLOVER SEGURO ---
const executarNovoPeriodo = async (nomeNovoPeriodo: string) => {
  const fAbertas = props.faturasAbertas
  if (fAbertas.length === 0) return

  // 1. Coleta os saldos unificados acumulados live do período que está sendo fechado
  const saldosAcumulados = { ...saldosUnificadosAtivos.value }

  // 2. Fechar as faturas abertas do período
  for (const f of fAbertas) {
    await fecharFaturaManual(f.id)
  }

  // 3. Criar faturas e período no novo mês
  const [mesStr, anoStr] = nomeNovoPeriodo.split(' ')
  const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
  const mesNum = meses.indexOf(mesStr) + 1 || new Date().getMonth() + 1
  const anoNum = parseInt(anoStr) || new Date().getFullYear()

  const novasFaturas: any[] = []
  const { LocalStorageFaturaRepository } = await import('../../modules/ledger/adapters/LocalStorageFaturaRepository')
  const fRepo = new LocalStorageFaturaRepository()

  for (const card of props.cartoes) {
    const novaFatura = new Fatura({
      id: crypto.randomUUID(),
      cartaoId: card.id,
      periodo: { mes: mesNum, ano: anoNum },
      responsavelId: card.responsavelPadraoId,
      status: 'ABERTA'
    })
    await fRepo.salvar(novaFatura)
    novasFaturas.push(novaFatura)
  }

  const novaFaturaIdPrincipal = novasFaturas[0]?.id

  if (novaFaturaIdPrincipal) {
    const { LocalStorageGastoRepository } = await import('../../modules/ledger/adapters/LocalStorageGastoRepository')
    const gRepo = new LocalStorageGastoRepository()

    // 4. Decrementar parcelas ativas
    const todosGastosAnteriores: Gasto[] = []
    for (const f of fAbertas) {
      const porFatura = await gRepo.buscarPorFatura(f.id)
      todosGastosAnteriores.push(...porFatura)
    }

    const gastosParceladosNovos = processarRolloverParcelas(novaFaturaIdPrincipal, todosGastosAnteriores)
    for (const g of gastosParceladosNovos) {
      await gRepo.salvar(g)
    }

    // 5. Aplicar Netting final e carregar saldos devedores/credores como "Saldo Inicial Pendente"
    const transacoesCarryover = gerarTransacoesNettingSaldoInicial(
      novaFaturaIdPrincipal, 
      currentMonthName.value, 
      saldosAcumulados
    )
    for (const g of transacoesCarryover) {
      await gRepo.salvar(g)
    }
  }

  // 6. Destranca
  setMonthLocked(false)

  // 7. Recarrega dados reativos
  await useCartoesEFaturas().inicializar()
}

// --- DESFAZER LANÇAMENTOS DO FEED ---
const excluirGasto = async (id: string) => {
  const { LocalStorageGastoRepository } = await import('../../modules/ledger/adapters/LocalStorageGastoRepository')
  const gRepo = new LocalStorageGastoRepository()
  await gRepo.excluir(id)
  await useCartoesEFaturas().inicializar()
}
</script>

<template>
  <!-- Modo de Revisão Imersiva (Gap 2) -->
  <RevisaoFatura 
    v-if="faturaSobRevisao"
    :fatura="faturaSobRevisao"
    :membros="props.membros"
    @voltar="faturaSobRevisao = null"
    @acertoConfirmado="faturaSobRevisao = null"
  />

  <div v-else class="max-w-md mx-auto space-y-6">
    <!-- BARRA DE TRANCAMENTO SENIOR V18 -->
    <div 
      class="border rounded-3xl p-4 flex justify-between items-center transition-all duration-300"
      :class="isMonthLocked 
        ? 'bg-divi-amber-dim/10 border-divi-amber/30 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.06)]' 
        : 'bg-divi-s1 border-divi-border text-divi-t2'"
    >
      <div class="flex items-center gap-3">
        <div class="p-2 bg-divi-s2 rounded-2xl">
          <Lock v-if="isMonthLocked" class="w-5 h-5 text-amber-400" />
          <Unlock v-else class="w-5 h-5 text-divi-primary" />
        </div>
        <div>
          <span class="font-extrabold block text-divi-t1">{{ isMonthLocked ? 'Período Trancado' : 'Período Aberto' }}</span>
          <span class="text-[10px] text-divi-t3 mt-0.5 block leading-normal">
            {{ isMonthLocked ? 'Lançamentos congelados. Inicie um novo período.' : 'Lançamentos e rateios permitidos.' }}
          </span>
        </div>
      </div>
      <div class="flex gap-2">
        <button 
          v-if="isMonthLocked"
          @click="abrirNovoPeriodoModal"
          class="bg-divi-amber hover:bg-yellow-500 text-slate-950 px-3.5 py-2.5 rounded-2xl text-xs font-black transition-all shadow-[0_0_12px_rgba(245,158,11,0.25)] flex items-center gap-1.5"
        >
          🚀 Novo Período
        </button>
        <button 
          @click="setMonthLocked(!isMonthLocked)"
          class="bg-divi-s2 hover:bg-divi-s3 text-divi-t1 border border-divi-border px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all"
        >
          {{ isMonthLocked ? 'Destrancar' : 'Trancar Mês' }}
        </button>
      </div>
    </div>

    <!-- Painel de Saldo Real Unificado (Senior v19) -->
    <div class="glass-card rounded-3xl p-6 shadow-2xl text-divi-t1 relative overflow-hidden">
      <div class="absolute -top-10 -left-10 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl"></div>
      <div class="flex justify-between items-center mb-4">
        <div>
          <span class="text-xs font-black text-divi-emerald uppercase tracking-widest block mb-0.5">
            📊 Saldo Real
          </span>
          <span class="text-[10px] text-divi-t3">Consolidação de Pix, Cartões e Empréstimos</span>
        </div>
        <span class="text-[10px] bg-divi-emerald-dim text-divi-emerald border border-emerald-500/20 font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
          {{ currentMonthName }}
        </span>
      </div>
      
      <div class="space-y-3.5">
        <div 
          v-for="m in props.membros" 
          :key="m.id" 
          class="flex justify-between items-center bg-slate-950/20 border border-divi-border/40 rounded-2xl p-3.5 hover:border-divi-primary/20 transition-all"
        >
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-divi-s2 border border-divi-border/60 text-white flex items-center justify-center font-black text-sm uppercase">
              {{ m.nome[0] }}
            </div>
            <div>
              <span class="font-extrabold text-sm block text-divi-t1">{{ m.nome }}</span>
              <span class="text-[10px] text-divi-t3 block mt-0.5">
                {{ saldosUnificadosAtivos[m.id] > 0.005 ? 'Tem crédito na casa' : saldosUnificadosAtivos[m.id] < -0.005 ? 'Tem débito na casa' : 'Tudo equilibrado' }}
              </span>
            </div>
          </div>
          <span :class="['font-black text-sm', saldosUnificadosAtivos[m.id] > 0.005 ? 'text-divi-emerald text-glow-emerald' : saldosUnificadosAtivos[m.id] < -0.005 ? 'text-divi-rose' : 'text-divi-t3']">
            {{ saldosUnificadosAtivos[m.id] > 0.005 ? '+' : '' }}R$ {{ saldosUnificadosAtivos[m.id]?.toFixed(2).replace('.', ',') }}
          </span>
        </div>
      </div>
    </div>

    <!-- Detalhamento Granular de Saldos por Coluna (Senior v19) -->
    <div class="mt-6">
      <DetalhamentoSaldosCard 
        :membros="props.membros"
        :gastos="globalGastos"
        :saldosUnificados="saldosUnificadosAtivos"
      />
    </div>

    <!-- Painel de Compensação Otimizada (Netting Live) (Senior v19) -->
    <div v-if="nettingTransferencias.length > 0" class="glass-card rounded-3xl p-6 shadow-2xl text-divi-t1 border border-indigo-500/25 relative overflow-hidden">
      <div class="absolute -top-10 -right-10 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl"></div>
      <div class="flex items-center gap-1.5 mb-4">
        <Sparkles class="w-4 h-4 text-divi-primary" />
        <div>
          <span class="text-xs font-black text-divi-primary uppercase tracking-widest block mb-0.5">
            💡 Compensação Otimizada
          </span>
          <span class="text-[10px] text-divi-t3">Netting Live: Menos Pix entre moradores</span>
        </div>
      </div>
      
      <div class="space-y-3.5">
        <div 
          v-for="t in nettingTransferencias" 
          :key="t.from + '-' + t.to" 
          class="flex flex-col bg-indigo-950/20 border border-indigo-500/20 rounded-2xl p-4 gap-3"
        >
          <div class="flex items-center gap-2">
            <ArrowUpRight class="w-4 h-4 text-divi-emerald shrink-0" />
            <span class="text-xs text-divi-t2 leading-relaxed">
              <strong>{{ getMembroNome(t.from) }}</strong> deve enviar <strong class="text-divi-emerald">R$ {{ t.val.toFixed(2).replace('.', ',') }}</strong> para <strong>{{ getMembroNome(t.to) }}</strong>.
            </span>
          </div>
          <button 
            @click="abrirModalNetting(t)"
            :disabled="isMonthLocked"
            class="w-full bg-divi-emerald hover:bg-emerald-600 text-white font-black text-[11px] px-4 py-2.5 rounded-xl transition-all shadow-[0_0_12px_rgba(16,185,129,0.2)] disabled:opacity-40 disabled:cursor-not-allowed text-center whitespace-nowrap"
          >
            ✅ Já fiz este Pix
          </button>
        </div>
      </div>
    </div>

    <!-- Seção 1: Faturas Fechadas (Fluxos de Revisão ou Acertos Ativos) -->
    <div v-for="fatura in faturasFechadas" :key="fatura.id" class="glass-card rounded-3xl p-6 shadow-2xl text-divi-t1 overflow-hidden relative">
      <div class="absolute -top-10 -right-10 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl"></div>
      
      <!-- Cabeçalho da Fatura -->
      <div class="flex justify-between items-center border-b border-divi-border pb-4 mb-5">
        <div>
          <span class="text-xs font-black text-divi-primary uppercase tracking-widest block mb-1">
            {{ faturaTemAcertosAtivos(fatura.id) ? '⚠️ Faturas Fechadas (Acertos Ativos)' : '🔍 Faturas Fechadas (Em Revisão)' }}
          </span>
          <span class="font-extrabold text-lg flex items-center gap-2">
            💳 {{ getCartaoNome(fatura.cartaoId) }} <span class="text-divi-t3 text-xs font-normal">• {{ fatura.periodo.mes }}/{{ fatura.periodo.ano }}</span>
          </span>
          <span class="text-[10px] text-divi-t3 block mt-1">
            Responsável: <strong class="text-divi-t1">{{ getMembroNome(fatura.responsavelId) }}</strong>
          </span>
        </div>
        <button 
          @click="emit('reabrirFatura', fatura.id)"
          class="text-xs font-bold text-divi-t2 hover:text-divi-t1 bg-divi-s2 hover:bg-divi-s3 px-3 py-1.5 rounded-xl transition-all border border-divi-border flex items-center gap-1 shadow-sm"
        >
          ↩️ Reabrir
        </button>
      </div>

      <!-- SUB-ESTADO A: EM REVISÃO -->
      <div v-if="!faturaTemAcertosAtivos(fatura.id)" class="space-y-4">
        <div class="bg-divi-primary-glow/10 border border-divi-primary/20 rounded-2xl p-4 text-xs text-indigo-200 leading-relaxed text-center">
          🛒 <strong>Fatura Fechada sob Revisão Coletiva</strong><br>
          <span class="text-divi-t3 block mt-2 text-[10px]">Total Acumulado: R$ {{ formatarDinheiro(calcularTotalFatura(fatura.id)).toFixed(2).replace('.', ',') }}</span>
        </div>

        <button 
          @click="faturaSobRevisao = fatura"
          class="w-full bg-divi-primary hover:bg-indigo-500 text-white font-black py-4 rounded-2xl shadow-lg shadow-indigo-600/20 mt-2 transition-all text-center text-sm flex items-center justify-center gap-2"
        >
          🔍 Revisar Fatura e Ratear
        </button>
      </div>

      <!-- SUB-ESTADO B: ACERTOS ATIVOS -->
      <div v-else class="space-y-4">
        <!-- Banner de Status de Pagamento ao Banco -->
        <div v-if="fatura.dataPagamentoBanco" class="bg-divi-emerald-dim border border-emerald-500/20 rounded-2xl p-4 flex justify-between items-center mb-2">
          <div class="text-xs text-emerald-200 leading-relaxed">
            🏦 <strong>Fatura paga ao banco!</strong> O responsável já pagou a fatura do cartão. Envie seu Pix de reembolso a ele.
          </div>
          <button 
            @click="removerPagamentoBancoManual(fatura.id)"
            class="text-[9px] font-black text-divi-rose hover:text-rose-300 underline ml-2 whitespace-nowrap animate-pulse"
          >
            Estornar
          </button>
        </div>

        <div v-else class="bg-divi-amber-dim/20 border border-divi-amber/20 rounded-2xl p-4 space-y-3 mb-2">
          <div class="text-xs text-amber-200 leading-relaxed">
            ⏳ <strong>Aguardando Pagamento ao Banco:</strong> O responsável ainda não pagou a fatura ao banco.
          </div>
          <button 
            @click="registrarPagamentoBancoManual(fatura.id)"
            class="w-full bg-divi-amber hover:bg-yellow-500 text-slate-950 font-black text-[10px] py-2 rounded-xl transition-all shadow-md shadow-amber-600/10"
          >
            🏦 Já paguei o banco! (Marcar como Paga ao Banco)
          </button>
        </div>

        <h4 class="text-xs font-black uppercase text-divi-t3 tracking-wider mb-2">💸 Saldos de Reembolso Pendentes</h4>

        <div v-for="acerto in acertosDaFatura(fatura.id)" :key="acerto.id" class="bg-divi-s1 rounded-2xl border border-divi-border p-4 space-y-3">
          <div class="flex justify-between items-center">
            <div>
              <span class="font-extrabold text-sm block text-divi-t1">
                {{ getMembroNome(acerto.membroId) }} deve para {{ getMembroNome(fatura.responsavelId) }}
              </span>
              <span class="text-[10px] text-divi-t3 mt-1 block">
                Total Acerto: R$ {{ formatarDinheiro(acerto.valorAcerto.centavos).toFixed(2).replace('.', ',') }}
              </span>
            </div>
            <div class="text-right">
              <span :class="['font-black text-sm block', acerto.pago ? 'text-divi-emerald text-glow-emerald' : 'text-divi-rose']">
                {{ acerto.pago ? '✅ Quitado' : 'R$ ' + formatarDinheiro(acerto.valorAcerto.centavos - (acerto.valorPago?.centavos || 0)).toFixed(2).replace('.', ',') + ' Restante' }}
              </span>
              <button 
                v-if="!acerto.pago"
                @click="iniciarPix(acerto)"
                class="text-[10px] font-black text-divi-primary hover:underline mt-1"
              >
                Registrar Pix
              </button>
            </div>
          </div>

          <!-- Barra de Progresso do Reembolso -->
          <div class="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-divi-border">
            <div 
              class="bg-gradient-to-r from-divi-primary to-divi-violet h-full rounded-full transition-all duration-300"
              :style="{ width: `${((acerto.valorPago?.centavos || 0) / acerto.valorAcerto.centavos) * 100}%` }"
            ></div>
          </div>

          <!-- Amortização Pix Parcial / Customizado expandido -->
          <div v-if="acertoPixId === acerto.id" class="bg-slate-950 border border-divi-border rounded-2xl p-4 mt-2 space-y-4">
            <div class="flex justify-between items-center mb-1">
              <span class="text-xs font-black uppercase text-divi-primary">Registrar Baixa de Acerto</span>
            </div>

            <!-- Seleção de Método -->
            <div class="flex gap-2">
              <button 
                v-for="m in [{id:'pix', nome:'⚡ Pix'}, {id:'cash', nome:'💵 Dinheiro'}, {id:'mutual', nome:'🤝 Abatimento'}]" 
                :key="m.id"
                @click="metodoAcerto = m.id as any"
                class="flex-1 py-2 px-1 text-[10px] font-extrabold rounded-xl border text-center transition-all"
                :class="metodoAcerto === m.id ? 'bg-divi-primary border-divi-primary text-white shadow-sm' : 'bg-divi-s2 border-divi-border text-divi-t3'"
              >
                {{ m.nome }}
              </button>
            </div>

            <!-- Input de Valor -->
            <div class="space-y-2">
              <div class="flex items-center gap-2">
                <span class="text-divi-t3 text-xs font-bold">R$</span>
                <input 
                  v-model.number="valorPixInput"
                  type="number"
                  step="0.01"
                  class="glass-input rounded-xl p-2.5 font-extrabold text-divi-t1 focus:outline-none focus:border-divi-primary text-xs flex-1"
                />
                <button 
                  @click="enviarReembolsoPix(acerto.id)"
                  class="bg-divi-primary hover:bg-indigo-500 text-white font-black text-xs px-4 py-2 rounded-lg transition-colors"
                >
                  Registrar
                </button>
              </div>

              <!-- Reassurance e Atalho de Quitação com Ajuste -->
              <div class="text-[10px] text-divi-t3 leading-relaxed">
                <span v-if="metodoAcerto === 'mutual'" class="text-divi-amber font-bold block mb-1">
                  💡 Abatimento/Ajuste: Ideal para perdoar centavos ou fazer descontos mútuos.
                </span>
                Deseja quitar a dívida inteira com ajuste redondo? 
                <button 
                  @click="quitarComAjuste(acerto.id)" 
                  class="text-divi-emerald hover:text-emerald-300 font-black underline ml-1 cursor-pointer"
                >
                  Quitar Total
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Botão especial de encerramento de arrecadação -->
        <div v-if="todosOsAcertosQuitados(fatura.id) && !fatura.dataPagamentoBanco" class="bg-divi-emerald-dim border border-emerald-500/20 text-white p-5 rounded-3xl flex flex-col items-center justify-center text-center space-y-2 mt-4 shadow-lg">
          <span class="text-xs font-black uppercase tracking-wider text-divi-emerald text-glow-emerald">🎉 Reembolsos Coletados!</span>
          <span class="text-[11px] text-emerald-300">Todos os moradores já enviaram os reembolsos por Pix.</span>
          <button 
            @click="registrarPagamentoBancoManual(fatura.id)"
            class="bg-divi-emerald hover:bg-emerald-600 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-md transition-colors w-full mt-1 border border-emerald-500/20"
          >
            🏦 Registrar Pagamento ao Banco e Quitar Fatura
          </button>
        </div>
      </div>
    </div>

    <!-- Seção 2: Faturas Abertas (Previsão de Gastos) com Accordion de Compras (Senior v19) -->
    <div class="glass-card rounded-3xl p-6 shadow-2xl space-y-4 text-divi-t1">
      <h3 class="text-xs font-black text-divi-t3 uppercase tracking-widest">🔍 Faturas Abertas (Previsão de Gastos)</h3>
      
      <div v-for="fatura in faturasAbertas" :key="fatura.id" class="border border-divi-border/40 rounded-2xl p-4 bg-slate-950/10 space-y-4 last:mb-0 mb-4">
        <div class="flex justify-between items-center cursor-pointer select-none" @click="toggleFaturaExpandida(fatura.id)">
          <div class="flex flex-col">
            <span class="font-extrabold text-divi-t1 text-sm flex items-center gap-1.5">
              💳 {{ getCartaoNome(fatura.cartaoId) }} • {{ fatura.periodo.mes }}/{{ fatura.periodo.ano }}
              <ChevronDown v-if="!faturasExpandidas[fatura.id]" class="w-3.5 h-3.5 text-divi-t3" />
              <ChevronUp v-else class="w-3.5 h-3.5 text-divi-t3" />
            </span>
            <span class="text-[10px] text-divi-t3 mt-0.5 block leading-normal">
              Total Fatura: R$ {{ formatarDinheiro(calcularTotalFatura(fatura.id)).toFixed(2).replace('.', ',') }} (Clique para ver compras)
            </span>
          </div>
          <button 
            @click.stop="abrirFecharFatura(fatura.id)" 
            class="text-[10.5px] font-black bg-divi-primary hover:bg-indigo-500 border border-indigo-400/25 text-white px-3.5 py-2.5 rounded-xl shadow-[0_0_12px_var(--primary-glow)] transition-all disabled:opacity-40 disabled:pointer-events-none active:scale-95 shrink-0"
            :disabled="isMonthLocked"
          >
            Fechar Fatura
          </button>
        </div>

        <!-- Accordion de Compras em Tempo Real (Senior v19) -->
        <div v-if="faturasExpandidas[fatura.id]" class="border-t border-divi-border/40 pt-3 space-y-2 max-h-60 overflow-y-auto pr-1">
          <div 
            v-for="g in gastosDaFatura(fatura.id)" 
            :key="g.id"
            class="flex justify-between items-center py-2 px-3 bg-slate-950/20 border border-divi-border/30 rounded-xl text-xs"
          >
            <div>
              <span class="font-bold text-divi-t1 block leading-tight">{{ g.descricao }} {{ g.installments > 1 ? `(${g.installments}x)` : '' }}</span>
              <span class="text-[9px] text-divi-t3 mt-0.5 block">Pago por {{ getMembroNome(g.compradorId) }}</span>
            </div>
            <span class="font-black text-divi-t1 shrink-0">R$ {{ (g.valorTotal.centavos / 100).toFixed(2).replace('.', ',') }}</span>
          </div>
          <div v-if="gastosDaFatura(fatura.id).length === 0" class="text-center py-3 text-[10px] text-divi-t3">
            Nenhuma compra registrada nesta fatura.
          </div>
        </div>

        <div class="space-y-3 border-t border-divi-border/30 pt-3.5">
          <div v-for="membro in membros" :key="membro.id" class="flex flex-col border-b border-divi-border/40 pb-2.5 mb-2.5 last:border-0 last:pb-0 last:mb-0">
            <div class="flex justify-between items-center text-xs">
              <span class="font-bold text-divi-t2 flex items-center gap-1">
                {{ membro.nome }} 
                <span v-if="membro.id === fatura.responsavelId" class="text-[8.5px] text-divi-primary font-black uppercase bg-divi-primary-dim px-1 py-0.5 rounded-md border border-indigo-500/10">Dono</span>:
              </span>
              <span class="font-extrabold text-divi-t1">
                Pendente: R$ {{ formatarDinheiro(getConsumo(fatura.id, membro.id) - getAdiantamento(fatura.id, membro.id)).toFixed(2).replace('.', ',') }}
              </span>
            </div>
            <div class="flex justify-between items-center text-[10px] text-divi-t3 mt-1 pl-2">
              <span>Consumo: R$ {{ formatarDinheiro(getConsumo(fatura.id, membro.id)).toFixed(2).replace('.', ',') }}</span>
              <span v-if="getAdiantamento(fatura.id, membro.id) > 0" class="text-divi-emerald font-bold">
                Adiantado: - R$ {{ formatarDinheiro(getAdiantamento(fatura.id, membro.id)).toFixed(2).replace('.', ',') }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Painel de Parcelas Futuras (A Vencer) (Senior v19) -->
    <div v-if="totalFuturasVencer > 0" class="glass-card rounded-3xl p-6 shadow-2xl text-divi-t1 relative overflow-hidden">
      <div class="absolute -top-10 -right-10 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl"></div>
      <div class="flex justify-between items-center cursor-pointer select-none" @click="showParcelasFuturas = !showParcelasFuturas">
        <div class="flex items-center gap-2">
          <TrendingUp class="w-4 h-4 text-amber-400 shrink-0" />
          <div>
            <h3 class="text-xs font-black text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
              ⏳ Parcelas Futuras
            </h3>
            <p class="text-[10px] text-divi-t3 mt-0.5 leading-normal">
              Projeção de cobranças nos meses subsequentes
            </p>
          </div>
        </div>
        <span class="text-xs font-black text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3.5 py-1.5 rounded-xl shadow-md flex items-center gap-1 shrink-0">
          R$ {{ totalFuturasVencer.toFixed(2).replace('.', ',') }}
          <ChevronDown v-if="!showParcelasFuturas" class="w-3.5 h-3.5" />
          <ChevronUp v-else class="w-3.5 h-3.5" />
        </span>
      </div>

      <!-- Accordion de Parcelas Detalhadas -->
      <div v-if="showParcelasFuturas" class="border-t border-divi-border/40 pt-4 mt-3 space-y-2 max-h-60 overflow-y-auto pr-1">
        <div 
          v-for="p in parcelasFuturasDetalhadas" 
          :key="p.id"
          class="flex justify-between items-center py-2.5 px-3.5 bg-slate-950/20 border border-divi-border/30 rounded-2xl text-xs"
        >
          <div>
            <span class="font-bold text-divi-t1 block leading-tight">{{ p.descricao }}</span>
            <span class="text-[9px] text-divi-t3 mt-0.5 block">Faltam {{ p.restantes }}x de R$ {{ p.valorParcela.toFixed(2).replace('.', ',') }} ({{ p.responsavel }})</span>
          </div>
          <span class="font-black text-amber-400 shrink-0">R$ {{ p.totalFuturo.toFixed(2).replace('.', ',') }}</span>
        </div>
      </div>
    </div>

    <!-- Checklist de Contas Fixas Recorrentes (Fase 2) -->
    <ContasFixasPanel 
      :contasFixas="contasFixas"
      :gastos="globalGastos"
      :membros="props.membros"
      :isMonthLocked="isMonthLocked"
      @lancar="abrirLancarBill"
      @configurar="abrirConfigurarBill"
      @novo="abrirNovoBill"
    />

    <!-- Histórico de Faturas Acertadas (Gap 5) -->
    <div class="mt-8">
      <HistoricoFaturas :membros="props.membros" />
    </div>

    <!-- Feed de Lançamentos Recentes (Senior v19) -->
    <div class="mt-8">
      <ActivityFeed 
        :gastos="globalGastos"
        :membros="props.membros"
        :is-month-locked="isMonthLocked"
        @desfazerGasto="excluirGasto"
        @ajustarGasto="abrirAjustarGasto"
      />
    </div>

    <!-- Modal de Fechamento de Fatura com Dono Variável (Gap 6) -->
    <ModalFecharFatura 
      :show="showModalFechar"
      :fatura="faturaParaFechar"
      :membros="props.membros"
      @close="showModalFechar = false"
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

    <ModalConfigurarContaFixa 
      :visible="showModalConfigCF"
      :bill="billSelecionada"
      :membros="props.membros"
      @save="confirmarSalvarTemplate"
      @delete="confirmarDeletarTemplate"
      @cancel="showModalConfigCF = false"
    />

    <!-- Modal Novo Período (Fase 3) -->
    <div v-if="showModalNovoPeriodo" class="fixed inset-0 bg-[#040814]/80 backdrop-blur-md flex items-center justify-center z-[9999] p-4">
      <div class="glass-card w-full max-w-sm rounded-3xl shadow-2xl p-6 border border-divi-border relative text-divi-t1 space-y-4 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
        <h3 class="text-xl font-black text-divi-t1 flex items-center gap-2 mb-1">🚀 Iniciar Novo Período</h3>
        <p class="text-xs text-divi-t2 leading-relaxed mb-1">
          Isso trancará o mês anterior permanentemente, calculará o netting dos saldos e os transportará como saldo inicial para o novo período.
        </p>
        
        <div class="space-y-2">
          <label class="block text-xs font-black uppercase text-divi-t2 tracking-wider">Nome do Novo Período</label>
          <input 
            type="text" 
            v-model="nomeNovoPeriodo" 
            class="w-full px-4 py-3 rounded-2xl glass-input outline-none font-bold text-divi-t1 text-sm focus:border-divi-primary" 
            placeholder="Ex: Junho 2026"
          />
        </div>

        <div class="flex justify-end gap-3 pt-2">
          <button @click="showModalNovoPeriodo = false" class="px-5 py-3 text-xs font-black bg-divi-s2 hover:bg-divi-s3 text-divi-t1 border border-divi-border rounded-2xl transition-all">Cancelar</button>
          <button @click="confirmarNovoPeriodo" class="px-5 py-3 text-xs font-black bg-divi-amber border border-amber-500/25 hover:bg-amber-600 text-slate-950 font-black rounded-2xl shadow-[0_0_16px_var(--amber-dim)] transition-all" :disabled="!nomeNovoPeriodo.trim()">Confirmar e Girar</button>
        </div>
      </div>
    </div>

    <!-- Modal de Netting Otimizado (Senior v19) -->
    <ModalAcertoCompensacao 
      :visible="showModalNetting"
      :from-id="nettingTarget?.from"
      :to-id="nettingTarget?.to"
      :from-name="getMembroNome(nettingTarget?.from)"
      :to-name="getMembroNome(nettingTarget?.to)"
      :suggested-value="nettingTarget?.val || 0"
      @cancel="showModalNetting = false"
      @confirm="confirmarBaixaNetting"
    />

    <!-- Modal de Ajuste de Lançamento (✏️ Ajustar) -->
    <ModalAjustarGasto 
      :visible="showModalAjustar"
      :gasto="gastoParaAjustar"
      :membros="props.membros"
      :cartoes="props.cartoes"
      @cancel="showModalAjustar = false"
      @save="confirmarAjusteGasto"
    />
  </div>
</template>
