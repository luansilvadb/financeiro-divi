import { ref, watch, computed } from 'vue'
import { Fatura } from '../models/entities/Fatura'
import { Dinheiro } from '../models/entities/Dinheiro'
import { Cartao } from '../models/entities/Cartao'
import { AcertoMembro } from '../models/entities/AcertoMembro'
import { useCartoesEFaturas } from './useCartoesEFaturas'
import { useContasFixas } from './useContasFixas'
import { useDashboardUIState } from './useDashboardUIState'
import { calcularSaldosUnificados, calcularTransacoesNetting } from '../models/services/NettingService'
import type { IGastoService } from '../models/services/IGastoService'
import type { IFaturaRolloverService } from '../models/services/IFaturaRolloverService'
import { formatarMesAno, NOMES_MESES } from '../shared/utils/meses'
import { obterPeriodoSelecionado, salvarPeriodoSelecionado } from '../shared/utils/periodoStorage'
import type { IGastoRepository } from '../models/repositories/IGastoRepository'
import type { IFaturaRepository } from '../models/repositories/IFaturaRepository'
import type { ICartaoRepository } from '../models/repositories/ICartaoRepository'
import type { IContaFixaRepository } from '../models/repositories/IContaFixaRepository'
import {
  gastoRepository,
  faturaRepository,
  cartaoRepository,
  faturaRolloverService,
  gastoService,
  contaFixaRepository
} from '../shared/container'

export interface DashboardProps {
  membros: { id: string; nome: string; ativo?: boolean }[]
  faturasAbertas: Fatura[]
  faturasFechadas: Fatura[]
  acertosPendentes: AcertoMembro[]
  cartoes: Cartao[]
  calcularConsumo: (faturaId: string, membroId: string) => number
  activeTab?: string
}

export interface DashboardDependencies {
  gastoRepository?: IGastoRepository
  faturaRepository?: IFaturaRepository
  cartaoRepository?: ICartaoRepository
  contaFixaRepository?: IContaFixaRepository
  faturaRolloverService?: IFaturaRolloverService
  gastoService?: IGastoService
}

function obterPeriodoInicial(faturasAbertas: Fatura[], faturasFechadas: Fatura[]): { mes: number; ano: number } {
  const faturaReferencia = faturasAbertas?.[0] || faturasFechadas?.[0]
  const fallback = faturaReferencia?.periodo
    ? { mes: faturaReferencia.periodo.mes, ano: faturaReferencia.periodo.ano }
    : undefined
  return obterPeriodoSelecionado(fallback)
}

export function useDashboardViewModel(
  props: DashboardProps,
  emit: (event: any, ...args: any[]) => void,
  dependencies: DashboardDependencies = {}
) {
  const gastoRepo = dependencies.gastoRepository || gastoRepository
  const faturaRepo = dependencies.faturaRepository || faturaRepository
  const cartaoRepo = dependencies.cartaoRepository || cartaoRepository
  const contaFixaRepo = dependencies.contaFixaRepository || contaFixaRepository
  const rolloverService = dependencies.faturaRolloverService || faturaRolloverService
  const localGastoService = dependencies.gastoService || gastoService

  // --- Estado de Período ---
  const periodoSelecionado = ref<{ mes: number; ano: number }>(obterPeriodoInicial(props.faturasAbertas, props.faturasFechadas))

  watch(periodoSelecionado, (novos) => {
    salvarPeriodoSelecionado(novos)
  }, { deep: true, immediate: true })

  const faturasPeriodoSelecionado = computed(() => {
    const p = periodoSelecionado.value
    const faturasExistentes = [
      ...props.faturasAbertas.filter(f => f.periodo.mes === p.mes && f.periodo.ano === p.ano),
      ...props.faturasFechadas.filter(f => f.periodo.mes === p.mes && f.periodo.ano === p.ano)
    ]
    if (faturasExistentes.length === 0) {
      return [
        new Fatura({
          id: `virtual-${p.mes}-${p.ano}`,
          cartaoId: props.cartoes[0]?.id || 'PIX_DEFAULT_ID',
          periodo: { mes: p.mes, ano: p.ano },
          responsavelId: props.membros[0]?.id || 'virtual-member',
          status: 'ABERTA'
        })
      ]
    }
    return faturasExistentes
  })

  const faturasPeriodoIds = computed(() => {
    const ids = faturasPeriodoSelecionado.value.map(f => f.id)
    const pixId = faturaPixPeriodoSelecionado.value?.id
    if (pixId && !ids.includes(pixId)) {
      ids.push(pixId)
    }
    return ids
  })

  const faturaPixPeriodoSelecionado = computed(() => {
    const p = periodoSelecionado.value
    const faturaPix = props.faturasAbertas.find(f => f.cartaoId === 'PIX_DEFAULT_ID' && f.periodo.mes === p.mes && f.periodo.ano === p.ano) ||
                      props.faturasFechadas.find(f => f.cartaoId === 'PIX_DEFAULT_ID' && f.periodo.mes === p.mes && f.periodo.ano === p.ano)
    if (faturaPix) return faturaPix

    return new Fatura({
      id: `virtual-pix-${p.mes}-${p.ano}`,
      cartaoId: 'PIX_DEFAULT_ID',
      periodo: { mes: p.mes, ano: p.ano },
      responsavelId: 'PIX_SYSTEM_OWNER',
      status: 'ABERTA'
    })
  })

  const faturaSelecionadaTrancada = computed(() => {
    const p = periodoSelecionado.value

    // Se não há faturas no período, tecnicamente não está trancado
    const temFaturaPixAberta = props.faturasAbertas.some(f =>
      f.cartaoId === 'PIX_DEFAULT_ID' &&
      f.periodo.mes === p.mes &&
      f.periodo.ano === p.ano
    )

    if (props.cartoes.length > 0) {
      const todosCartoesFechados = props.cartoes.every(cartao => {
        const fechada = props.faturasFechadas.find(f => f.cartaoId === cartao.id && f.periodo.mes === p.mes && f.periodo.ano === p.ano)
        if (fechada) return true

        const aberta = props.faturasAbertas.find(f => f.cartaoId === cartao.id && f.periodo.mes === p.mes && f.periodo.ano === p.ano)
        if (aberta) return false

        // Se não tem fatura, consideramos "aberto" para permitir o lançamento que irá criá-la
        return false
      })

      if (temFaturaPixAberta) return false
      return todosCartoesFechados
    }

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
      cartaoId: props.cartoes[0]?.id || 'PIX_DEFAULT_ID',
      periodo: { mes: p.mes, ano: p.ano },
      responsavelId: props.membros[0]?.id || 'virtual-member',
      status: 'ABERTA'
    })
  })

  // --- Seletor de Meses ---
  const listaMesesSeletor = computed(() => {
    const hoje = new Date()
    const list = []
    for (let i = -12; i <= 12; i++) {
      const d = new Date(hoje.getFullYear(), hoje.getMonth() + i, 1)
      const mesIdx = d.getMonth() + 1
      const anoIdx = d.getFullYear()
      const estaFechada = props.faturasFechadas.some(f => f.periodo.mes === mesIdx && f.periodo.ano === anoIdx)
      list.push({
        mes: mesIdx,
        ano: anoIdx,
        nome: formatarMesAno(mesIdx, anoIdx),
        status: (estaFechada ? 'FECHADA' : 'ABERTA') as 'FECHADA' | 'ABERTA'
      })
    }
    return list
  })

  const mesesAbertosOpcoes = computed(() => listaMesesSeletor.value.filter(item => item.status === 'ABERTA'))
  const mesesTrancadosOpcoes = computed(() => listaMesesSeletor.value.filter(item => item.status === 'FECHADA'))

  // --- UI States & Sub-composables ---
  const uiState = useDashboardUIState()
  const {
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
    showBottomSheetConfirmacaoEstorno,
    itemParaEstornar,
    itemTypeParaEstornar,
    showBottomSheetNetting,
    nettingTarget,
    showParcelasFuturas,
    isDropdownAbertosOpen,
    acertoPixId,
    valorPixInput,
    isSubmittingPix,
    abrirConfirmacaoEstornoGasto,
    abrirConfirmacaoEstornoBill,
    abrirLancarBill,
    abrirConfigurarBill,
    abrirNovoBill,
    abrirAjustarGasto,
    abrirBottomSheetNetting,
    abrirNovoPeriodoBottomSheet: uiAbrirNovoPeriodoBottomSheet,
    iniciarPix: uiIniciarPix
  } = uiState

  const iniciarPix = (acerto: AcertoMembro) => uiIniciarPix(acerto, formatarDinheiro)
  const abrirNovoPeriodoBottomSheet = () => uiAbrirNovoPeriodoBottomSheet(faturaAtivaVisualizada.value)

  // --- Composables e Services ---
  const cartoesEFaturas = useCartoesEFaturas({
    cartaoRepository: cartaoRepo,
    faturaRepository: faturaRepo,
    gastoRepository: gastoRepo,
    gastoService: localGastoService
  })
  const { contasFixas, salvarContaFixa, excluirContaFixa, lancarGastoContaFixa } = useContasFixas({
    contaFixaRepository: contaFixaRepo,
    gastoService: localGastoService
  })

  const {
    registrarReembolsoParcialManual,
    fecharFaturaManual,
    reabrirFaturaManual,
    quitarAcertoMembro,
    atualizarGastoCompletoManual,
    gastos: globalGastos,
    acertos: globalAcertos
  } = cartoesEFaturas

  // --- Funções de cálculo (puras, inline) ---
  const getMembroNome = (id: string) => {
    if (!id) return 'Desconhecido'
    return props.membros.find(m => m.id === id)?.nome || 'Membro desconhecido'
  }

  const formatarDinheiro = (centavos: number) => Dinheiro.deCentavos(centavos).centavos / 100

  const calcularTotalFatura = (faturaId: string) =>
    props.membros.reduce((sum, m) => sum + props.calcularConsumo(faturaId, m.id), 0)

  const acertosDaFatura = (faturaId: string) => {
    const list = props.acertosPendentes?.length > 0 ? props.acertosPendentes : globalAcertos.value
    return list.filter((a: AcertoMembro) => a.faturaId === faturaId)
  }

  const gastosDaFatura = (faturaId: string) =>
    globalGastos.value.filter(g => g.faturaId === faturaId)

  const todosOsAcertosQuitados = (faturaId: string) => {
    const acertos = acertosDaFatura(faturaId)
    return acertos.length > 0 && acertos.every((a: AcertoMembro) => a.pago)
  }

  const currentMonthName = computed(() => {
    const fat = faturaAtivaVisualizada.value
    if (!fat) return 'Mês'
    return NOMES_MESES[fat.periodo.mes - 1]
  })

  const currentYear = computed(() => {
    const fat = faturaAtivaVisualizada.value
    if (!fat) return 'Atual'
    return fat.periodo.ano.toString()
  })

  const parcelasFuturasDetalhadas = computed(() => {
    const ids = faturasPeriodoIds.value
    const gastosDoPeriodo = globalGastos.value.filter(g => ids.includes(g.faturaId))
    return gastosDoPeriodo
      .filter(g => g.installments > 1)
      .map(g => {
        const valorParcela = g.valorTotal.centavos / g.totalInstallments
        const parcelasRestantes = g.installments - 1
        return {
          id: g.id,
          descricao: g.descricao,
          responsavel: g.cardOwner ? 'Cartão' : 'Pix',
          restantes: parcelasRestantes,
          valorParcela: valorParcela / 100,
          totalFuturo: (valorParcela * parcelasRestantes) / 100
        }
      })
  })

  // --- Dados Derivados ---
  const gastosFaturaSelecionada = computed(() => {
    const ids = faturasPeriodoIds.value
    return globalGastos.value.filter(g => ids.includes(g.faturaId))
  })

  const saldosUnificadosAtivos = computed(() => {
    const gastosPeriodo = gastosFaturaSelecionada.value
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
    if (faturaSelecionadaTrancada.value) return
    await fecharFaturaManual(faturaId, responsavelId)
    showBottomSheetFechar.value = false
    faturaParaFechar.value = null
    await cartoesEFaturas.inicializar()
  }

  const confirmarAjusteGasto = async (dados: any) => {
    if (faturaSelecionadaTrancada.value) return
    if (!gastoParaAjustar.value) return
    await atualizarGastoCompletoManual(gastoParaAjustar.value.id, dados)
    showBottomSheetAjustar.value = false
    gastoParaAjustar.value = null
    await cartoesEFaturas.inicializar()
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
    if (faturaSelecionadaTrancada.value) return
    const activeFaturaId = faturaPixPeriodoSelecionado.value?.id
    if (!activeFaturaId) return
    await lancarGastoContaFixa(activeFaturaId, billSelecionada.value, dados.valorReal, dados.compradorId, dados.splitIds)
    showPopupLancar.value = false
    await cartoesEFaturas.inicializar()
  }

  const confirmarSalvarTemplate = (template: any) => {
    if (faturaSelecionadaTrancada.value) return
    salvarContaFixa(template)
    showBottomSheetConfigCF.value = false
  }

  const executarNovoPeriodo = async (nomeNovoPeriodoVal: string) => {
    const faturasAbertasVisualizadas = props.faturasAbertas.filter(f =>
      f.periodo.mes === faturaAtivaVisualizada.value.periodo.mes &&
      f.periodo.ano === faturaAtivaVisualizada.value.periodo.ano
    )

    await rolloverService.executarRolloverPeriodo({
      nomeNovoPeriodo: nomeNovoPeriodoVal,
      faturasAbertas: faturasAbertasVisualizadas,
      cartoes: props.cartoes,
      saldosAcumulados: saldosUnificadosAtivos.value,
      nomePeriodoAnterior: currentMonthName.value
    })

    await cartoesEFaturas.inicializar()
  }

  const isExecutingRollover = ref(false)

  const confirmarNovoPeriodo = async () => {
    if (!nomeNovoPeriodo.value.trim() || isExecutingRollover.value) return
    isExecutingRollover.value = true
    try {
      await executarNovoPeriodo(nomeNovoPeriodo.value)
      showBottomSheetNovoPeriodo.value = false
    } finally {
      isExecutingRollover.value = false
    }
  }

  const confirmarBaixaNetting = async (dados: { from: string; to: string; valor: number; method: string; descricao: string }) => {
    if (faturaSelecionadaTrancada.value) return
    const activeFaturaId = faturaPixPeriodoSelecionado.value?.id
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
    if (faturaSelecionadaTrancada.value) return
    await localGastoService.excluirGasto(id)
    await cartoesEFaturas.inicializar()
  }

  const confirmarEstorno = async () => {
    if (!itemParaEstornar.value) return

    const handlers: Record<string, () => Promise<void>> = {
      'Lançamento': () => excluirGasto(itemParaEstornar.value!.id),
      'Conta Fixa': () => excluirContaFixa(itemParaEstornar.value!.id)
    }
    await handlers[itemTypeParaEstornar.value]?.()

    showBottomSheetConfirmacaoEstorno.value = false
    itemParaEstornar.value = null
  }

  const estornarContaFixa = async (bill: any) => {
    const gasto = gastosFaturaSelecionada.value.find(g => g.recurringBillId === bill.id)
    if (gasto) {
      abrirConfirmacaoEstornoGasto(gasto)
    }
  }

  const totalPeriodoSelecionado = computed(() => {
    const ids = faturasPeriodoIds.value
    return ids.reduce((sum, id) => sum + calcularTotalFatura(id), 0)
  })

  const totalLancamentosPeriodoSelecionado = computed(() => {
    return gastosFaturaSelecionada.value.length
  })

  const reabrirPeriodoSelecionado = async () => {
    const p = periodoSelecionado.value
    const faturasDoPeriodo = props.faturasFechadas.filter(f => f.periodo.mes === p.mes && f.periodo.ano === p.ano)
    for (const fatura of faturasDoPeriodo) {
      await reabrirFaturaManual(fatura.id)
    }
    await cartoesEFaturas.inicializar()
  }

  return {
    periodoSelecionado,
    faturaSelecionadaTrancada,
    faturaAtivaVisualizada,
    faturasPeriodoSelecionado,
    faturasPeriodoIds,
    faturaPixPeriodoSelecionado,
    totalPeriodoSelecionado,
    totalLancamentosPeriodoSelecionado,
    reabrirPeriodoSelecionado,
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
    showBottomSheetConfirmacaoEstorno,
    itemParaEstornar,
    itemTypeParaEstornar,
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
    abrirConfirmacaoEstornoGasto,
    abrirConfirmacaoEstornoBill,
    abrirBottomSheetNetting,
    abrirNovoPeriodoBottomSheet,
    confirmarFechamentoFatura,
    confirmarAjusteGasto,
    reabrirFaturaManual,
    iniciarPix,
    enviarReembolsoPix,
    quitarComAjuste,
    confirmarLancarBill,
    confirmarSalvarTemplate,
    confirmarNovoPeriodo,
    isExecutingRollover,
    confirmarBaixaNetting,
    confirmarEstorno,
    excluirGasto,
    estornarContaFixa,
    formatarMesAno
  }
}
