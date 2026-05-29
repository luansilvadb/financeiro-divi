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
    const p = periodos.periodoSelecionado.value
    return globalGastos.value.filter(g => gastoPertenceAoPeriodo(g, p.mes, p.ano))
  })

  const previsoesDoPeriodo = computed(() => {
    const p = periodos.periodoSelecionado.value
    if (periodos.faturaSelecionadaTrancada.value) return []

    const gastosAtuais = gastosFaturaSelecionada.value
    
    // 1. Contas Fixas não lançadas para o período (Apenas as que possuem valor fixo projetado)
    const templatesNaoLancados = contasFixas.value
      .filter(conta => {
        const jaLancado = gastosAtuais.some(g => g.recurringBillId === conta.id)
        const temValorProjetado = (conta.fixedValueCentavos || 0) > 0
        return !jaLancado && temValorProjetado
      })
      .map(conta => {
        const valorCentavos = conta.fixedValueCentavos || 0
        return new Gasto({
          id: `forecast-bill-${conta.id}-${p.mes}-${p.ano}`,
          faturaId: `forecast-${p.mes}-${p.ano}`,
          descricao: `Previsão: ${conta.name}`,
          valorTotal: Dinheiro.deCentavos(valorCentavos),
          compradorId: props.membros[0]?.id || 'PREVISAO',
          divisoes: [new DivisaoDeGasto(props.membros[0]?.id || 'PREVISAO', Dinheiro.deCentavos(valorCentavos))],
          isSettlement: false,
          method: 'pix',
          installments: 1
        })
      })

    // 2. Gastos Projetados de Períodos Futuros (Antecipação Absoluta)
    // Mostramos os gastos que já existem no banco mas para meses posteriores
    const gastosFuturos = globalGastos.value.filter(g => {
      const periodoGasto = extrairPeriodoDeFaturaId(g.faturaId)
      if (!periodoGasto) return false
      const isFuture = (periodoGasto.ano > p.ano) || (periodoGasto.ano === p.ano && periodoGasto.mes > p.mes)
      return isFuture && !g.isSettlement
    }).map(g => new Gasto({
      ...g,
      id: `upcoming-${g.id}` // Marca como lançamento futuro para o feed
    }))

    return [
      ...templatesNaoLancados,
      ...gastosFuturos
    ]
  })

  const gastosComAcertosVirtuais = computed(() => [
    ...gastosFaturaSelecionada.value,
    ...acertosVirtuaisParaNetting.value,
    ...previsoesDoPeriodo.value
  ])

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

  const nettingTransferencias = computed(() => {
    const trans = netting.nettingTransferencias.value
    return trans.map(t => {
      const origens = acertosDaFaturaPeriodo.value.filter(a => {
        const fatura = faturasPeriodoSelecionadoLista.value.find(f => f.id === a.faturaId)
        if (!fatura || fatura.status === 'ABERTA') return false
        
        const responsavelId = fatura.responsavelId
        const fromDevedor = a.tipo === 'MEMBRO_PAGA' ? a.membroId : responsavelId
        const toCredor = a.tipo === 'MEMBRO_PAGA' ? responsavelId : a.membroId
        
        return fromDevedor === t.from && toCredor === t.to && (a.valorAcerto.centavos - (a.valorPago?.centavos || 0)) > 0
      }).map(a => {
        const fatura = faturasPeriodoSelecionadoLista.value.find(f => f.id === a.faturaId)
        const cartaoNome = props.cartoes.find(c => c.id === fatura?.cartaoId)?.nome || 'Cartão'
        const valorPendente = a.valorAcerto.centavos - (a.valorPago?.centavos || 0)
        return {
          id: a.id,
          descricao: `Fatura de ${formatarMesAno(fatura!.periodo.mes, fatura!.periodo.ano)} — ${cartaoNome} (${getMembroNome(fatura!.responsavelId)})`,
          valorTotalCentavos: a.valorAcerto.centavos,
          valorPagoCentavos: a.valorPago?.centavos || 0,
          valorPendenteCentavos: valorPendente
        }
      })
      
      return {
        ...t,
        origens
      }
    })
  })


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
    const p = periodos.periodoSelecionado.value
    const gastosDoPeriodo = globalGastos.value.filter(g => gastoPertenceAoPeriodo(g, p.mes, p.ano))
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
    const p = periodos.periodoSelecionado.value
    // Filtra gastos de liquidação/auditoria para não somar o rateio ao total de gastos reais
    const gastosDoPeriodo = globalGastos.value.filter(g => gastoPertenceAoPeriodo(g, p.mes, p.ano) && !g.isSettlement)
    return gastosDoPeriodo.reduce((sum, g) => {
        const vp = valorParcelaAtual(g.valorTotal, g.installments, g.totalInstallments)
        return sum + vp.centavos
    }, 0)
  })

  const totalLancamentosPeriodoSelecionado = computed(() => {
    // Conta apenas gastos reais e saldos iniciais de rollover, ignorando registros de auditoria redundantes
    return gastosComAcertosVirtuais.value.filter(g => 
      !g.id.startsWith('audit-settlement-') &&
      (!g.isSettlement || g.descricao.includes('Saldo Inicial'))
    ).length
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

  const extrairPeriodoDeFaturaId = (faturaId: string): { mes: number; ano: number } | null => {
    // Tenta casar com o padrão final -mes-ano (ex: Nubank-5-2026 ou PIX_DEFAULT_ID-5-2026 ou virtual-5-2026)
    const match = faturaId.match(/(?:.*-)?(\d+)-(\d+)$/)
    if (match) {
      return {
        mes: parseInt(match[1], 10),
        ano: parseInt(match[2], 10)
      }
    }
    return null
  }

  const gastoPertenceAoPeriodo = (g: any, mes: number, ano: number) => {
    const fat = cartoesEFaturas.faturas.value.find(f => f.id === g.faturaId)
    if (fat) {
      return fat.periodo.mes === mes && fat.periodo.ano === ano
    }
    const periodoVirtual = extrairPeriodoDeFaturaId(g.faturaId)
    if (periodoVirtual) {
      return periodoVirtual.mes === mes && periodoVirtual.ano === ano
    }
    return false
  }

  const reabrirFaturaManualComTrava = async (faturaId: string) => {
    // 1. Busca a fatura alvo no estado global (mais atualizado)
    const faturaAlvo = cartoesEFaturas.faturas.value.find(f => f.id === faturaId)
    if (!faturaAlvo) return

    // Busca os acertos desta fatura para saber quem são os devedores envolvidos
    const acertosDaFaturaAlvo = acertosDaFatura(faturaId)
    const membrosDevedoresIds = acertosDaFaturaAlvo.map(a => a.membroId)

    // 2. Verifica se existe algum Pix ativo no extrato deste período enviado por um dos devedores desta fatura
    const pixBloqueante = globalGastos.value.find(g => 
      g.isSettlement && 
      membrosDevedoresIds.includes(g.compradorId) &&
      gastoPertenceAoPeriodo(g, faturaAlvo.periodo.mes, faturaAlvo.periodo.ano)
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
      
      // Se for um gasto de auditoria (audit-settlement), o estorno significa REABRIR a fatura
      if (gasto.id.startsWith('audit-settlement-')) {
        await reabrirFaturaManualComTrava(gasto.faturaId)
        uiState.showBottomSheetConfirmacaoEstorno.value = false
        uiState.itemParaEstornar.value = null
        return
      }

      // Se for uma previsão virtual de conta fixa
      if (gasto.id.startsWith('forecast-bill-')) {
        toast.show(
          'Esta é uma previsão automática. Para removê-la, exclua a Conta Fixa nas configurações ou lance o gasto real.',
          'success'
        )
        uiState.showBottomSheetConfirmacaoEstorno.value = false
        uiState.itemParaEstornar.value = null
        return
      }

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
        'Lançamento': async () => {
          const id = uiState.itemParaEstornar.value!.id
          const realId = id.startsWith('upcoming-') ? id.replace('upcoming-', '') : id
          await localGastoService.excluirGasto(realId)
          await cartoesEFaturas.inicializar()
          toast.show('Lançamento estornado com sucesso', 'success')
        },
        'Conta Fixa': async () => {
          await excluirContaFixa(uiState.itemParaEstornar.value!.id)
          uiState.showBottomSheetConfigCF.value = false
          toast.show('Conta fixa removida', 'success')
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
      g.isSettlement && gastoPertenceAoPeriodo(g, p.mes, p.ano)
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
    nettingTransferencias,
    totalPeriodoSelecionado,
    totalLancamentosPeriodoSelecionado,
    reabrirPeriodoSelecionado,
    totalFuturasVencer,
    parcelasFuturasDetalhadas,
    contasFixas,
    gastosFaturaSelecionada,
    gastosComAcertosVirtuais,
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
      // Se for um gasto de auditoria (audit-settlement), o estorno significa REABRIR a fatura
      if (gasto.id.startsWith('audit-settlement-')) {
        reabrirFaturaManualComTrava(gasto.faturaId)
        return
      }

      // Se o período estiver trancado e não for auditoria, avisa o usuário
      if (periodos.faturaSelecionadaTrancada.value) {
        toast.show('Este mês está arquivado. Reabra o período para estornar este lançamento.', 'error')
        return
      }

      // Se for uma previsão virtual de conta fixa, apenas informa como removê-la definitivamente
      if (gasto.id.startsWith('forecast-bill-')) {
        toast.show(
          'Esta é uma previsão automática. Para removê-la, exclua a Conta Fixa nas configurações ou lance o gasto real.',
          'success'
        )
        return
      }

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
      
      // Seta o item e abre o modal manualmente para garantir reatividade
      uiState.itemParaEstornar.value = gasto
      uiState.itemTypeParaEstornar.value = 'Lançamento'
      uiState.showBottomSheetConfirmacaoEstorno.value = true
    },
    excluirGasto: async (id: string) => {
      if (periodos.faturaSelecionadaTrancada.value) return
      
      // Se for uma previsão virtual de conta fixa, apenas informa como removê-la definitivamente
      if (id.startsWith('forecast-bill-')) {
        toast.show(
          'Esta é uma previsão automática. Para removê-la, exclua a Conta Fixa nas configurações ou lance o gasto real.',
          'success'
        )
        return
      }

      // Se for um lançamento futuro marcado, removemos o prefixo para encontrar o registro real
      const realId = id.startsWith('upcoming-') ? id.replace('upcoming-', '') : id

      const gasto = globalGastos.value.find(g => g.id === realId)
      if (gasto) {
        // Se for um gasto de auditoria, delega para a reabertura da fatura
        if (gasto.id.startsWith('audit-settlement-')) {
          await reabrirFaturaManualComTrava(gasto.faturaId)
          return
        }

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
        await localGastoService.excluirGasto(realId)
        await cartoesEFaturas.inicializar()
        toast.show('Lançamento estornado com sucesso', 'success')
      } catch (error: any) {
        toast.show(error.message || 'Erro ao excluir gasto', 'error')
      }
    }
  }
}
