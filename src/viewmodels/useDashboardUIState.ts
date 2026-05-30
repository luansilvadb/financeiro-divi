import { ref } from 'vue'
import { formatarMesAno } from '../shared/utils/meses'

export function useDashboardUIState() {
  const modalStack = ref<string[]>([])
  const abrirModal = (n: string) => !modalStack.value.includes(n) && modalStack.value.push(n)
  const fecharModal = (n: string) => modalStack.value = modalStack.value.filter(x => x !== n)
  const isModalNoTopo = (n: string) => modalStack.value[modalStack.value.length - 1] === n

  const gastoParaAjustar = ref<any | null>(null)
  const billSelecionada = ref<any | null>(null)
  const nomeNovoPeriodo = ref('')
  const nettingTarget = ref<any | null>(null)
  const isDropdownAbertosOpen = ref(false)
  const isSubmittingPix = ref(false)
  const itemParaEstornar = ref<any | null>(null)
  const itemTypeParaEstornar = ref('')

  return {
    modalStack, abrirModal, fecharModal, isModalNoTopo,
    gastoParaAjustar, billSelecionada, nomeNovoPeriodo, nettingTarget,
    isDropdownAbertosOpen, isSubmittingPix, itemParaEstornar, itemTypeParaEstornar,
    abrirConfirmacaoEstornoGasto: (g: any) => { itemParaEstornar.value = g; itemTypeParaEstornar.value = 'Lançamento'; abrirModal('confirmacao-estorno') },
    abrirConfirmacaoEstornoBill: (b: any) => { itemParaEstornar.value = b; itemTypeParaEstornar.value = 'Conta Fixa'; abrirModal('confirmacao-estorno') },
    abrirLancarBill: (b: any) => { billSelecionada.value = b; abrirModal('lancar-conta-fixa') },
    abrirConfigurarBill: (b: any) => { billSelecionada.value = b; abrirModal('configurar-conta-fixa') },
    abrirNovoBill: () => { billSelecionada.value = null; abrirModal('configurar-conta-fixa') },
    abrirAjustarGasto: (g: any) => { gastoParaAjustar.value = g; abrirModal('ajustar-gasto') },
    abrirBottomSheetNetting: (t: any) => { nettingTarget.value = t; abrirModal('netting') },
    abrirNovoPeriodoBottomSheet: (f: any) => {
      nomeNovoPeriodo.value = f ? formatarMesAno((f.periodo.mes % 12) + 1, f.periodo.mes === 12 ? f.periodo.ano + 1 : f.periodo.ano) : ''
      abrirModal('novo-periodo')
    }
  }
}
