import { ref, watch, computed } from 'vue'
import { Fatura } from '../models/entities/Fatura'
import { Dinheiro } from '../models/entities/Dinheiro'
import { useCartoesEFaturas } from './useCartoesEFaturas'
import { useContasFixas } from './useContasFixas'
import { useFaturaRollover } from './useFaturaRollover'
import { useDashboardCalculations } from './useDashboardCalculations'
import { calcularSaldosUnificados, calcularTransacoesNetting } from '../models/services/NettingService'
import type { IGastoService } from '../models/services/IGastoService'
import type { IFaturaRolloverService } from '../models/services/IFaturaRolloverService'
import { formatarMesAno, gerarListaMesesSeletor } from '../shared/utils/meses'
import { obterPeriodoSelecionado, salvarPeriodoSelecionado } from './storage/periodoStorage'
import type { IGastoRepository } from '../models/repositories/IGastoRepository'
import type { IFaturaRepository } from '../models/repositories/IFaturaRepository'
import type { ICartaoRepository } from '../models/repositories/ICartaoRepository'
import type { IContaFixaRepository } from '../models/repositories/IContaFixaRepository'
import {
  gastoRepository,
  faturaRepository,
  cartaoRepository,
  faturaRolloverService,
  gastoService
} from '../shared/container'

export interface DashboardProps {
  membros: { id: string; nome: string; ativo?: boolean }[]
  faturasAbertas: any[]
  faturasFechadas: any[]
  acertosPendentes: any[]
  cartoes: any[]
  calcularConsumo: (faturaId: string, membroId: string) => number
  activeTab?: any
}

export interface DashboardDependencies {
  gastoRepository?: IGastoRepository
  faturaRepository?: IFaturaRepository
  cartaoRepository?: ICartaoRepository
  contaFixaRepository?: IContaFixaRepository
  faturaRolloverService?: IFaturaRolloverService
  gastoService?: IGastoService
}

function obterPeriodoInicial(faturasAbertas: any[], faturasFechadas: any[]): { mes: number; ano: number } {
  const faturaReferencia = faturasAbertas?.[0] || faturasFechadas?.[0]
  const fallback = faturaReferencia?.periodo
    ? { mes: faturaReferencia.periodo.mes, ano: faturaReferencia.periodo.ano }
    : undefined
  return obterPeriodoSelecionado(fallback)
}

export function useDashboardViewModel(
  props: DashboardProps,
  emit: any,
  dependencies: DashboardDependencies = {}
) {
  const gastoRepo = dependencies.gastoRepository || gastoRepository
  const faturaRepo = dependencies.faturaRepository || faturaRepository
  const cartaoRepo = dependencies.cartaoRepository || cartaoRepository
  const rolloverService = dependencies.faturaRolloverService || faturaRolloverService
  const localGastoService = dependencies.gastoService || gastoService

  // --- Estado de Período ---
  const periodoSelecionado = ref<{ mes: number; ano: number }>(obterPeriodoInicial(props.faturasAbertas, props.faturasFechadas))

  watch(periodoSelecionado, (novos) => {
    salvarPeriodoSelecionado(novos)
  }, { deep: true, immediate: true })

  const faturaSelecionadaTrancada = computed(() => {
    const p = periodoSelecionado.value
    return props.faturasFechadas.some(f => f.periodo.mes === p.mes && f.periodo.ano === p.ano)
  })

  watch(faturaSelecionadaTrancada, (isLocked) => {
    emit('periodoStatusChanged', isLocked)
  }, { immediate: true })

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

  // --- Seletor de Meses ---
  const listaMesesSeletor = computed(() => gerarListaMesesSeletor(props.faturasFechadas))

  const mesesAbertosOpcoes = computed(() => listaMesesSeletor.value.filter(item => item.status === 'ABERTA'))
  const mesesTrancadosOpcoes = computed(() => listaMesesSeletor.value.filter(item => item.status === 'FECHADA'))

  // --- UI States ---
  const showBottomSheetHistorico = ref(false)
  const showBottomSheetFechar = ref(false)
  const faturaParaFechar = ref<any | null>(null)
  const showBottomSheetAjustar = ref(false)
  const gastoParaAjustar = ref<any | null>(null)
  const showPopupLancar = ref(false)
  const showBottomSheetConfigCF = ref(false)
  const billSelecionada = ref<any | null>(null)
  const showBottomSheetNovoPeriodo = ref(false)
  const nomeNovoPeriodo = ref('')
  const showBottomSheetNetting = ref(false)
  const nettingTarget = ref<any | null>(null)
  const showParcelasFuturas = ref(false)
  const isDropdownAbertosOpen = ref(false)
  const acertoPixId = ref<string | null>(null)
  const valorPixInput = ref(0)
  const isSubmittingPix = ref(false)

  // --- Toggle Methods (apenas os que são usados no template) ---
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

  const abrirAjustarGasto = (gasto: any) => {
    gastoParaAjustar.value = gasto
    showBottomSheetAjustar.value = true
  }

  const abrirBottomSheetNetting = (transferencia: any) => {
    nettingTarget.value = transferencia
    showBottomSheetNetting.value = true
  }

  // --- Composables e Services ---
  const cartoesEFaturas = useCartoesEFaturas({
    cartaoRepository: cartaoRepo,
    faturaRepository: faturaRepo,
    gastoRepository: gastoRepo,
    gastoService: localGastoService
  })
  const { contasFixas, salvarContaFixa, excluirContaFixa, lancarGastoContaFixa } = useContasFixas({
    contaFixaRepository: dependencies.contaFixaRepository,
    gastoService: localGastoService
  })
  const { executarRolloverPeriodo } = useFaturaRollover({
    faturaRepository: faturaRepo,
    gastoRepository: gastoRepo,
    faturaRolloverService: rolloverService
  })

  const {
    registrarReembolsoParcialManual,
    fecharFaturaManual,
    quitarAcertoMembro,
    atualizarGastoCompletoManual,
    gastos: globalGastos,
    acertos: globalAcertos
  } = cartoesEFaturas

  // --- Calculations ---
  const faturasFiltradasCalculations = computed(() => {
    const ativa = faturaAtivaVisualizada.value
    return ativa ? [ativa] : []
  })

  const calculations = computed(() => {
    return useDashboardCalculations(
      props.membros,
      faturasFiltradasCalculations.value,
      props.acertosPendentes,
      globalGastos.value,
      globalAcertos.value,
      props.calcularConsumo
    )
  })

  const getMembroNome = (id: string) => calculations.value.getMembroNome(id)
  const formatarDinheiro = (centavos: number) => calculations.value.formatarDinheiro(centavos)
  const calcularTotalFatura = (faturaId: string) => calculations.value.calcularTotalFatura(faturaId)
  const acertosDaFatura = (faturaId: string) => calculations.value.acertosDaFatura(faturaId)
  const gastosDaFatura = (faturaId: string) => calculations.value.gastosDaFatura(faturaId)
  const todosOsAcertosQuitados = (faturaId: string) => calculations.value.todosOsAcertosQuitados(faturaId)
  const currentMonthName = computed(() => calculations.value.currentMonthName.value)
  const currentYear = computed(() => calculations.value.currentYear.value)
  const parcelasFuturasDetalhadas = computed(() => calculations.value.parcelasFuturasDetalhadas.value)

  // --- Dados Derivados ---
  const gastosFaturaSelecionada = computed(() => {
    const fatId = faturaAtivaVisualizada.value?.id
    if (!fatId) return []
    return globalGastos.value.filter(g => g.faturaId === fatId)
  })

  const saldosUnificadosAtivos = computed(() => {
    const activeFaturaId = faturaAtivaVisualizada.value?.id
    if (!activeFaturaId) return {}
    const gastosPeriodo = globalGastos.value.filter(g => g.faturaId === activeFaturaId)
    return calcularSaldosUnificados(props.membros, gastosPeriodo)
  })

  const nettingTransferencias = computed(() => calcularTransacoesNetting(saldosUnificadosAtivos.value))

  const membrosVisiveis = computed(() => {
    return props.membros.filter(m => {
      if (m.ativo !== false) return true
      const saldo = saldosUnificadosAtivos.value[m.id] || 0
      return Math.abs(saldo) > 0.005
    })
  })

  const totalFuturasVencer = computed(() => {
    return parcelasFuturasDetalhadas.value.reduce((acc, p) => acc + p.totalFuturo, 0)
  })

  // --- Ações de Negócio ---
  const confirmarFechamentoFatura = async (faturaId: string, responsavelId: string) => {
    await fecharFaturaManual(faturaId, responsavelId)
    showBottomSheetFechar.value = false
    faturaParaFechar.value = null
    await cartoesEFaturas.inicializar()
  }

  const confirmarAjusteGasto = async (dados: any) => {
    if (!gastoParaAjustar.value) return
    await atualizarGastoCompletoManual(gastoParaAjustar.value.id, dados)
    showBottomSheetAjustar.value = false
    gastoParaAjustar.value = null
    await cartoesEFaturas.inicializar()
  }

  const iniciarPix = (acerto: any) => {
    acertoPixId.value = acerto.id
    valorPixInput.value = formatarDinheiro(acerto.valorAcerto.centavos - (acerto.valorPago?.centavos || 0))
  }

  const enviarReembolsoPix = async (acertoId: string) => {
    if (valorPixInput.value <= 0) return
    isSubmittingPix.value = true
    try {
      await registrarReembolsoParcialManual(acertoId, Dinheiro.deReais(valorPixInput.value))
      acertoPixId.value = null
      await cartoesEFaturas.inicializar()
    } finally {
      isSubmittingPix.value = false
    }
  }

  const quitarComAjuste = async (acertoId: string) => {
    isSubmittingPix.value = true
    try {
      await quitarAcertoMembro(acertoId)
      acertoPixId.value = null
      await cartoesEFaturas.inicializar()
    } finally {
      isSubmittingPix.value = false
    }
  }

  const confirmarLancarBill = async (dados: { valorReal: number; compradorId: string; splitIds: string[] }) => {
    const activeFaturaId = faturaAtivaVisualizada.value?.id
    if (!activeFaturaId) return
    await lancarGastoContaFixa(activeFaturaId, billSelecionada.value, dados.valorReal, dados.compradorId, dados.splitIds)
    showPopupLancar.value = false
    await cartoesEFaturas.inicializar()
  }

  const confirmarSalvarTemplate = (template: any) => {
    salvarContaFixa(template)
    showBottomSheetConfigCF.value = false
  }

  const confirmarDeletarTemplate = (id: string) => {
    excluirContaFixa(id)
    showBottomSheetConfigCF.value = false
  }

  const abrirNovoPeriodoBottomSheet = () => {
    const fat = faturaAtivaVisualizada.value
    if (fat) {
      const proximoMIdx = fat.periodo.mes % 12
      const proximoAno = proximoMIdx === 0 ? fat.periodo.ano + 1 : fat.periodo.ano
      nomeNovoPeriodo.value = formatarMesAno(proximoMIdx + 1, proximoAno)
    } else {
      nomeNovoPeriodo.value = ''
    }
    showBottomSheetNovoPeriodo.value = true
  }

  const executarNovoPeriodo = async (nomeNovoPeriodoVal: string) => {
    const faturasAbertasVisualizadas = props.faturasAbertas.filter(f =>
      f.periodo.mes === faturaAtivaVisualizada.value.periodo.mes &&
      f.periodo.ano === faturaAtivaVisualizada.value.periodo.ano
    )

    await executarRolloverPeriodo(
      nomeNovoPeriodoVal,
      faturasAbertasVisualizadas,
      props.cartoes,
      saldosUnificadosAtivos.value,
      currentMonthName.value
    )

    await cartoesEFaturas.inicializar()
  }

  const confirmarNovoPeriodo = async () => {
    if (!nomeNovoPeriodo.value.trim()) return
    await executarNovoPeriodo(nomeNovoPeriodo.value)
    showBottomSheetNovoPeriodo.value = false
  }

  const confirmarBaixaNetting = async (dados: { from: string; to: string; valor: number; method: string; descricao: string }) => {
    const activeFaturaId = faturaAtivaVisualizada.value?.id
    if (!activeFaturaId) return

    await localGastoService.registrarAcertoNetting({
      faturaId: activeFaturaId,
      descricao: dados.descricao,
      valor: dados.valor,
      fromMemberId: dados.from,
      toMemberId: dados.to,
      method: dados.method
    })

    showBottomSheetNetting.value = false
    nettingTarget.value = null
    await cartoesEFaturas.inicializar()
  }

  const excluirGasto = async (id: string) => {
    await localGastoService.excluirGasto(id)
    await cartoesEFaturas.inicializar()
  }

  const estornarContaFixa = async (bill: any) => {
    const gasto = gastosFaturaSelecionada.value.find(g => g.recurringBillId === bill.id)
    if (gasto) {
      if (confirm(`Deseja realmente estornar o pagamento de ${bill.name}?`)) {
        await excluirGasto(gasto.id)
      }
    }
  }

  return {
    periodoSelecionado,
    faturaSelecionadaTrancada,
    faturaAtivaVisualizada,
    listaMesesSeletor,
    mesesAbertosOpcoes,
    mesesTrancadosOpcoes,
    showBottomSheetHistorico,
    showBottomSheetFechar,
    faturaParaFechar,
    showBottomSheetAjustar,
    gastoParaAjustar,
    showPopupLancar,
    showBottomSheetConfigCF,
    billSelecionada,
    showBottomSheetNovoPeriodo,
    nomeNovoPeriodo,
    showBottomSheetNetting,
    nettingTarget,
    showParcelasFuturas,
    isDropdownAbertosOpen,
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
    getMembroNome,
    formatarDinheiro,
    calcularTotalFatura,
    acertosDaFatura,
    gastosDaFatura,
    todosOsAcertosQuitados,
    currentMonthName,
    currentYear,
    abrirLancarBill,
    abrirConfigurarBill,
    abrirNovoBill,
    abrirAjustarGasto,
    abrirBottomSheetNetting,
    abrirNovoPeriodoBottomSheet,
    confirmarFechamentoFatura,
    confirmarAjusteGasto,
    iniciarPix,
    enviarReembolsoPix,
    quitarComAjuste,
    confirmarLancarBill,
    confirmarSalvarTemplate,
    confirmarDeletarTemplate,
    confirmarNovoPeriodo,
    confirmarBaixaNetting,
    excluirGasto,
    estornarContaFixa,
    formatarMesAno
  }
}
