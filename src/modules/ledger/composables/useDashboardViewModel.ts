import { ref, watch, computed, toRef } from 'vue'
import { Fatura } from '../core/domain/Fatura'
import { Gasto } from '../core/domain/Gasto'
import { DivisaoDeGasto } from '../core/domain/DivisaoDeGasto'
import { Dinheiro } from '../../../shared/primitives/Dinheiro'
import { useCartoesEFaturas } from './useCartoesEFaturas'
import { useContasFixas } from './useContasFixas'
import { useFaturaRollover } from './useFaturaRollover'
import { useSaldosUnificados } from './useSaldosUnificados'
import { useDashboardCalculations } from './useDashboardCalculations'
import { LocalStorageGastoRepository } from '../adapters/LocalStorageGastoRepository'
import { LocalStorageFaturaRepository } from '../adapters/LocalStorageFaturaRepository'
import { FaturaRolloverService } from '../core/services/FaturaRolloverService'
import type { IGastoRepository } from '../core/ports/IGastoRepository'
import type { IFaturaRepository } from '../core/ports/IFaturaRepository'

export interface DashboardProps {
  membros: { id: string; nome: string; ativo?: boolean }[]
  faturasAbertas: any[]
  faturasFechadas: any[]
  acertosPendentes: any[]
  cartoes: any[]
  calcularConsumo: (faturaId: string, membroId: string) => number
  gastos?: any[]
  activeTab?: any
}

export interface DashboardDependencies {
  gastoRepository?: IGastoRepository
  faturaRepository?: IFaturaRepository
  faturaRolloverService?: FaturaRolloverService
}

export function useDashboardViewModel(
  props: DashboardProps,
  emit: any,
  dependencies: DashboardDependencies = {}
) {
  const gastoRepo = dependencies.gastoRepository || new LocalStorageGastoRepository()
  const faturaRepo = dependencies.faturaRepository || new LocalStorageFaturaRepository()
  const rolloverService = dependencies.faturaRolloverService || new FaturaRolloverService(faturaRepo, gastoRepo)

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

  const periodoSelecionado = ref<{ mes: number; ano: number }>(obterPeriodoInicial())

  watch(periodoSelecionado, (novos) => {
    localStorage.setItem('divi_periodo_selecionado', JSON.stringify(novos))
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

  // UI States
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

  // Toggle Methods
  const abrirHistorico = () => { showBottomSheetHistorico.value = true }
  const fecharHistorico = () => { showBottomSheetHistorico.value = false }
  
  const abrirLancarBill = (bill: any) => {
    billSelecionada.value = bill
    showPopupLancar.value = true
  }
  const fecharLancarBill = () => { showPopupLancar.value = false }

  const abrirConfigurarBill = (bill: any) => {
    billSelecionada.value = bill
    showBottomSheetConfigCF.value = true
  }
  const abrirNovoBill = () => {
    billSelecionada.value = null
    showBottomSheetConfigCF.value = true
  }
  const fecharConfigurarBill = () => { showBottomSheetConfigCF.value = false }

  const abrirAjustarGasto = (gasto: any) => {
    gastoParaAjustar.value = gasto
    showBottomSheetAjustar.value = true
  }
  const fecharAjustarGasto = () => { showBottomSheetAjustar.value = false }

  const abrirBottomSheetNetting = (transferencia: any) => {
    nettingTarget.value = transferencia
    showBottomSheetNetting.value = true
  }
  const fecharBottomSheetNetting = () => { showBottomSheetNetting.value = false }

  // Composables and Services Integration
  const cartoesEFaturas = useCartoesEFaturas()
  const { contasFixas, salvarContaFixa, excluirContaFixa, lancarGastoContaFixa } = useContasFixas()
  const { executarRolloverPeriodo } = useFaturaRollover({
    faturaRepository: faturaRepo,
    gastoRepository: gastoRepo,
    faturaRolloverService: rolloverService
  })
  const { calcularSaldosUnificados, calcularTransacoesNetting } = useSaldosUnificados()

  const {
    registrarReembolsoParcialManual,
    fecharFaturaManual,
    quitarAcertoMembro,
    atualizarGastoCompletoManual,
    gastos: globalGastos,
    acertos: globalAcertos
  } = cartoesEFaturas

  const faturasFiltradasCalculations = computed(() => {
    const ativa = faturaAtivaVisualizada.value
    if (!ativa) return []
    return [ativa]
  })

  // Dynamic calculations instance to track changes in globalGastos/globalAcertos
  const calculations = computed(() => {
    return useDashboardCalculations(
      toRef(props, 'membros'),
      faturasFiltradasCalculations,
      props.faturasFechadas,
      props.acertosPendentes,
      globalGastos.value,
      globalAcertos.value,
      props.calcularConsumo
    )
  })

  // Proxiers for calculations
  const getMembroNome = (id: string) => calculations.value.getMembroNome(id)
  const formatarDinheiro = (centavos: number) => calculations.value.formatarDinheiro(centavos)
  const calcularTotalFatura = (faturaId: string) => calculations.value.calcularTotalFatura(faturaId)
  const acertosDaFatura = (faturaId: string) => calculations.value.acertosDaFatura(faturaId)
  const gastosDaFatura = (faturaId: string) => calculations.value.gastosDaFatura(faturaId)
  const todosOsAcertosQuitados = (faturaId: string) => calculations.value.todosOsAcertosQuitados(faturaId)
  const currentMonthName = computed(() => calculations.value.currentMonthName.value)
  const currentYear = computed(() => calculations.value.currentYear.value)
  const parcelasFuturasDetalhadas = computed(() => calculations.value.parcelasFuturasDetalhadas.value)

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

  const nettingTransferencias = computed(() => {
    return calcularTransacoesNetting(saldosUnificadosAtivos.value)
  })

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

  // Business Actions
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

  const sugerirProximoPeriodoLocal = (fat: any) => {
    if (!fat) return ''
    const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
    const mIdx = fat.periodo.mes - 1
    const proximoMIdx = (mIdx + 1) % 12
    const proximoAno = proximoMIdx === 0 ? fat.periodo.ano + 1 : fat.periodo.ano
    return `${meses[proximoMIdx]} ${proximoAno}`
  }

  const abrirNovoPeriodoBottomSheet = () => {
    nomeNovoPeriodo.value = sugerirProximoPeriodoLocal(faturaAtivaVisualizada.value)
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

    const acertoGasto = new Gasto({
      id: crypto.randomUUID(),
      faturaId: activeFaturaId,
      descricao: dados.descricao,
      valorTotal: Dinheiro.deReais(dados.valor),
      compradorId: dados.from,
      divisoes: [new DivisaoDeGasto(dados.to, Dinheiro.deReais(dados.valor))],
      isSettlement: true,
      settlementDetails: {
        fromMemberId: dados.from,
        toMemberId: dados.to,
        method: dados.method as any
      },
      installments: 1,
      isLoan: false
    })

    await gastoRepo.salvar(acertoGasto)
    showBottomSheetNetting.value = false
    nettingTarget.value = null
    await cartoesEFaturas.inicializar()
  }

  const excluirGasto = async (id: string) => {
    await gastoRepo.excluir(id)
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

  const formatarMesAno = (mes: number, ano: number) => {
    const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
    return `${meses[mes - 1]} ${ano}`
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
    abrirHistorico,
    fecharHistorico,
    abrirLancarBill,
    fecharLancarBill,
    abrirConfigurarBill,
    abrirNovoBill,
    fecharConfigurarBill,
    abrirAjustarGasto,
    fecharAjustarGasto,
    abrirBottomSheetNetting,
    fecharBottomSheetNetting,
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
