import { ref, computed } from 'vue'
import { Fatura } from '../models/entities/Fatura'
import { Dinheiro } from '../models/entities/Dinheiro'
import { Cartao } from '../models/entities/Cartao'
import { AcertoMembro } from '../models/entities/AcertoMembro'
import { useCartoesEFaturas } from './useCartoesEFaturas'
import { useContasFixas } from './useContasFixas'
import { useDashboardUIState } from './useDashboardUIState'
import { useDashboardPeriodos } from './useDashboardPeriodos'
import { useDashboardNetting } from './useDashboardNetting'
import type { IGastoService } from '../models/services/IGastoService'
import type { IFaturaRolloverService } from '../models/services/IFaturaRolloverService'
import { formatarMesAno } from '../shared/utils/meses'
import type { IGastoRepository } from '../models/repositories/IGastoRepository'
import { useToast } from '../composables/useToast'
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

  const uiState = useDashboardUIState()
  const toast = useToast()
  
  const periodos = useDashboardPeriodos(
    () => props.faturasAbertas,
    () => props.faturasFechadas,
    () => props.cartoes,
    () => props.membros,
    emit
  )

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

  const gastosFaturaSelecionada = computed(() => {
    const ids = periodos.faturasPeriodoIds.value
    return globalGastos.value.filter(g => ids.includes(g.faturaId))
  })

  const netting = useDashboardNetting(() => props.membros, gastosFaturaSelecionada)

  // --- Helpers ---
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

  const parcelasFuturasDetalhadas = computed(() => {
    const ids = periodos.faturasPeriodoIds.value
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

  const totalFuturasVencer = computed(() => {
    return parcelasFuturasDetalhadas.value.reduce((acc, p) => acc + p.totalFuturo, 0)
  })

  const totalPeriodoSelecionado = computed(() => {
    const ids = periodos.faturasPeriodoIds.value
    return ids.reduce((sum, id) => sum + calcularTotalFatura(id), 0)
  })

  const totalLancamentosPeriodoSelecionado = computed(() => {
    return gastosFaturaSelecionada.value.filter(g => !g.isSettlement).length
  })

  // --- Ações de Negócio ---
  const confirmarFechamentoFatura = async (faturaId: string, responsavelId: string) => {
    if (periodos.faturaSelecionadaTrancada.value) return
    try {
      await fecharFaturaManual(faturaId, responsavelId)
      uiState.showBottomSheetFechar.value = false
      uiState.faturaParaFechar.value = null
      await cartoesEFaturas.inicializar()
    } catch (error: any) {
      alert(error.message || 'Erro ao fechar fatura')
    }
  }

  const confirmarAjusteGasto = async (dados: any) => {
    if (periodos.faturaSelecionadaTrancada.value) return
    if (!uiState.gastoParaAjustar.value) return
    try {
      await atualizarGastoCompletoManual(uiState.gastoParaAjustar.value.id, dados)
      uiState.showBottomSheetAjustar.value = false
      uiState.gastoParaAjustar.value = null
      await cartoesEFaturas.inicializar()
    } catch (error: any) {
      alert(error.message || 'Erro ao ajustar gasto')
    }
  }

  const enviarReembolsoPix = async (acertoId: string) => {
    if (uiState.valorPixInput.value <= 0) return
    uiState.isSubmittingPix.value = true
    try {
      await registrarReembolsoParcialManual(acertoId, Dinheiro.deReais(uiState.valorPixInput.value))
      uiState.acertoPixId.value = null
      await cartoesEFaturas.inicializar()
    } catch (error: any) {
      alert(error.message || 'Erro ao registrar reembolso')
    } finally {
      uiState.isSubmittingPix.value = false
    }
  }

  const quitarComAjuste = async (acertoId: string) => {
    uiState.isSubmittingPix.value = true
    try {
      await quitarAcertoMembro(acertoId)
      uiState.acertoPixId.value = null
      await cartoesEFaturas.inicializar()
    } catch (error: any) {
      alert(error.message || 'Erro ao quitar acerto')
    } finally {
      uiState.isSubmittingPix.value = false
    }
  }

  const confirmarLancarBill = async (dados: { valorCentavos: number; compradorId: string; splitIds: string[] }) => {
    if (periodos.faturaSelecionadaTrancada.value) return
    const activeFaturaId = periodos.faturaPixPeriodoSelecionado.value?.id
    if (!activeFaturaId) return
    try {
      await lancarGastoContaFixa(activeFaturaId, uiState.billSelecionada.value, dados.valorCentavos, dados.compradorId, dados.splitIds)
      uiState.showPopupLancar.value = false
      await cartoesEFaturas.inicializar()
    } catch (error: any) {
      alert(error.message || 'Erro ao lançar conta fixa')
    }
  }

  const confirmarSalvarTemplate = (template: any) => {
    if (periodos.faturaSelecionadaTrancada.value) return
    salvarContaFixa(template)
    uiState.showBottomSheetConfigCF.value = false
  }

  const isExecutingRollover = ref(false)

  const confirmarNovoPeriodo = async () => {
    if (!uiState.nomeNovoPeriodo.value.trim() || isExecutingRollover.value) return
    isExecutingRollover.value = true
    try {
      const faturasAbertasVisualizadas = props.faturasAbertas.filter(f =>
        f.periodo.mes === periodos.faturaAtivaVisualizada.value.periodo.mes &&
        f.periodo.ano === periodos.faturaAtivaVisualizada.value.periodo.ano
      )

      await rolloverService.executarRolloverPeriodo({
        nomeNovoPeriodo: uiState.nomeNovoPeriodo.value,
        faturasAbertas: faturasAbertasVisualizadas,
        cartoes: props.cartoes,
        saldosAcumulados: netting.saldosUnificadosAtivosCentavos.value,
        nomePeriodoAnterior: periodos.currentMonthName.value
      })
      await cartoesEFaturas.inicializar()
      uiState.showBottomSheetNovoPeriodo.value = false
    } catch (error: any) {
      alert(error.message || 'Erro ao fechar mês')
    } finally {
      isExecutingRollover.value = false
    }
  }

  const confirmarBaixaNetting = async (dados: { from: string; to: string; valor: number; method: string; descricao: string }) => {
    if (periodos.faturaSelecionadaTrancada.value) return
    const activeFaturaId = periodos.faturaPixPeriodoSelecionado.value?.id
    if (!activeFaturaId) return

    try {
      await localGastoService.registrarAcertoNetting({
        faturaId: activeFaturaId,
        descricao: dados.descricao,
        valor: dados.valor,
        fromMemberId: dados.from,
        toMemberId: dados.to,
        method: dados.method
      })

      uiState.showBottomSheetNetting.value = false
      uiState.nettingTarget.value = null
      await cartoesEFaturas.inicializar()
    } catch (error: any) {
      alert(error.message || 'Erro ao registrar acerto de contas')
    }
  }

  const confirmarEstorno = async () => {
    if (!uiState.itemParaEstornar.value) return

    if (uiState.itemTypeParaEstornar.value === 'Lançamento') {
      const gasto = uiState.itemParaEstornar.value
      const isComum = !gasto.cardOwner && !gasto.isSettlement
      if (isComum) {
        const acertos = acertosDaFatura(gasto.faturaId)
        const temAcertosConfirmados = acertos.some(a => a.pago || (a.valorPago && a.valorPago.centavos > 0))
        if (temAcertosConfirmados) {
          toast.show(
            ' Não é possível excluir gastos comuns neste período pois já existem acertos de contas (Pix) confirmados. Estorne os acertos primeiro. ',
            'error'
          )
          return
        }
      }
    }

    try {
      const handlers: Record<string, () => Promise<void>> = {
        'Lançamento': () => localGastoService.excluirGasto(uiState.itemParaEstornar.value!.id).then(() => cartoesEFaturas.inicializar()),
        'Conta Fixa': () => excluirContaFixa(uiState.itemParaEstornar.value!.id)
      }
      await handlers[uiState.itemTypeParaEstornar.value]?.()

      uiState.showBottomSheetConfirmacaoEstorno.value = false
      uiState.itemParaEstornar.value = null
    } catch (error: any) {
      alert(error.message || 'Erro ao realizar estorno')
    }
  }

  const abrirConfirmacaoEstornoGasto = (gasto: any) => {
    const isComum = !gasto.cardOwner && !gasto.isSettlement
    if (isComum) {
      const acertos = acertosDaFatura(gasto.faturaId)
      const temAcertosConfirmados = acertos.some(a => a.pago || (a.valorPago && a.valorPago.centavos > 0))
      if (temAcertosConfirmados) {
        toast.show(
          ' Não é possível excluir gastos comuns neste período pois já existem acertos de contas (Pix) confirmados. Estorne os acertos primeiro. ',
          'error'
        )
        return
      }
    }
    uiState.abrirConfirmacaoEstornoGasto(gasto)
  }

  const estornarContaFixa = async (bill: any) => {
    const gasto = gastosFaturaSelecionada.value.find(g => g.recurringBillId === bill.id)
    if (gasto) {
      abrirConfirmacaoEstornoGasto(gasto)
    }
  }

  const reabrirPeriodoSelecionado = async () => {
    const p = periodos.periodoSelecionado.value
    const faturasDoPeriodo = props.faturasFechadas.filter(f => f.periodo.mes === p.mes && f.periodo.ano === p.ano)
    try {
      for (const fatura of faturasDoPeriodo) {
        await reabrirFaturaManual(fatura.id)
      }
      await cartoesEFaturas.inicializar()
    } catch (error: any) {
      alert(error.message || 'Erro ao reabrir período')
    }
  }

  return {
    ...periodos,
    ...netting,
    ...uiState,
    totalPeriodoSelecionado,
    totalLancamentosPeriodoSelecionado,
    reabrirPeriodoSelecionado,
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
    confirmarFechamentoFatura,
    confirmarAjusteGasto,
    enviarReembolsoPix,
    quitarComAjuste,
    confirmarLancarBill,
    confirmarSalvarTemplate,
    confirmarNovoPeriodo,
    isExecutingRollover,
    confirmarBaixaNetting,
    confirmarEstorno,
    estornarContaFixa,
    formatarMesAno,
    iniciarPix: (acerto: AcertoMembro) => uiState.iniciarPix(acerto, formatarDinheiro),
    abrirNovoPeriodoBottomSheet: () => uiState.abrirNovoPeriodoBottomSheet(periodos.faturaAtivaVisualizada.value),
    abrirConfirmacaoEstornoGasto,
    excluirGasto: async (id: string) => {
      if (periodos.faturaSelecionadaTrancada.value) return
      
      const gasto = globalGastos.value.find(g => g.id === id)
      if (gasto) {
        const isComum = !gasto.cardOwner && !gasto.isSettlement
        if (isComum) {
          const acertos = acertosDaFatura(gasto.faturaId)
          const temAcertosConfirmados = acertos.some(a => a.pago || (a.valorPago && a.valorPago.centavos > 0))
          if (temAcertosConfirmados) {
            toast.show(
              ' Não é possível excluir gastos comuns neste período pois já existem acertos de contas (Pix) confirmados. Estorne os acertos primeiro. ',
              'error'
            )
            return
          }
        }
      }

      await localGastoService.excluirGasto(id)
      await cartoesEFaturas.inicializar()
    }
  }
}
