import { ref } from 'vue'
import { formatarMesAno } from '../shared/utils/meses'

export function useDashboardUIState() {
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

  // --- Confirmação de Estorno ---
  const showBottomSheetConfirmacaoEstorno = ref(false)
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
