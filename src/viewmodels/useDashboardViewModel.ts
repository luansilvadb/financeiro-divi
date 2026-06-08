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
import type { Dinheiro } from '../models/entities/Dinheiro'
import type { DivisaoDeGasto } from '../models/entities/DivisaoDeGasto'
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

export interface ConfirmarBaixaNettingInput {
  from: string
  to: string
  valor: number
  descricao: string
  method: 'pix' | 'cash'
}

export interface ConfirmarLancarBillInput {
  valorCentavos: number
  compradorId: string
  splitIds: string[]
}

export interface DashboardProps { membros: { id: string; nome: string }[]; faturasAbertas: Fatura[]; faturasFechadas: Fatura[]; cartoes: Cartao[] }

export const useDashboardViewModel = (props: DashboardProps, emit: any) => {
  const ui = useDashboardUIState()
  const toast = useToast()
  const cartoesEFaturas = useCartoesEFaturas()
  const contasFixas = useContasFixas()
  const periodosState = useDashboardPeriodos(() => props.faturasAbertas, () => props.faturasFechadas, () => props.cartoes, () => props.membros, emit)
  
  const periodoSelecionado = periodosState.periodoSelecionado
  const todosGastos = cartoesEFaturas.gastos

  const gastosFiltrados = computed(() => todosGastos.value.filter(x => gastoPertenceAoPeriodo(x, periodoSelecionado.value.mes, periodoSelecionado.value.ano, cartoesEFaturas.faturas.value)))
  
  const parcelasFuturas = computed(() => gastosFiltrados.value
    .filter(x => x.installments > 1)
    .map(x => ({ 
      id: x.id, descricao: x.descricao, responsavel: x.cardOwner ? 'Cartão' : 'Pix', 
      restantes: x.installments - 1, 
      valorParcela: (x.valorTotal.centavos / x.totalInstallments) / 100, 
      totalFuturo: ((x.valorTotal.centavos / x.totalInstallments) * (x.installments - 1)) / 100 
    })))
    
  const previaCartaoAbertoPorMembro = computed(() => todosGastos.value
    .filter(x => x.method === 'card' && !x.isSettlement && !x.isLoan)
    .reduce((acc, x) => { 
      x.divisoes.forEach(d => { 
        const v = valorParcelaAtual(d.valor, x.installments, x.totalInstallments).centavos
        if (v > 0) acc[d.membroId] = (acc[d.membroId] || 0) + v 
      })
      return acc 
    }, {} as Record<string, number>))

  return {
    ...periodosState, 
    ...useDashboardNetting(computed(() => props.membros), gastosFiltrados), 
    ...ui, 
    contasFixas: contasFixas.contasFixas, 
    gastosFaturaSelecionada: gastosFiltrados, 
    parcelasFuturasDetalhadas: parcelasFuturas, 
    previaCartaoAbertoPorMembroCentavos: previaCartaoAbertoPorMembro,
    
    totalFuturasVencer: computed(() => parcelasFuturas.value.reduce((a, x) => a + x.totalFuturo, 0)),
    totalPreviaCartaoAbertoCentavos: computed(() => Object.values(previaCartaoAbertoPorMembro.value).reduce((a, v) => a + v, 0)),
    totalPeriodoSelecionado: computed(() => gastosFiltrados.value.filter(x => !x.isSettlement).reduce((s, x) => s + valorParcelaAtual(x.valorTotal, x.installments, x.totalInstallments).centavos, 0)),
    totalLancamentosPeriodoSelecionado: computed(() => gastosFiltrados.value.filter(x => !x.id.startsWith('audit-settlement-') && (!x.isSettlement || x.descricao.includes('Saldo Inicial'))).length),
    
    getMembroNome: (id: string) => props.membros.find(m => m.id === id)?.nome || 'Desconhecido', 
    formatarDinheiro: (c: number) => c / 100, 
    formatarMesAno, 
    showToast: toast.show,
    
    abrirNovoPeriodoBottomSheet: () => ui.abrirNovoPeriodoBottomSheet(periodosState.faturaAtivaVisualizada.value),
    
    confirmarAjusteGasto: async (d: ConfirmarAjusteGastoInput) => { 
      await cartoesEFaturas.atualizarGasto(ui.gastoParaAjustar.value!.id, d)
      ui.fecharModal('ajustar-gasto')
      ui.gastoParaAjustar.value = null 
    },
    
    confirmarBaixaNetting: async (d: ConfirmarBaixaNettingInput) => { 
      ui.isSubmittingPix.value = true
      try {
        await gastoService.registrarAcertoNetting({ faturaId: periodosState.faturaPixPeriodoSelecionado.value!.id, fromMemberId: d.from, toMemberId: d.to, valor: d.valor, descricao: d.descricao, method: d.method })
        ui.fecharModal('netting')
        ui.nettingTarget.value = null
        await cartoesEFaturas.inicializar()
      } finally {
        ui.isSubmittingPix.value = false
      }
    },
    
    confirmarLancarBill: async (d: ConfirmarLancarBillInput) => { 
      await contasFixas.lancarGastoContaFixa(periodosState.faturaPixPeriodoSelecionado.value!.id, ui.billSelecionada.value!, d.valorCentavos, d.compradorId, d.splitIds)
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
        if (i.id.startsWith('audit-settlement-')) return cartoesEFaturas.reabrirFatura((i as Gasto).faturaId)
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
    
    reabrirPeriodoSelecionado: () => Promise.all(props.faturasFechadas.filter(f => f.periodo.mes === periodoSelecionado.value.mes && f.periodo.ano === periodoSelecionado.value.ano).map(f => cartoesEFaturas.reabrirFatura(f.id))),
    
    excluirGasto: async (id: string) => { 
      await gastoService.excluirGasto(id)
      await cartoesEFaturas.inicializar()
      toast.show('Lançamento estornado', 'success') 
    }
  }
}
