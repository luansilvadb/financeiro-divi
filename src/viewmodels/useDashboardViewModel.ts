import { ref, computed } from 'vue'
import { Fatura } from '../models/entities/Fatura'
import { Dinheiro } from '../models/entities/Dinheiro'
import { Cartao } from '../models/entities/Cartao'
import { AcertoMembro } from '../models/entities/AcertoMembro'
import { Gasto } from '../models/entities/Gasto'
import { DivisaoDeGasto } from '../models/entities/DivisaoDeGasto'
import { useCartoesEFaturas } from './useCartoesEFaturas'
import { useContasFixas } from './useContasFixas'
import { useDashboardUIState } from './useDashboardUIState'
import { useDashboardPeriodos } from './useDashboardPeriodos'
import { useDashboardNetting } from './useDashboardNetting'
import type { IGastoService } from '../models/services/IGastoService'
import type { IFaturaRolloverService } from '../models/services/IFaturaRolloverService'
import { calcularPreviaCartaoAberto, separarGastosSaldoRealEPreviaCartao } from '../models/services/DashboardSaldoService'
import { valorParcelaAtual } from '../models/entities/ParcelaCalculator'
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

  const faturasPeriodoSelecionadoLista = computed(() => periodos.faturasPeriodoSelecionado.value)

  const separacaoDashboard = computed(() =>
    separarGastosSaldoRealEPreviaCartao(gastosFaturaSelecionada.value, faturasPeriodoSelecionadoLista.value)
  )

  const acertosDaFaturaPeriodo = computed(() => {
    const ids = periodos.faturasPeriodoIds.value
    const list = props.acertosPendentes?.length > 0 ? props.acertosPendentes : globalAcertos.value
    return list.filter((a: AcertoMembro) => ids.includes(a.faturaId))
  })

  const acertosVirtuaisParaNetting = computed(() => {
    return acertosDaFaturaPeriodo.value.map(acerto => {
      const fatura = faturasPeriodoSelecionadoLista.value.find(f => f.id === acerto.faturaId)
      
      // Se a fatura foi reaberta (ABERTA), os acertos dela não devem entrar no netting
      if (!fatura || fatura.status === 'ABERTA') return null

      const responsavelId = fatura.responsavelId
      
      const vAcerto = acerto.valorAcerto?.centavos ?? 0
      const vPago = acerto.valorPago?.centavos ?? 0
      const valorPendente = Dinheiro.deCentavos(vAcerto - vPago)
      
      if (valorPendente.centavos <= 0) return null

      return new Gasto({
        id: `virtual-acerto-${acerto.id}`,
        faturaId: acerto.faturaId,
        descricao: `Acerto pendente: ${acerto.membroId}`,
        valorTotal: valorPendente,
        compradorId: acerto.tipo === 'MEMBRO_PAGA' ? responsavelId : acerto.membroId,
        divisoes: [new DivisaoDeGasto(acerto.tipo === 'MEMBRO_PAGA' ? acerto.membroId : responsavelId, valorPendente)],
        isSettlement: true
      })
    }).filter((g): g is Gasto => g !== null)
  })

  const gastosSaldoRealSelecionado = computed(() => [
    ...separacaoDashboard.value.gastosSaldoReal,
    ...acertosVirtuaisParaNetting.value
  ])

  const gastosPrevisaoCartaoAberto = computed(() => separacaoDashboard.value.gastosPrevisaoCartao)
  const previaCartaoAbertoPorMembroCentavos = computed(() => calcularPreviaCartaoAberto(gastosPrevisaoCartaoAberto.value))
  const totalPreviaCartaoAbertoCentavos = computed(() =>
    Object.values(previaCartaoAbertoPorMembroCentavos.value).reduce((acc, val) => acc + val, 0)
  )

  const netting = useDashboardNetting(() => props.membros, gastosSaldoRealSelecionado)

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

  // GAP 2: resumo de pendências do período para exibir antes de encerrar o mês
  const resumoPendencias = computed(() => {
    const p = periodos.periodoSelecionado.value

    // Faturas de cartão ABERTAS com consumo registrado
    const faturasAbertasComConsumo = props.faturasAbertas
      .filter(f => f.periodo.mes === p.mes && f.periodo.ano === p.ano && f.cartaoId !== 'PIX_DEFAULT_ID')
      .map(f => ({
        fatura: f,
        totalCentavos: globalGastos.value
          .filter(g => g.faturaId === f.id && !g.isSettlement)
          .reduce((sum, g) => {
            return sum + g.divisoes.reduce((s, d) => {
              const vp = valorParcelaAtual(d.valor, g.installments, g.totalInstallments)
              return s + vp.centavos
            }, 0)
          }, 0)
      }))
      .filter(item => item.totalCentavos > 0)

    // Faturas FECHADAS do período com acertos ainda não quitados
    const faturasFechadasNaoQuitadas = props.faturasFechadas
      .filter(f => f.periodo.mes === p.mes && f.periodo.ano === p.ano && f.status === 'FECHADA')
      .map(f => ({
        fatura: f,
        acertosPendentes: acertosDaFatura(f.id).filter((a: AcertoMembro) => !a.pago)
      }))
      .filter(item => item.acertosPendentes.length > 0)

    // Saldo à vista do período (netting não zerado)
    const totalSaldoAVistaCentavos = Object.values(netting.saldosUnificadosAtivosCentavos.value as Record<string, number>)
      .reduce((sum: number, v: number) => sum + Math.abs(v), 0)

    return {
      faturasAbertasComConsumo,
      faturasFechadasNaoQuitadas,
      temPendencias: faturasAbertasComConsumo.length > 0 || faturasFechadasNaoQuitadas.length > 0,
      totalSaldoAVistaCentavos
    }
  })

  // --- Ações de Negócio ---
  const confirmarFechamentoFatura = async (faturaId: string, responsavelId: string) => {
    if (periodos.faturaSelecionadaTrancada.value) return
    try {
      await fecharFaturaManual(faturaId, responsavelId)
      uiState.showBottomSheetFechar.value = false
      uiState.faturaParaFechar.value = null
      // Nota: fecharFaturaManual já chama inicializar() internamente
    } catch (error: any) {
      toast.show(error.message || 'Erro ao fechar fatura', 'error')
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
      toast.show(error.message || 'Erro ao ajustar gasto', 'error')
    }
  }

  const enviarReembolsoPix = async (acertoId: string) => {
    if (uiState.valorPixInput.value <= 0 || uiState.isSubmittingPix.value) return
    uiState.isSubmittingPix.value = true
    try {
      await registrarReembolsoParcialManual(acertoId, Dinheiro.deReais(uiState.valorPixInput.value))
      uiState.acertoPixId.value = null
      await cartoesEFaturas.inicializar()
    } catch (error: any) {
      toast.show(error.message || 'Erro ao registrar reembolso', 'error')
    } finally {
      uiState.isSubmittingPix.value = false
    }
  }

  const quitarComAjuste = async (acertoId: string) => {
    if (uiState.isSubmittingPix.value) return
    uiState.isSubmittingPix.value = true
    try {
      await quitarAcertoMembro(acertoId)
      uiState.acertoPixId.value = null
      await cartoesEFaturas.inicializar()
    } catch (error: any) {
      toast.show(error.message || 'Erro ao quitar acerto', 'error')
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
      toast.show(error.message || 'Erro ao lançar conta fixa', 'error')
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

      // Encerrar mes carrega apenas saldos reais. Faturas de cartao abertas seguem como previsao.
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
      toast.show(error.message || 'Erro ao fechar mês', 'error')
    } finally {
      isExecutingRollover.value = false
    }
  }

  const reabrirFaturaManualComTrava = async (faturaId: string) => {
    // 1. Busca a fatura alvo no estado global (mais atualizado)
    const faturaAlvo = cartoesEFaturas.faturas.value.find(f => f.id === faturaId)
    if (!faturaAlvo) return

    // Busca os acertos desta fatura para saber quem são os devedores envolvidos
    const acertosDaFaturaAlvo = acertosDaFatura(faturaId)
    const membrosDevedoresIds = acertosDaFaturaAlvo.map(a => a.membroId)

    // 2. Busca faturas do mesmo mês para encontrar os Pix registrados no extrato
    const faturasDoMesIds = cartoesEFaturas.faturas.value
      .filter(f => f.periodo.mes === faturaAlvo.periodo.mes && f.periodo.ano === faturaAlvo.periodo.ano)
      .map(f => f.id)

    // 3. Verifica se existe algum Pix ativo no extrato deste mês enviado por um dos devedores desta fatura
    const pixBloqueante = globalGastos.value.find(g => 
      faturasDoMesIds.includes(g.faturaId) && 
      g.isSettlement && 
      membrosDevedoresIds.includes(g.compradorId)
    )

    if (pixBloqueante) {
      const nomeMembro = getMembroNome(pixBloqueante.compradorId)
      toast.show(
        `Não é possível reabrir: existe um Pix de ${nomeMembro} registrado no extrato deste mês. Estorne-o primeiro.`,
        'error'
      )
      return
    }

    try {
      await reabrirFaturaManual(faturaId)
      await cartoesEFaturas.inicializar()
    } catch (error: any) {
      toast.show(error.message || 'Erro ao reabrir fatura', 'error')
    }
  }

  const confirmarBaixaNetting = async (dados: { from: string; to: string; valor: number; method: string; descricao: string }) => {
    if (periodos.faturaSelecionadaTrancada.value || uiState.isSubmittingPix.value) return
    const activeFaturaId = periodos.faturaPixPeriodoSelecionado.value?.id
    if (!activeFaturaId) return

    uiState.isSubmittingPix.value = true
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
      toast.show(error.message || 'Erro ao registrar acerto de contas', 'error')
    } finally {
      uiState.isSubmittingPix.value = false
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
            'Não é possível excluir gastos comuns neste período pois já existem acertos de contas (Pix) confirmados. Estorne os acertos primeiro',
            'error'
          )
          return
        }
      }
    }

    try {
      if (uiState.itemTypeParaEstornar.value === 'Conta Fixa') {
        const bill = uiState.itemParaEstornar.value
        // Verifica se existe QUALQUER gasto vinculado a este ID de conta fixa em QUALQUER período
        const temLancamentos = globalGastos.value.some(g => g.recurringBillId === bill.id)
        
        if (temLancamentos) {
          toast.show(
            `Não é possível excluir o modelo "${bill.name}" pois ele possui lançamentos registrados. Estorne os lançamentos primeiro.`,
            'error'
          )
          uiState.showBottomSheetConfirmacaoEstorno.value = false
          uiState.itemParaEstornar.value = null
          return
        }
      }

      const handlers: Record<string, () => Promise<void>> = {
        'Lançamento': () => localGastoService.excluirGasto(uiState.itemParaEstornar.value!.id).then(() => cartoesEFaturas.inicializar()),
        'Conta Fixa': async () => {
          await excluirContaFixa(uiState.itemParaEstornar.value!.id)
          // Fecha o modal de configuração de onde veio o comando de exclusão
          uiState.showBottomSheetConfigCF.value = false
        }
      }
      await handlers[uiState.itemTypeParaEstornar.value]?.()

      uiState.showBottomSheetConfirmacaoEstorno.value = false
      uiState.itemParaEstornar.value = null
    } catch (error: any) {
      toast.show(error.message || 'Erro ao realizar estorno', 'error')
      uiState.showBottomSheetConfirmacaoEstorno.value = false
      uiState.itemParaEstornar.value = null
    }
  }

  const estornarContaFixa = async (bill: any) => {
    const gasto = gastosFaturaSelecionada.value.find(g => g.recurringBillId === bill.id)
    if (gasto) {
      uiState.abrirConfirmacaoEstornoGasto(gasto)
    }
  }

  const reabrirPeriodoSelecionado = async () => {
    const p = periodos.periodoSelecionado.value
    const faturasDoPeriodo = props.faturasFechadas.filter(f => f.periodo.mes === p.mes && f.periodo.ano === p.ano)
    const faturasDoPeriodoIds = [...faturasDoPeriodo.map(f => f.id), ...props.faturasAbertas.filter(f => f.periodo.mes === p.mes && f.periodo.ano === p.ano).map(f => f.id)]

    // GAP 1: bloquear se qualquer acerto do período já foi pago (total ou parcialmente)
    const acertosDoPeriodo = faturasDoPeriodo.flatMap(f =>
      (props.acertosPendentes?.length > 0 ? props.acertosPendentes : globalAcertos.value)
        .filter((a: AcertoMembro) => a.faturaId === f.id)
    )
    const temAcertoPago = acertosDoPeriodo.some(
      (a: AcertoMembro) => a.pago || (a.valorPago && a.valorPago.centavos > 0)
    )

    // Bloqueia também se houver transações reais de liquidação (Pix confirmados via Netting Panel)
    const temTransacoesLiquidacao = globalGastos.value.some(g => 
      faturasDoPeriodoIds.includes(g.faturaId) && g.isSettlement
    )

    if (temAcertoPago || temTransacoesLiquidacao) {
      toast.show(
        'Não é possível reabrir este período pois já existem pagamentos (Pix/Acertos) confirmados. Estorne os pagamentos primeiro.',
        'error'
      )
      return
    }

    try {
      for (const fatura of faturasDoPeriodo) {
        await reabrirFaturaManual(fatura.id)
      }
      await cartoesEFaturas.inicializar()
    } catch (error: any) {
      toast.show(error.message || 'Erro ao reabrir período', 'error')
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
    gastosSaldoRealSelecionado,
    gastosPrevisaoCartaoAberto,
    previaCartaoAbertoPorMembroCentavos,
    totalPreviaCartaoAbertoCentavos,
    getMembroNome,
    formatarDinheiro,
    calcularTotalFatura,
    acertosDaFatura,
    gastosDaFatura,
    todosOsAcertosQuitados,
    reabrirFaturaManual,
    reabrirFaturaManualComTrava,
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
    resumoPendencias,
    estornarContaFixa,
    formatarMesAno,
    showToast: (msg: string, type: 'success' | 'error' = 'success') => toast.show(msg, type),
    iniciarPix: (acerto: AcertoMembro) => uiState.iniciarPix(acerto, formatarDinheiro),
    abrirNovoPeriodoBottomSheet: () => uiState.abrirNovoPeriodoBottomSheet(periodos.faturaAtivaVisualizada.value),
    abrirConfirmacaoEstornoGasto: (gasto: any) => {
      const isComum = !gasto.cardOwner && !gasto.isSettlement
      if (isComum) {
        const acertos = acertosDaFatura(gasto.faturaId)
        const temAcertosConfirmados = acertos.some(a => a.pago || (a.valorPago && a.valorPago.centavos > 0))
        if (temAcertosConfirmados) {
          toast.show(
            'Não é possível excluir gastos comuns neste período pois já existem acertos de contas (Pix) confirmados. Estorne os acertos primeiro',
            'error'
          )
          return
        }
      }
      uiState.abrirConfirmacaoEstornoGasto(gasto)
    },
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
              'Não é possível excluir gastos comuns neste período pois já existem acertos de contas (Pix) confirmados. Estorne os acertos primeiro',
              'error'
            )
            return
          }
        }
      }

      try {
        await localGastoService.excluirGasto(id)
        await cartoesEFaturas.inicializar()
      } catch (error: any) {
        toast.show(error.message || 'Erro ao excluir gasto', 'error')
      }
    }
  }
}
