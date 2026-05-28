import { ref, computed } from 'vue'
import { formatarMesAno } from '../shared/utils/meses'

export function useDashboardUIState() {
  const modalStack = ref<string[]>([])

  const abrirModal = (nome: string) => {
    if (!modalStack.value.includes(nome)) {
      modalStack.value.push(nome)
    }
  }

  const fecharModal = (nome: string) => {
    modalStack.value = modalStack.value.filter(n => n !== nome)
  }

  const isModalNoTopo = (nome: string) => {
    return modalStack.value[modalStack.value.length - 1] === nome
  }

  const showBottomSheetHistorico = computed({
    get: () => modalStack.value.includes('historico'),
    set: (val) => {
      if (val) abrirModal('historico')
      else fecharModal('historico')
    }
  })

  const showBottomSheetFechar = computed({
    get: () => modalStack.value.includes('fechar-fatura'),
    set: (val) => {
      if (val) abrirModal('fechar-fatura')
      else fecharModal('fechar-fatura')
    }
  })

  const showBottomSheetAjustar = computed({
    get: () => modalStack.value.includes('ajustar-gasto'),
    set: (val) => {
      if (val) abrirModal('ajustar-gasto')
      else fecharModal('ajustar-gasto')
    }
  })

  const showPopupLancar = computed({
    get: () => modalStack.value.includes('lancar-conta-fixa'),
    set: (val) => {
      if (val) abrirModal('lancar-conta-fixa')
      else fecharModal('lancar-conta-fixa')
    }
  })

  const showBottomSheetConfigCF = computed({
    get: () => modalStack.value.includes('configurar-conta-fixa'),
    set: (val) => {
      if (val) abrirModal('configurar-conta-fixa')
      else fecharModal('configurar-conta-fixa')
    }
  })

  const showBottomSheetNovoPeriodo = computed({
    get: () => modalStack.value.includes('novo-periodo'),
    set: (val) => {
      if (val) abrirModal('novo-periodo')
      else fecharModal('novo-periodo')
    }
  })

  const showBottomSheetNetting = computed({
    get: () => modalStack.value.includes('netting'),
    set: (val) => {
      if (val) abrirModal('netting')
      else fecharModal('netting')
    }
  })

  const showBottomSheetConfirmacaoEstorno = computed({
    get: () => modalStack.value.includes('confirmacao-estorno'),
    set: (val) => {
      if (val) abrirModal('confirmacao-estorno')
      else fecharModal('confirmacao-estorno')
    }
  })

  const faturaParaFechar = ref<any | null>(null)
  const gastoParaAjustar = ref<any | null>(null)
  const billSelecionada = ref<any | null>(null)
  const nomeNovoPeriodo = ref('')
  const nettingTarget = ref<any | null>(null)
  const showParcelasFuturas = ref(false)
  const isDropdownAbertosOpen = ref(false)
  const acertoPixId = ref<string | null>(null)
  const valorPixInput = ref(0)
  const isSubmittingPix = ref(false)

  // --- Confirmação de Estorno ---
  const itemParaEstornar = ref<any | null>(null)
  const itemTypeParaEstornar = ref('')

  const abrirConfirmacaoEstornoGasto = (gasto: any) => {
    itemParaEstornar.value = gasto
    itemTypeParaEstornar.value = 'Lançamento'
    showBottomSheetConfirmacaoEstorno.value = true
  }

  const abrirConfirmacaoEstornoBill = (bill: any) => {
    itemParaEstornar.value = bill
    itemTypeParaEstornar.value = 'Conta Fixa'
    showBottomSheetConfirmacaoEstorno.value = true
  }

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

  const abrirNovoPeriodoBottomSheet = (faturaAtiva: any) => {
    if (faturaAtiva) {
      const proximoMIdx = faturaAtiva.periodo.mes % 12
      const proximoAno = proximoMIdx === 0 ? faturaAtiva.periodo.ano + 1 : faturaAtiva.periodo.ano
      nomeNovoPeriodo.value = formatarMesAno(proximoMIdx + 1, proximoAno)
    } else {
      nomeNovoPeriodo.value = ''
    }
    showBottomSheetNovoPeriodo.value = true
  }

  const iniciarPix = (acerto: any, formatarDinheiro: (c: number) => number) => {
    acertoPixId.value = acerto.id
    valorPixInput.value = formatarDinheiro(acerto.valorAcerto.centavos - (acerto.valorPago?.centavos || 0))
  }

  return {
    modalStack,
    abrirModal,
    fecharModal,
    isModalNoTopo,
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
    showBottomSheetConfirmacaoEstorno,
    itemParaEstornar,
    itemTypeParaEstornar,
    abrirConfirmacaoEstornoGasto,
    abrirConfirmacaoEstornoBill,
    abrirLancarBill,
    abrirConfigurarBill,
    abrirNovoBill,
    abrirAjustarGasto,
    abrirBottomSheetNetting,
    abrirNovoPeriodoBottomSheet,
    iniciarPix
  }
}
