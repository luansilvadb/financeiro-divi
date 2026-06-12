import { ref } from 'vue'
import { formatarMesAno } from '../shared/utils/meses'
import type { Gasto } from '../models/entities/Gasto'
import type { ContaFixa } from '../models/entities/ContaFixa'
import type { Fatura } from '../models/entities/Fatura'
import type { AuditLogDto } from '../models/repositories/http/HttpAuditLogRepository'

export function useDashboardUIState() {
  const modalStack = ref<string[]>([])
  const abrirModal = (n: string) => !modalStack.value.includes(n) && modalStack.value.push(n)
  const fecharModal = (n: string) => modalStack.value = modalStack.value.filter(x => x !== n)
  const isModalNoTopo = (n: string) => modalStack.value[modalStack.value.length - 1] === n

  const gastoParaAjustar = ref<Gasto | null>(null)
  const billSelecionada = ref<ContaFixa | null>(null)
  const nomeNovoPeriodo = ref('')
  const isDropdownAbertosOpen = ref(false)
  const isSubmittingPix = ref(false)
  const itemParaEstornar = ref<Gasto | ContaFixa | null>(null)
  const itemTypeParaEstornar = ref('')
  const nettingTarget = ref<any | null>(null)
  
  const auditLogs = ref<AuditLogDto[]>([])
  const isLogsLoading = ref(false)

  return {
    modalStack, abrirModal, fecharModal, isModalNoTopo,
    gastoParaAjustar, billSelecionada, nomeNovoPeriodo,
    isDropdownAbertosOpen, isSubmittingPix, itemParaEstornar, itemTypeParaEstornar,
    nettingTarget,
    auditLogs, isLogsLoading,
    abrirConfirmacaoEstornoGasto: (g: Gasto) => { itemParaEstornar.value = g; itemTypeParaEstornar.value = 'Lançamento'; abrirModal('confirmacao-estorno') },
    abrirConfirmacaoEstornoBill: (b: ContaFixa) => { itemParaEstornar.value = b; itemTypeParaEstornar.value = 'Conta Fixa'; abrirModal('confirmacao-estorno') },
    abrirLancarBill: (b: ContaFixa) => { billSelecionada.value = b; abrirModal('lancar-conta-fixa') },
    abrirConfigurarBill: (b: ContaFixa) => { billSelecionada.value = b; abrirModal('configurar-conta-fixa') },
    abrirNovoBill: () => { billSelecionada.value = null; abrirModal('configurar-conta-fixa') },
    abrirAjustarGasto: (g: Gasto) => { gastoParaAjustar.value = g; abrirModal('ajustar-gasto') },
    abrirBottomSheetNetting: (t: any) => { nettingTarget.value = t; abrirModal('acerto-netting') },
    abrirNovoPeriodoBottomSheet: (f: Fatura | null) => {
      nomeNovoPeriodo.value = f ? formatarMesAno((f.periodo.mes % 12) + 1, f.periodo.mes === 12 ? f.periodo.ano + 1 : f.periodo.ano) : ''
      abrirModal('novo-periodo')
    }
  }
}
