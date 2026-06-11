import { computed } from 'vue'
import { Fatura } from '../models/entities/Fatura'
import { Cartao } from '../models/entities/Cartao'
import { useCartoesEFaturas } from './useCartoesEFaturas'
import { useContasFixas } from './useContasFixas'
import { useDashboardUIState } from './useDashboardUIState'
import { useDashboardPeriodos } from './useDashboardPeriodos'
import { useDashboardNetting } from './useDashboardNetting'
import { valorParcelaAtual } from '../models/entities/ParcelaCalculator'
import { formatarMesAno, NOMES_MESES } from '../shared/utils/meses'
import { useToast } from '../composables/useToast'
import { gastoPertenceAoPeriodo } from '../shared/utils/gastoPeriodo'
import { gastoService, faturaService } from '../shared/container'
import { Dinheiro } from '../models/entities/Dinheiro'
import { DivisaoDeGasto } from '../models/entities/DivisaoDeGasto'
import type { Gasto } from '../models/entities/Gasto'
import type { ContaFixa } from '../models/entities/ContaFixa'

export interface ConfirmarAjusteGastoInput {
  descricao: string
  valorTotal: Dinheiro
  compradorId: string
  method: 'pix' | 'card'
  cardOwner: string | null
  divisoes: DivisaoDeGasto[]
  installments: number
}

export interface ConfirmarLancarBillInput {
  valorCentavos: number
  compradorId: string
  splitIds: string[]
}

export interface DashboardProps { membros: { id: string; nome: string }[]; faturasAbertas: Fatura[]; faturasFechadas: Fatura[]; cartoes: Cartao[] }

const isGastoValidoParaSoma = (gasto: Gasto) => !gasto.id.startsWith('audit-settlement-') && (!gasto.isSettlement || gasto.descricao.includes('Saldo Inicial'));
const isGastoComum = (gasto: Gasto) => !gasto.isSettlement;

export const useDashboardViewModel = (
  props: DashboardProps,
  emit: (event: 'periodoStatusChanged', isLocked: boolean) => void
) => {
  const ui = useDashboardUIState()
  const toast = useToast()
  const cartoesEFaturas = useCartoesEFaturas()
  const contasFixas = useContasFixas()
  const periodosState = useDashboardPeriodos(() => props.faturasAbertas, () => props.faturasFechadas, () => props.cartoes, () => props.membros, emit)
  
  const periodoSelecionado = periodosState.periodoSelecionado
  const todosGastos = cartoesEFaturas.gastos

  const gastosFiltrados = computed(() => todosGastos.value.filter(gasto => gastoPertenceAoPeriodo(gasto, periodoSelecionado.value.mes, periodoSelecionado.value.ano, cartoesEFaturas.faturas.value)))
  
  return {
    ...periodosState, 
    ...useDashboardNetting(computed(() => props.membros), gastosFiltrados), 
    ...ui, 
    contasFixas: contasFixas.contasFixas, 
    gastosFaturaSelecionada: gastosFiltrados, 
    
    totalPeriodoSelecionado: computed(() => gastosFiltrados.value.filter(isGastoComum).reduce((soma, gasto) => soma + valorParcelaAtual(gasto.valorTotal, gasto.installments, gasto.totalInstallments).centavos, 0)),
    totalLancamentosPeriodoSelecionado: computed(() => gastosFiltrados.value.filter(isGastoValidoParaSoma).length),
    
    getMembroNome: (id: string) => props.membros.find(m => m.id === id)?.nome || 'Desconhecido', 
    formatarDinheiro: (centavos: number) => centavos / 100, 
    formatarMesAno, 
    showToast: toast.show,
    
    abrirNovoPeriodoBottomSheet: () => ui.abrirNovoPeriodoBottomSheet(periodosState.faturaAtivaVisualizada.value),
    
    confirmarBaixaNetting: async (dados: { from: string; to: string; valor: number; method: 'pix' | 'cash'; descricao: string }) => {
      const fatura = periodosState.faturaPixPeriodoSelecionado.value
      if (!fatura) return
      
      ui.isSubmittingPix.value = true
      try {
        await gastoService.lancarGastoOuEmprestimo({
          flow: 'expense',
          paymentMethod: dados.method === 'pix' ? 'pix' : 'card',
          compradorId: dados.from,
          valor: dados.valor,
          descricao: dados.descricao,
          divisoes: [new DivisaoDeGasto(dados.to, Dinheiro.deReais(dados.valor))],
          installments: 1,
          cardOwnerId: null,
          borrowerId: null,
          periodo: fatura.periodo
        })
        
        await cartoesEFaturas.inicializar()
        ui.fecharModal('acerto-netting')
        toast.show('Acerto registrado!', 'success')
      } finally {
        ui.isSubmittingPix.value = false
      }
    },
    
    confirmarAjusteGasto: async (dados: ConfirmarAjusteGastoInput) => { 
      await cartoesEFaturas.atualizarGasto(ui.gastoParaAjustar.value!.id, dados)
      ui.fecharModal('ajustar-gasto')
      ui.gastoParaAjustar.value = null 
    },
    
    confirmarLancarBill: async (dados: ConfirmarLancarBillInput) => { 
      await contasFixas.lancarGastoContaFixa(periodosState.faturaPixPeriodoSelecionado.value!.id, ui.billSelecionada.value!, dados.valorCentavos, dados.compradorId, dados.splitIds)
      ui.fecharModal('lancar-conta-fixa')
      await cartoesEFaturas.inicializar() 
    },
    
    confirmarSalvarTemplate: (t: ContaFixa) => { 
      contasFixas.salvarContaFixa(t)
      ui.fecharModal('configurar-conta-fixa')
    },
    
    confirmarNovoPeriodo: async () => { 
      const { mes, ano } = periodoSelecionado.value
      await Promise.all(periodosState.faturasPeriodoSelecionado.value.filter(f => f.status === 'ABERTA').map(f => faturaService.fecharFatura(f.id, f.responsavelId, new Date())))
      await faturaService.assegurarFaturasAbertas(cartoesEFaturas.cartoes.value, mes === 12 ? 1 : mes + 1, mes === 12 ? ano + 1 : ano)
      await cartoesEFaturas.inicializar()
      ui.fecharModal('novo-periodo')
      toast.show(`Mês de ${NOMES_MESES[mes - 1]} encerrado!`, 'success') 
    },
    
    confirmarEstorno: async () => { 
      const i = ui.itemParaEstornar.value!
      const t = ui.itemTypeParaEstornar.value
      ui.fecharModal('confirmacao-estorno')
      ui.itemParaEstornar.value = null
      
      if (t === 'Lançamento') {
        if (i.id.startsWith('audit-settlement-')) {
          const fid = (i as Gasto).faturaId
          if (fid) return cartoesEFaturas.reabrirFatura(fid)
          return
        }
        await gastoService.excluirGasto(i.id)
        await cartoesEFaturas.inicializar()
        toast.show('Estornado', 'success')
      } else { 
        await contasFixas.excluirContaFixa(i.id)
        ui.fecharModal('configurar-conta-fixa')
        toast.show('Conta removida', 'success') 
      } 
    },
    
    estornarContaFixa: (b: ContaFixa) => ui.abrirConfirmacaoEstornoGasto(gastosFiltrados.value.find(z => z.recurringBillId === b.id)!),
    
    reabrirPeriodoSelecionado: () => Promise.all(props.faturasFechadas.filter(f => f.periodo.mes === periodoSelecionado.value.mes && f.periodo.ano === periodoSelecionado.value.ano).map(f => cartoesEFaturas.reabrirFatura(f.id)))
  }
}

export type DashboardViewModel = ReturnType<typeof useDashboardViewModel>
