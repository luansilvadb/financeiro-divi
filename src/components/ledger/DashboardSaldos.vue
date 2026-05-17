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
import Card from '../ui/Card.vue'
import Button from '../ui/Button.vue'
import SectionLabel from '../ui/SectionLabel.vue'
import { 
  Check,
  ArrowUpRight, 
  TrendingUp, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  Lock, 
  Unlock,
  CreditCard,
  History,
  Activity
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

  <div v-else class="space-y-12">
    <!-- BARRA DE TRANCAMENTO (Design System Family) -->
    <div 
      class="flex justify-between items-center p-4 rounded-xl border transition-all duration-300 shadow-subtle bg-parchment-card"
      :class="isMonthLocked 
        ? 'border-ember/20 bg-ember/5 text-charcoal' 
        : 'border-stone-surface text-graphite'"
    >
      <div class="flex items-center gap-4">
        <div 
          class="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
          :class="isMonthLocked ? 'bg-ember text-white' : 'bg-stone-surface border border-stone-surface text-ash'"
        >
          <Lock v-if="isMonthLocked" class="w-4 h-4" />
          <Unlock v-else class="w-4 h-4" />
        </div>
        <div>
          <span class="font-bold block text-sm leading-tight text-charcoal">{{ isMonthLocked ? 'Período Trancado' : 'Período Aberto' }}</span>
          <span class="text-[11px] text-ash block mt-0.5 leading-normal">
            {{ isMonthLocked ? 'Lançamentos congelados.' : 'Lançamentos liberados.' }}
          </span>
        </div>
      </div>
      <div class="flex gap-2">
        <Button 
          v-if="isMonthLocked"
          @click="abrirNovoPeriodoModal"
          size="sm"
          variant="primary"
          class="h-9 px-4 text-[11px]"
        >
          🚀 Novo Período
        </Button>
        <Button 
          variant="secondary"
          @click="setMonthLocked(!isMonthLocked)"
          size="sm"
          class="h-9 px-4 text-[11px] border border-stone-surface"
        >
          {{ isMonthLocked ? 'Destrancar' : 'Trancar' }}
        </Button>
      </div>
    </div>

    <!-- Painel de Saldo Real Unificado (Design System Family) -->
    <section class="space-y-6">
      <div class="flex justify-between items-end">
        <div class="space-y-2">
          <SectionLabel>Visão Geral</SectionLabel>
          <h2 class="text-heading font-display text-charcoal">Saldo <span class="text-ember">Unificado</span></h2>
        </div>
        <span class="text-[10px] font-mono uppercase tracking-widest text-ash bg-stone px-3 py-1 rounded-full border border-stone-surface">
          {{ currentMonthName }}
        </span>
      </div>

      <Card class="overflow-hidden relative bg-card shadow-subtle p-8 rounded-cards">
        <div class="space-y-4 relative z-10">
          <div 
            v-for="m in props.membros" 
            :key="m.id" 
            class="group flex justify-between items-center p-4 rounded-xl border border-stone bg-[#fbfaf9] hover:border-ember/30 hover:bg-white transition-all duration-300"
          >
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-full bg-stone flex items-center justify-center font-display text-lg text-charcoal group-hover:bg-ember group-hover:text-white transition-all">
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
              <span :class="['font-display text-xl block', saldosUnificadosAtivos[m.id] > 0.005 ? 'text-meadow' : saldosUnificadosAtivos[m.id] < -0.005 ? 'text-coral-red' : 'text-ash']">
                {{ saldosUnificadosAtivos[m.id] > 0.005 ? '+' : '' }}R$ {{ saldosUnificadosAtivos[m.id]?.toFixed(2).replace('.', ',') }}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </section>

    <!-- Detalhamento Granular de Saldos por Coluna (Senior v19) -->
    <div class="mt-6">
      <DetalhamentoSaldosCard 
        :membros="props.membros"
        :gastos="globalGastos"
        :saldosUnificados="saldosUnificadosAtivos"
      />
    </div>

    <!-- Seção 3: Faturas Fechadas (Acertos & Reembolsos) (Minimalist Modern) -->
    <section v-if="faturasFechadas.length > 0" class="space-y-6">
      <div class="space-y-2">
        <SectionLabel>Liquidação</SectionLabel>
        <h2 class="text-3xl font-display text-charcoal">Faturas <span class="text-ember">Fechadas</span></h2>
      </div>

      <div class="grid gap-6">
        <Card 
          v-for="fatura in faturasFechadas" 
          :key="fatura.id" 
          class="p-0 overflow-hidden"
        >
          <!-- Cabeçalho -->
          <div class="p-6 border-b border-border bg-muted/30 flex justify-between items-center">
            <div class="flex items-center gap-4">
              <div class="w-10 h-10 rounded-xl bg-accent text-white flex items-center justify-center">
                <History class="w-5 h-5" />
              </div>
              <div>
                <h3 class="font-bold text-lg leading-tight">{{ getCartaoNome(fatura.cartaoId) }}</h3>
                <p class="text-[11px] text-muted-foreground uppercase tracking-wider mt-0.5">
                  Período: {{ fatura.periodo.mes }}/{{ fatura.periodo.ano }}
                </p>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <span v-if="todosOsAcertosQuitados(fatura.id) && fatura.dataPagamentoBanco" class="text-[9px] font-bold text-accent bg-accent/10 px-3 py-1 rounded-full border border-accent/20">QUITADA</span>
              <Button variant="ghost" size="sm" @click="emit('reabrirFatura', fatura.id)" class="text-[10px] h-8">
                Reabrir
              </Button>
            </div>
          </div>

          <div class="p-6 space-y-6">
            <!-- SUB-ESTADO A: EM REVISÃO -->
            <div v-if="!faturaTemAcertosAtivos(fatura.id)" class="text-center space-y-4 py-4">
              <div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent/5 text-accent mb-2">
                <Sparkles class="w-6 h-6" />
              </div>
              <div class="space-y-1">
                <p class="font-bold text-foreground">Fatura em Revisão Coletiva</p>
                <p class="text-xs text-muted-foreground">Total: R$ {{ formatarDinheiro(calcularTotalFatura(fatura.id)).toFixed(2).replace('.', ',') }}</p>
              </div>
              <Button variant="primary" class="w-full" @click="faturaSobRevisao = fatura">
                Revisar e Ratear
              </Button>
            </div>

            <!-- SUB-ESTADO B: ACERTOS ATIVOS -->
            <div v-else class="space-y-8">
              <!-- Banner de Status de Pagamento ao Banco -->
              <div v-if="fatura.dataPagamentoBanco" class="flex items-center justify-between p-4 rounded-xl bg-accent/5 border border-accent/20">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center">
                    <Check class="w-4 h-4" />
                  </div>
                  <p class="text-xs text-accent font-medium leading-tight">
                    Fatura paga ao banco!<br>
                    <span class="text-[10px] opacity-80">Reembolse o responsável via Pix.</span>
                  </p>
                </div>
                <Button variant="ghost" size="sm" @click="removerPagamentoBancoManual(fatura.id)" class="text-red-500 hover:text-red-600 hover:bg-red-50">
                  Estornar
                </Button>
              </div>

              <div v-else class="flex flex-col items-center gap-4 p-6 rounded-xl bg-muted/50 border border-border text-center">
                <p class="text-xs text-muted-foreground font-medium">
                  Aguardando pagamento ao banco pelo responsável.
                </p>
                <Button variant="secondary" size="sm" @click="registrarPagamentoBancoManual(fatura.id)">
                  Já paguei o banco
                </Button>
              </div>

              <!-- Lista de Acertos -->
              <div class="space-y-4">
                <div class="flex items-center gap-2 mb-2">
                  <SectionLabel :pulse="false" class="px-3 py-1">Reembolsos</SectionLabel>
                </div>

                <div v-for="acerto in acertosDaFatura(fatura.id)" :key="acerto.id" class="p-4 rounded-xl border border-border bg-background space-y-4">
                  <div class="flex justify-between items-start">
                    <div class="flex items-center gap-3">
                      <div class="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-display text-xs">
                        {{ getMembroNome(acerto.membroId)[0] }}
                      </div>
                      <div>
                        <p class="text-sm font-bold text-foreground">
                          {{ getMembroNome(acerto.membroId) }} → {{ getMembroNome(fatura.responsavelId) }}
                        </p>
                        <p class="text-[10px] text-muted-foreground">
                          Total: R$ {{ formatarDinheiro(acerto.valorAcerto.centavos).toFixed(2).replace('.', ',') }}
                        </p>
                      </div>
                    </div>
                    <div class="text-right">
                      <p :class="['text-sm font-bold', acerto.pago ? 'text-accent' : 'text-red-500']">
                        {{ acerto.pago ? '✓ Quitado' : 'R$ ' + formatarDinheiro(acerto.valorAcerto.centavos - (acerto.valorPago?.centavos || 0)).toFixed(2).replace('.', ',') }}
                      </p>
                      <button v-if="!acerto.pago" @click="iniciarPix(acerto)" class="text-[10px] font-bold text-accent hover:underline mt-1">
                        Registrar Pix
                      </button>
                    </div>
                  </div>

                  <!-- Barra de Progresso Minimalist -->
                  <div class="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div 
                      class="h-full bg-accent transition-all duration-500"
                      :style="{ width: `${((acerto.valorPago?.centavos || 0) / acerto.valorAcerto.centavos) * 100}%` }"
                    />
                  </div>

                  <!-- Input de Pix Parcial -->
                  <div v-if="acertoPixId === acerto.id" class="pt-4 border-t border-border space-y-4 animate-in fade-in slide-in-from-top-2">
                    <div class="flex items-center gap-3">
                      <div class="relative flex-1">
                        <span class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-bold">R$</span>
                        <input 
                          v-model.number="valorPixInput"
                          type="number"
                          step="0.01"
                          class="w-full pl-9 pr-4 py-2 rounded-lg border border-border bg-muted/30 focus:border-accent outline-none text-sm font-bold"
                        />
                      </div>
                      <Button size="sm" @click="enviarReembolsoPix(acerto.id)">Registrar</Button>
                    </div>
                    <p class="text-[10px] text-muted-foreground">
                      Ou <button @click="quitarComAjuste(acerto.id)" class="text-accent font-bold underline">Quitar Valor Total</button>
                    </p>
                  </div>
                </div>
              </div>

              <!-- CTA Final: Todos quitados mas banco não pago -->
              <div v-if="todosOsAcertosQuitados(fatura.id) && !fatura.dataPagamentoBanco" class="p-6 rounded-2xl bg-accent text-white text-center space-y-4 shadow-accent-lg">
                <div class="space-y-1">
                  <p class="font-display text-xl">Tudo Coletado!</p>
                  <p class="text-xs opacity-90">Todos os moradores já reembolsaram. Hora de pagar o banco.</p>
                </div>
                <Button variant="inverted" class="w-full" @click="registrarPagamentoBancoManual(fatura.id)">
                  Registrar Pagamento ao Banco
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </section>

    <!-- Painel de Compensação Otimizada (Design System Family) -->
    <section v-if="nettingTransferencias.length > 0" class="space-y-6">
      <div class="space-y-2">
        <SectionLabel>Eficiência</SectionLabel>
        <h2 class="text-3xl font-display text-charcoal">Acertos <span class="text-ember">Otimizados</span></h2>
      </div>
      
      <div class="grid gap-4">
        <Card 
          v-for="t in nettingTransferencias" 
          :key="t.from + '-' + t.to" 
          class="p-5 border-l-4 border-l-ember bg-card shadow-subtle rounded-cards"
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
            <Button 
              @click="abrirModalNetting(t)"
              :disabled="isMonthLocked"
              variant="primary"
              class="w-full md:w-auto"
            >
              Confirmar Pix
            </Button>
          </div>
        </Card>
      </div>
    </section>

    <!-- Seção 2: Faturas Abertas (Design System Family) -->
    <section class="space-y-6">
      <div class="space-y-2">
        <SectionLabel>Gastos Ativos</SectionLabel>
        <h2 class="text-3xl font-display text-charcoal">Próximas <span class="text-ember">Faturas</span></h2>
      </div>
      
      <div class="grid gap-6">
        <Card 
          v-for="fatura in faturasAbertas" 
          :key="fatura.id" 
          class="p-0 overflow-hidden"
        >
          <div class="p-6 border-b border-border bg-muted/30 flex justify-between items-center">
            <div class="flex items-center gap-4">
              <div class="w-10 h-10 rounded-xl bg-foreground text-background flex items-center justify-center">
                <CreditCard class="w-5 h-5" />
              </div>
              <div>
                <h3 class="font-bold text-lg leading-tight">{{ getCartaoNome(fatura.cartaoId) }}</h3>
                <p class="text-[11px] text-muted-foreground uppercase tracking-wider mt-0.5">
                  Vencimento: {{ fatura.periodo.mes }}/{{ fatura.periodo.ano }}
                </p>
              </div>
            </div>
            <Button 
              variant="secondary"
              size="sm"
              @click="abrirFecharFatura(fatura.id)"
              :disabled="isMonthLocked"
            >
              Fechar Fatura
            </Button>
          </div>

          <div class="p-6 space-y-6">
            <!-- Resumo por membro -->
            <div class="grid gap-4">
              <div 
                v-for="membro in membros" 
                :key="membro.id" 
                class="flex justify-between items-center"
              >
                <div class="flex items-center gap-3">
                  <div class="w-2 h-2 rounded-full" :class="membro.id === fatura.responsavelId ? 'bg-accent' : 'bg-muted-foreground/30'" />
                  <span class="text-sm font-medium" :class="membro.id === fatura.responsavelId ? 'text-foreground' : 'text-muted-foreground'">
                    {{ membro.nome }}
                  </span>
                </div>
                <div class="text-right">
                  <span class="text-sm font-bold block">
                    R$ {{ formatarDinheiro(getConsumo(fatura.id, membro.id) - getAdiantamento(fatura.id, membro.id)).toFixed(2).replace('.', ',') }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Toggle Detalhes -->
            <button 
              @click="toggleFaturaExpandida(fatura.id)"
              class="w-full flex items-center justify-center gap-2 py-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground hover:text-accent transition-colors border-t border-border pt-4"
            >
              <Activity class="w-3.5 h-3.5" />
              {{ faturasExpandidas[fatura.id] ? 'Ocultar Itens' : 'Ver Detalhes da Fatura' }}
            </button>

            <!-- Lista de Gastos (Expandida) -->
            <div v-if="faturasExpandidas[fatura.id]" class="space-y-3 pt-2">
              <div 
                v-for="g in gastosDaFatura(fatura.id)" 
                :key="g.id"
                class="flex justify-between items-center p-3 rounded-lg bg-muted/50 text-xs"
              >
                <div>
                  <span class="font-bold text-foreground block">{{ g.descricao }} {{ g.installments > 1 ? `(${g.installments}x)` : '' }}</span>
                  <span class="text-[10px] text-muted-foreground mt-0.5 block">Por {{ getMembroNome(g.compradorId) }}</span>
                </div>
                <span class="font-bold text-foreground">R$ {{ (g.valorTotal.centavos / 100).toFixed(2).replace('.', ',') }}</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </section>

    <!-- Painel de Parcelas Futuras (Minimalist Modern) -->
    <section v-if="totalFuturasVencer > 0" class="space-y-6">
      <div class="space-y-2">
        <SectionLabel :pulse="false" class="border-amber-500/30 bg-amber-500/5 text-amber-600">
          <span class="bg-amber-500"></span>
          Projeção
        </SectionLabel>
        <h2 class="text-3xl font-display">Parcelas <span class="text-amber-500">Futuras</span></h2>
      </div>

      <Card class="overflow-hidden">
        <div 
          class="p-6 flex justify-between items-center cursor-pointer hover:bg-muted/30 transition-colors"
          @click="showParcelasFuturas = !showParcelasFuturas"
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

        <div v-if="showParcelasFuturas" class="border-t border-border p-6 space-y-3 bg-muted/20">
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

    <!-- Checklist de Contas Fixas (Design System Family) -->
    <section class="space-y-6">
      <div class="space-y-2">
        <SectionLabel>Recorrência</SectionLabel>
        <h2 class="text-3xl font-display text-charcoal">Contas <span class="text-ember">Fixas</span></h2>
      </div>
      <ContasFixasPanel 
        :contasFixas="contasFixas"
        :gastos="globalGastos"
        :membros="props.membros"
        :isMonthLocked="isMonthLocked"
        @lancar="abrirLancarBill"
        @configurar="abrirConfigurarBill"
        @novo="abrirNovoBill"
      />
    </section>

    <!-- Histórico de Faturas Acertadas (Design System Family) -->
    <section class="space-y-6">
      <div class="space-y-2">
        <SectionLabel>Arquivo</SectionLabel>
        <h2 class="text-3xl font-display text-charcoal">Histórico de <span class="text-ember">Faturas</span></h2>
      </div>
      <HistoricoFaturas :membros="props.membros" />
    </section>

    <!-- Feed de Lançamentos Recentes (Design System Family) -->
    <section class="space-y-6">
      <div class="space-y-2">
        <SectionLabel>Atividade</SectionLabel>
        <h2 class="text-3xl font-display text-charcoal">Últimos <span class="text-ember">Lançamentos</span></h2>
      </div>
      <ActivityFeed 
        :gastos="globalGastos"
        :membros="props.membros"
        :is-month-locked="isMonthLocked"
        @desfazerGasto="excluirGasto"
        @ajustarGasto="abrirAjustarGasto"
      />
    </section>

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

    <!-- Modal Novo Período (Design System Family) -->
    <div v-if="showModalNovoPeriodo" class="fixed inset-0 bg-midnight/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-6">
      <Card class="w-full max-w-md p-0 overflow-hidden bg-card shadow-lg rounded-cards">
        <div class="p-8 space-y-6">
          <div class="space-y-2 text-center">
            <SectionLabel class="mx-auto">Transição</SectionLabel>
            <h3 class="text-3xl font-display text-charcoal">Novo <span class="text-ember">Período</span></h3>
            <p class="text-xs text-ash leading-relaxed">
              O mês anterior será trancado permanentemente. O saldo será transportado automaticamente para o novo período.
            </p>
          </div>
          
          <div class="space-y-3">
            <label class="block text-[10px] font-bold uppercase text-ash tracking-widest ml-1">Mês de Referência</label>
            <input 
              type="text" 
              v-model="nomeNovoPeriodo" 
              class="w-full px-4 py-3 rounded-xl border border-stone bg-[#fbfaf9] outline-none font-bold text-charcoal focus:border-ember transition-all" 
              placeholder="Ex: Junho 2026"
            />
          </div>

          <div class="grid grid-cols-2 gap-3 pt-2">
            <Button variant="secondary" @click="showModalNovoPeriodo = false">Cancelar</Button>
            <Button variant="primary" @click="confirmarNovoPeriodo" :disabled="!nomeNovoPeriodo.trim()">Confirmar</Button>
          </div>
        </div>
      </Card>
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
